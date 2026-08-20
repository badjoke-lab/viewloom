#!/usr/bin/env bash
set -Eeuo pipefail

: "${CLOUDFLARE_API_TOKEN:?missing CLOUDFLARE_API_TOKEN}"
: "${CLOUDFLARE_ACCOUNT_ID:?missing CLOUDFLARE_ACCOUNT_ID}"
: "${GITHUB_SHA:?missing GITHUB_SHA}"
: "${ARTIFACT_DIR:?missing ARTIFACT_DIR}"

mkdir -p "$ARTIFACT_DIR/raw"
service='viewloom-history-category-v2-schema-apply-kick'
raw="$ARTIFACT_DIR/raw"
evidence="$ARTIFACT_DIR/evidence.json"
config="$raw/wrangler.kick.toml"
retry_of_run_id=32335017572
origin_run_id=32332864208
root_cause_artifact_id=9394373002
stage='initialize'
url=''
APPLY_TOKEN=''
deployed=false
post_delete_status=-1
last_pre_inspect_http_status=-1

summarize_state() {
  local path="$1"
  if [[ ! -s "$path" ]] || ! jq -e . "$path" >/dev/null 2>&1; then
    printf 'null'
    return
  fi
  jq -c '{
    ok:(.ok // false),
    error:(.error // null),
    state:{
      v1Schema:(.state.v1Schema // null),
      v2Schema:(.state.v2Schema // null),
      v2AggregateRows:(.state.v2AggregateRows // null),
      providerLeakageRows:(.state.providerLeakageRows // null),
      databaseSizeBytes:(.state.databaseSizeBytes // null),
      latestCollectedAt:(.state.operational.latestSnapshot.collected_at // null)
    }
  }' "$path"
}

cleanup_worker() {
  if [[ "$deployed" == 'true' ]]; then
    curl -sS -X DELETE \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H 'Content-Type: application/json' \
      "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/services/$service" \
      > "$raw/delete-response.json" 2>/dev/null || true
    post_delete_status=$(curl -sS -o /dev/null -w '%{http_code}' \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/services/$service" || true)
  fi
}

write_failure_evidence() {
  local failure_summary pre_summary
  failure_summary=$(summarize_state "$raw/failure-inspect.json")
  pre_summary=$(summarize_state "$raw/pre.json")
  jq -n \
    --arg schemaVersion 'viewloom-12a49-kick-history-v2-schema-apply-retry-evidence-v1' \
    --arg status 'failure' \
    --arg failedAtStage "$stage" \
    --arg headSha "$GITHUB_SHA" \
    --argjson retryOfRunId "$retry_of_run_id" \
    --argjson originRunId "$origin_run_id" \
    --argjson rootCauseArtifactId "$root_cause_artifact_id" \
    --argjson lastPreInspectHttpStatus "$last_pre_inspect_http_status" \
    --argjson preInspect "$pre_summary" \
    --argjson failureInspect "$failure_summary" \
    --argjson postDeleteHttpStatus "$post_delete_status" \
    '{
      schemaVersion:$schemaVersion,
      status:$status,
      provider:"kick",
      failedAtStage:$failedAtStage,
      headSha:$headSha,
      retryOfRunId:$retryOfRunId,
      originRunId:$originRunId,
      rootCauseArtifactId:$rootCauseArtifactId,
      lastPreInspectHttpStatus:$lastPreInspectHttpStatus,
      preInspect:$preInspect,
      failureInspect:$failureInspect,
      temporaryWorkerDeleted:($postDeleteHttpStatus==404),
      postDeleteHttpStatus:$postDeleteHttpStatus,
      boundaries:{
        v1GeneratorChanged:false,
        v2GeneratorEnabled:false,
        collectorChanged:false,
        newCron:false,
        backfill:false,
        retentionChanged:false,
        twitchChanged:false
      }
    }' > "$evidence"
}

failure_handler() {
  local exit_code=$?
  set +e
  if [[ "$deployed" == 'true' && -n "$url" && -n "$APPLY_TOKEN" ]]; then
    curl -sS -o "$raw/failure-inspect.json" -w '%{http_code}' -X POST \
      -H "Authorization: Bearer $APPLY_TOKEN" "$url/inspect" \
      > "$raw/failure-inspect.status" 2>/dev/null || true
  fi
  cleanup_worker
  write_failure_evidence
  exit "$exit_code"
}
trap failure_handler ERR

stage='verify_temporary_worker_absent'
existing=$(curl -sS -o /dev/null -w '%{http_code}' \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/services/$service")
[[ "$existing" == '404' ]]

cp workers/history-category-v2-schema-apply/wrangler.kick.toml "$config"
sed -i "s|main = \"src/index.ts\"|main = \"$GITHUB_WORKSPACE/workers/history-category-v2-schema-apply/src/index.ts\"|" "$config"
APPLY_TOKEN=$(openssl rand -hex 32)

stage='deploy_temporary_worker'
pnpm dlx wrangler@4 deploy --config "$config" > "$raw/deploy.log" 2>&1
deployed=true

stage='resolve_worker_url'
url=$(grep -Eo 'https://[^ ]+workers.dev' "$raw/deploy.log" | tail -1 || true)
test -n "$url"

stage='configure_apply_token'
printf '%s' "$APPLY_TOKEN" | pnpm dlx wrangler@4 secret put APPLY_TOKEN --config "$config" > "$raw/secret.log" 2>&1

stage='pre_inspect'
inspected=false
for attempt in $(seq 1 40); do
  last_pre_inspect_http_status=$(curl -sS -o "$raw/pre.json" -w '%{http_code}' -X POST \
    -H "Authorization: Bearer $APPLY_TOKEN" "$url/inspect" || true)
  if [[ "$last_pre_inspect_http_status" == '200' ]] && \
     jq -e '
       .ok == true and
       .state.v1Schema.complete == true and
       .state.v2Schema.absent == true and
       .state.v2Schema.partial == false and
       .state.v2AggregateRows.total == 0 and
       .state.providerLeakageRows == 0
     ' "$raw/pre.json" >/dev/null; then
    inspected=true
    break
  fi
  sleep 5
done
[[ "$inspected" == 'true' ]]

pre_collected=$(jq -r '.state.operational.latestSnapshot.collected_at // empty' "$raw/pre.json")
test -n "$pre_collected"
node -e "const t=Date.parse(process.argv[1]); if(!Number.isFinite(t)||Date.now()-t>20*60*1000) process.exit(1)" "$pre_collected"
pre_size=$(jq -r '.state.databaseSizeBytes // empty' "$raw/pre.json")
[[ "$pre_size" =~ ^[0-9]+$ ]]

stage='first_apply_tables_then_indexes'
first_status=$(curl -sS -o "$raw/first.json" -w '%{http_code}' -X POST \
  -H "Authorization: Bearer $APPLY_TOKEN" \
  -H 'x-viewloom-confirm: APPLY_KICK_HISTORY_CATEGORY_V2_SCHEMA_ONLY' \
  "$url/apply")
[[ "$first_status" == '200' ]]
jq -e '
  .ok == true and
  .apply.applied == true and
  .apply.tableStageStatementCount == 3 and
  .apply.indexStageStatementCount == 2 and
  .apply.metrics.statementCount == 5 and
  .post.v1Schema.complete == true and
  .post.v2Schema.complete == true and
  .post.v2AggregateRows.total == 0 and
  .post.providerLeakageRows == 0
' "$raw/first.json" >/dev/null
first_wall=$(jq -r '.workerWallMs // 999999' "$raw/first.json")
[[ "$first_wall" =~ ^[0-9]+$ ]]
[[ "$first_wall" -le 15000 ]]

stage='second_apply_noop'
second_status=$(curl -sS -o "$raw/second.json" -w '%{http_code}' -X POST \
  -H "Authorization: Bearer $APPLY_TOKEN" \
  -H 'x-viewloom-confirm: APPLY_KICK_HISTORY_CATEGORY_V2_SCHEMA_ONLY' \
  "$url/apply")
[[ "$second_status" == '200' ]]
jq -e '
  .ok == true and
  .apply.reason == "already-complete" and
  .apply.metrics.statementCount == 0
' "$raw/second.json" >/dev/null

stage='wait_for_new_natural_snapshot'
fresh=false
for attempt in $(seq 1 90); do
  status=$(curl -sS -o "$raw/post-candidate.json" -w '%{http_code}' -X POST \
    -H "Authorization: Bearer $APPLY_TOKEN" "$url/inspect" || true)
  if [[ "$status" == '200' ]] && \
     jq -e '
       .ok == true and
       .state.v1Schema.complete == true and
       .state.v2Schema.complete == true and
       .state.v2AggregateRows.total == 0 and
       .state.providerLeakageRows == 0
     ' "$raw/post-candidate.json" >/dev/null; then
    candidate=$(jq -r '.state.operational.latestSnapshot.collected_at // empty' "$raw/post-candidate.json")
    if [[ -n "$candidate" && "$candidate" != "$pre_collected" ]]; then
      cp "$raw/post-candidate.json" "$raw/post.json"
      fresh=true
      break
    fi
  fi
  sleep 10
done
[[ "$fresh" == 'true' ]]

post_size=$(jq -r '.state.databaseSizeBytes // empty' "$raw/post.json")
[[ "$post_size" =~ ^[0-9]+$ ]]
delta=$((post_size-pre_size))
[[ "$delta" -ge 0 && "$delta" -le 5242880 ]]

stage='cleanup_temporary_worker'
cleanup_worker
[[ "$post_delete_status" == '404' ]]
deployed=false

stage='write_success_evidence'
trap - ERR
jq -n \
  --arg schemaVersion 'viewloom-12a49-kick-history-v2-schema-apply-retry-evidence-v1' \
  --arg status 'pass' \
  --arg headSha "$GITHUB_SHA" \
  --arg preCollected "$pre_collected" \
  --arg postCollected "$(jq -r '.state.operational.latestSnapshot.collected_at' "$raw/post.json")" \
  --argjson retryOfRunId "$retry_of_run_id" \
  --argjson originRunId "$origin_run_id" \
  --argjson rootCauseArtifactId "$root_cause_artifact_id" \
  --argjson firstStatements "$(jq -r '.apply.metrics.statementCount' "$raw/first.json")" \
  --argjson secondStatements "$(jq -r '.apply.metrics.statementCount' "$raw/second.json")" \
  --argjson workerWallMs "$first_wall" \
  --argjson preSize "$pre_size" \
  --argjson postSize "$post_size" \
  --argjson sizeDelta "$delta" \
  --argjson postDeleteHttpStatus "$post_delete_status" \
  '{
    schemaVersion:$schemaVersion,
    status:$status,
    provider:"kick",
    headSha:$headSha,
    retryOfRunId:$retryOfRunId,
    originRunId:$originRunId,
    rootCauseArtifactId:$rootCauseArtifactId,
    preCollectedAt:$preCollected,
    postCollectedAt:$postCollected,
    firstApplyStatementCount:$firstStatements,
    secondApplyStatementCount:$secondStatements,
    firstApplyWorkerWallMs:$workerWallMs,
    preDatabaseSizeBytes:$preSize,
    postDatabaseSizeBytes:$postSize,
    databaseSizeDeltaBytes:$sizeDelta,
    v1SchemaCompleteAfter:true,
    v2SchemaCompleteAfter:true,
    v2AggregateRowsAfter:0,
    providerLeakageRowsAfter:0,
    temporaryWorkerDeleted:true,
    postDeleteHttpStatus:$postDeleteHttpStatus,
    boundaries:{
      v1GeneratorChanged:false,
      v2GeneratorEnabled:false,
      collectorChanged:false,
      newCron:false,
      backfill:false,
      retentionChanged:false,
      twitchChanged:false
    }
  }' > "$evidence"
