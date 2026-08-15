#!/usr/bin/env bash
set -Eeuo pipefail

ARTIFACT_DIR="${ARTIFACT_DIR:-artifacts/12a20-kick-history-category-reprobe}"
EVIDENCE="$ARTIFACT_DIR/evidence.json"
RAW="$ARTIFACT_DIR/private"
SERVICE='viewloom-history-category-aggregate-cost-reprobe-kick'
CONFIRM='RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_REPROBE'
PROBE_DAY="$(date -u +%F)"
URL=''
PROBE_TOKEN=''
DEPLOYED=false
POST_DELETE_STATUS=-1
STAGE='initialize'
MAIN_RC=0
CLEANUP_RC=0

mkdir -p "$RAW"

json_number() {
  local file="$1" expr="$2" fallback="$3"
  if [[ -f "$file" ]] && jq -e . "$file" >/dev/null 2>&1; then
    jq -r "$expr // $fallback" "$file"
  else
    printf '%s\n' "$fallback"
  fi
}

inspect() {
  local output="$1"
  [[ -n "$URL" && -n "$PROBE_TOKEN" ]] || return 1
  local status
  status=$(curl -sS -o "$output" -w '%{http_code}' -X POST \
    -H "Authorization: Bearer $PROBE_TOKEN" \
    -H 'Content-Type: application/json' \
    --data "{\"day\":\"$PROBE_DAY\"}" \
    "$URL/inspect")
  [[ "$status" == '200' ]]
  jq -e '.ok == true' "$output" >/dev/null
}

main() {
  STAGE='verify_absent'
  local existing
  existing=$(curl -sS -o /dev/null -w '%{http_code}' \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/services/$SERVICE")
  [[ "$existing" == '404' ]]

  STAGE='deploy_temporary_worker'
  local config="$RAW/wrangler.kick.toml"
  cp workers/history-category-aggregate-cost-probe/wrangler.kick.toml "$config"
  sed -i "s|main = \"src/index.ts\"|main = \"$GITHUB_WORKSPACE/workers/history-category-aggregate-cost-probe/src/index.ts\"|" "$config"
  sed -i "s|name = \"viewloom-history-category-aggregate-cost-probe-kick\"|name = \"$SERVICE\"|" "$config"
  PROBE_TOKEN=$(openssl rand -hex 32)
  local deploy_log="$RAW/deploy.log"
  pnpm dlx wrangler@4 deploy --config "$config" >"$deploy_log" 2>&1
  DEPLOYED=true
  printf '%s' "$PROBE_TOKEN" | pnpm dlx wrangler@4 secret put PROBE_TOKEN --config "$config" >>"$deploy_log" 2>&1
  URL=$(grep -Eo 'https://[^ ]+workers.dev' "$deploy_log" | tail -1)
  [[ -n "$URL" ]]

  STAGE='pre_inspect'
  local ready=false
  for _ in $(seq 1 40); do
    if inspect "$RAW/pre.json"; then ready=true; break; fi
    sleep 5
  done
  [[ "$ready" == 'true' ]]
  jq -e '.schema.complete == true' "$RAW/pre.json" >/dev/null
  jq -e '.aggregateRows.total == 0' "$RAW/pre.json" >/dev/null
  jq -e '.providerLeakageRows == 0' "$RAW/pre.json" >/dev/null
  local latest_collected latest_source latest_streams
  latest_collected=$(jq -r '.latestSnapshot.collected_at // empty' "$RAW/pre.json")
  latest_source=$(jq -r '.latestSnapshot.source_mode // empty' "$RAW/pre.json")
  latest_streams=$(jq -r '.latestSnapshot.stream_count // 0' "$RAW/pre.json")
  [[ -n "$latest_collected" && "$latest_streams" -gt 0 ]]
  [[ "$latest_source" != 'demo' && "$latest_source" != 'fixture' && "$latest_source" != 'unconfigured' ]]
  node -e "const t=Date.parse(process.argv[1]);if(!Number.isFinite(t)||Date.now()-t>20*60*1000)process.exit(1)" "$latest_collected"

  STAGE='run_probe'
  local probe_status
  probe_status=$(curl -sS -o "$RAW/probe.json" -w '%{http_code}' -X POST \
    -H "Authorization: Bearer $PROBE_TOKEN" \
    -H "x-viewloom-confirm: $CONFIRM" \
    -H 'Content-Type: application/json' \
    --data "{\"day\":\"$PROBE_DAY\"}" \
    "$URL/probe")
  [[ "$probe_status" == '200' ]]
  jq -e '.ok == true' "$RAW/probe.json" >/dev/null
  jq -e '.rawCategoryQueryPaths == 3' "$RAW/probe.json" >/dev/null
  jq -e '.providerLeakageCheck == "indexed_exists_ranges"' "$RAW/probe.json" >/dev/null
  jq -e '.checks.aggregateRowsAuthoritative == true' "$RAW/probe.json" >/dev/null
  jq -e '.checks.cleanupSucceeded == true' "$RAW/probe.json" >/dev/null
  jq -e '.checks.postTargetRowsZero == true' "$RAW/probe.json" >/dev/null

  STAGE='measure_thresholds'
  local total_rows_read total_rows_written total_changes total_statements wall_ms pre_size post_size size_delta
  total_rows_read=$(jq '[.pre.query.rowsRead,.operation.precheck.meta.rowsRead,.operation.pendingWrite.rowsRead,.operation.writeBatch.rowsRead,(.operation.recoveryBatch.rowsRead // 0),.during.query.rowsRead,.cleanup.rowsRead,.post.query.rowsRead] | add' "$RAW/probe.json")
  total_rows_written=$(jq '[.pre.query.rowsWritten,.operation.precheck.meta.rowsWritten,.operation.pendingWrite.rowsWritten,.operation.writeBatch.rowsWritten,(.operation.recoveryBatch.rowsWritten // 0),.during.query.rowsWritten,.cleanup.rowsWritten,.post.query.rowsWritten] | add' "$RAW/probe.json")
  total_changes=$(jq '[.pre.query.changes,.operation.precheck.meta.changes,.operation.pendingWrite.changes,.operation.writeBatch.changes,(.operation.recoveryBatch.changes // 0),.during.query.changes,.cleanup.changes,.post.query.changes] | add' "$RAW/probe.json")
  total_statements=$(jq '[.pre.query.statements,.operation.precheck.meta.statements,.operation.pendingWrite.statements,.operation.writeBatch.statements,(.operation.recoveryBatch.statements // 0),.during.query.statements,.cleanup.statements,.post.query.statements] | add' "$RAW/probe.json")
  wall_ms=$(jq -r '.workerWallMs' "$RAW/probe.json")
  pre_size=$(jq -r '.pre.query.sizeAfter // 0' "$RAW/probe.json")
  post_size=$(jq -r '.post.query.sizeAfter // 0' "$RAW/probe.json")
  size_delta=$((post_size-pre_size))

  jq -n \
    --argjson rowsRead "$total_rows_read" \
    --argjson rowsWritten "$total_rows_written" \
    --argjson changes "$total_changes" \
    --argjson statements "$total_statements" \
    --argjson wallMs "$wall_ms" \
    --argjson sizeDelta "$size_delta" \
    '{rowsRead:$rowsRead,rowsWritten:$rowsWritten,changes:$changes,statements:$statements,wallMs:$wallMs,sizeDelta:$sizeDelta}' > "$RAW/metrics.json"

  if (( total_rows_read > 250000 )); then
    echo "rows_read threshold exceeded: $total_rows_read > 250000" >&2
    return 42
  fi
  (( total_rows_written <= 5000 )) || return 43
  (( total_changes <= 3000 )) || return 44
  (( total_statements <= 40 )) || return 45
  node -e "const v=Number(process.argv[1]);if(!Number.isFinite(v)||v>20000)process.exit(1)" "$wall_ms" || return 46
  (( size_delta <= 1048576 )) || return 47

  STAGE='thresholds_passed'
}

cleanup() {
  local rc=0
  STAGE='cleanup'

  if [[ "$DEPLOYED" == 'true' ]]; then
    if [[ -n "$URL" && -n "$PROBE_TOKEN" ]]; then
      inspect "$RAW/post-cleanup.json" || rc=51
      if [[ -f "$RAW/post-cleanup.json" ]]; then
        jq -e '.aggregateRows.total == 0' "$RAW/post-cleanup.json" >/dev/null || rc=52
        jq -e '.providerLeakageRows == 0' "$RAW/post-cleanup.json" >/dev/null || rc=53
      fi
    else
      rc=54
    fi

    local delete_response
    delete_response=$(curl -sS -X DELETE \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H 'Content-Type: application/json' \
      "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/services/$SERVICE" || true)
    [[ $(jq -r '.success // false' <<<"$delete_response" 2>/dev/null || printf false) == 'true' ]] || rc=55

    POST_DELETE_STATUS=$(curl -sS -o /dev/null -w '%{http_code}' \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/services/$SERVICE" || printf '000')
    [[ "$POST_DELETE_STATUS" == "404" ]] || rc=56
  fi

  return "$rc"
}

write_evidence() {
  local final_rc="$1"
  local metrics='null' pre='null' probe='null' post='null'
  [[ -f "$RAW/metrics.json" ]] && metrics=$(cat "$RAW/metrics.json")
  [[ -f "$RAW/pre.json" ]] && jq -e . "$RAW/pre.json" >/dev/null 2>&1 && pre=$(cat "$RAW/pre.json")
  [[ -f "$RAW/probe.json" ]] && jq -e . "$RAW/probe.json" >/dev/null 2>&1 && probe=$(cat "$RAW/probe.json")
  [[ -f "$RAW/post-cleanup.json" ]] && jq -e . "$RAW/post-cleanup.json" >/dev/null 2>&1 && post=$(cat "$RAW/post-cleanup.json")

  jq -n \
    --arg schemaVersion 'viewloom-12a20-kick-history-category-reprobe-evidence-v1' \
    --arg status "$([[ "$final_rc" == '0' ]] && printf pass || printf failure)" \
    --arg failedAtStage "$STAGE" \
    --arg headSha "$GITHUB_SHA" \
    --arg probeDay "$PROBE_DAY" \
    --argjson exitCode "$final_rc" \
    --argjson cleanupExitCode "$CLEANUP_RC" \
    --argjson postDeleteHttpStatus "$POST_DELETE_STATUS" \
    --argjson metrics "$metrics" \
    --argjson pre "$pre" \
    --argjson probe "$probe" \
    --argjson post "$post" \
    '{schemaVersion:$schemaVersion,status:$status,provider:"kick",headSha:$headSha,probeDay:$probeDay,exitCode:$exitCode,cleanupExitCode:$cleanupExitCode,failedAtStage:$failedAtStage,cost:$metrics,pre:{schemaComplete:($pre.schema.complete // null),aggregateRows:($pre.aggregateRows.total // null),providerLeakageRows:($pre.providerLeakageRows // null),latestSnapshotMinute:($pre.latestSnapshot.bucket_minute // null),sourceMode:($pre.latestSnapshot.source_mode // null)},probe:{rawCategoryQueryPaths:($probe.rawCategoryQueryPaths // null),coverageState:($probe.operation.coverageState // null),candidateCategoryRows:($probe.operation.precheck.candidateCategoryRows // null),candidateStreamerCategoryRows:($probe.operation.precheck.candidateStreamerCategoryRows // null),generatedCategoryRows:($probe.operation.generatedCategoryRows // null),generatedStreamerCategoryRows:($probe.operation.generatedStreamerCategoryRows // null),cleanupSucceeded:($probe.checks.cleanupSucceeded // null)},postCleanup:{aggregateRows:($post.aggregateRows.total // null),providerLeakageRows:($post.providerLeakageRows // null)},temporaryWorkerDeleted:($postDeleteHttpStatus==404),postDeleteHttpStatus:$postDeleteHttpStatus,thresholds:{rowsReadMaximum:250000,rowsWrittenMaximum:5000,changesMaximum:3000,statementsMaximum:40,workerWallMsMaximum:20000,sizeIncreaseMaximumBytes:1048576},boundaries:{permanentGeneratorEnabled:false,collectorChanged:false,newCron:false,backfill:false,rawRetentionChanged:false,historyApiCategoryEnabled:false,historyCategoryUiEnabled:false,twitchChanged:false,crossProviderBehaviorChanged:false}}' > "$EVIDENCE"
}

main || MAIN_RC=$?
cleanup || CLEANUP_RC=$?

FINAL_RC="$MAIN_RC"
if (( CLEANUP_RC != 0 && FINAL_RC == 0 )); then
  FINAL_RC="$CLEANUP_RC"
fi

write_evidence "$FINAL_RC"
rm -rf "$RAW"
exit "$FINAL_RC"
