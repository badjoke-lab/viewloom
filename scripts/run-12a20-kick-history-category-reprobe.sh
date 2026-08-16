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
MAIN_FAILED_STAGE=''
CLEANUP_RC=0

mkdir -p "$RAW"

inspect() {
  local output="$1"
  [[ -n "$URL" && -n "$PROBE_TOKEN" ]] || return 1
  local status
  status=$(curl -sS -o "$output" -w '%{http_code}' -X POST \
    -H "Authorization: Bearer $PROBE_TOKEN" \
    -H 'Content-Type: application/json' \
    --data "{\"day\":\"$PROBE_DAY\"}" \
    "$URL/inspect") || return 2
  [[ "$status" == '200' ]] || return 3
  jq -e '.ok == true' "$output" >/dev/null || return 4
}

main() {
  STAGE='verify_absent'
  local existing
  existing=$(curl -sS -o /dev/null -w '%{http_code}' \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/services/$SERVICE") || return 11
  [[ "$existing" == '404' ]] || return 12

  STAGE='deploy_temporary_worker'
  local config="$RAW/wrangler.kick.toml"
  cp workers/history-category-aggregate-cost-probe/wrangler.kick.toml "$config" || return 13
  sed -i "s|main = \"src/index.ts\"|main = \"$GITHUB_WORKSPACE/workers/history-category-aggregate-cost-probe/src/index.ts\"|" "$config" || return 14
  sed -i "s|name = \"viewloom-history-category-aggregate-cost-probe-kick\"|name = \"$SERVICE\"|" "$config" || return 15
  PROBE_TOKEN=$(openssl rand -hex 32) || return 16
  local deploy_log="$RAW/deploy.log"
  pnpm dlx wrangler@4 deploy --config "$config" >"$deploy_log" 2>&1 || return 17
  DEPLOYED=true
  printf '%s' "$PROBE_TOKEN" | pnpm dlx wrangler@4 secret put PROBE_TOKEN --config "$config" >>"$deploy_log" 2>&1 || return 18
  URL=$(grep -Eo 'https://[^ ]+workers.dev' "$deploy_log" | tail -1) || return 19
  [[ -n "$URL" ]] || return 20

  STAGE='pre_inspect'
  local ready=false
  for _ in {1..40}; do
    if inspect "$RAW/pre.json"; then
      ready=true
      break
    fi
    sleep 5
  done
  [[ "$ready" == 'true' ]] || return 21
  jq -e '.schema.complete == true' "$RAW/pre.json" >/dev/null || return 22
  jq -e '.aggregateRows.total == 0' "$RAW/pre.json" >/dev/null || return 23
  jq -e '.providerLeakageRows == 0' "$RAW/pre.json" >/dev/null || return 24

  local latest_collected latest_source latest_streams
  latest_collected=$(jq -er '.latestSnapshot.collected_at | select(type == "string" and length > 0)' "$RAW/pre.json") || return 25
  latest_source=$(jq -er '.latestSnapshot.source_mode | select(type == "string" and length > 0)' "$RAW/pre.json") || return 26
  latest_streams=$(jq -er '.latestSnapshot.stream_count | select(type == "number") | floor' "$RAW/pre.json") || return 27
  [[ "$latest_streams" -gt 0 ]] || return 28
  [[ "$latest_source" != 'demo' && "$latest_source" != 'fixture' && "$latest_source" != 'unconfigured' ]] || return 29
  node -e "const t=Date.parse(process.argv[1]);if(!Number.isFinite(t)||Date.now()-t>20*60*1000)process.exit(1)" "$latest_collected" || return 30

  STAGE='run_probe'
  local probe_status
  probe_status=$(curl -sS -o "$RAW/probe.json" -w '%{http_code}' -X POST \
    -H "Authorization: Bearer $PROBE_TOKEN" \
    -H "x-viewloom-confirm: $CONFIRM" \
    -H 'Content-Type: application/json' \
    --data "{\"day\":\"$PROBE_DAY\"}" \
    "$URL/probe") || return 31
  [[ "$probe_status" == '200' ]] || return 32
  jq -e '.ok == true' "$RAW/probe.json" >/dev/null || return 33
  jq -e '.rawCategoryQueryPaths == 3' "$RAW/probe.json" >/dev/null || return 34
  jq -e '.providerLeakageCheck == "indexed_exists_ranges"' "$RAW/probe.json" >/dev/null || return 35
  jq -e '.checks.aggregateRowsAuthoritative == true' "$RAW/probe.json" >/dev/null || return 36
  jq -e '.checks.cleanupSucceeded == true' "$RAW/probe.json" >/dev/null || return 37
  jq -e '.checks.postTargetRowsZero == true' "$RAW/probe.json" >/dev/null || return 38

  STAGE='measure_thresholds'
  local total_rows_read total_rows_written total_changes total_statements wall_ms pre_size post_size size_delta
  total_rows_read=$(jq -er '[.pre.query.rowsRead,.operation.precheck.meta.rowsRead,.operation.pendingWrite.rowsRead,.operation.writeBatch.rowsRead,(.operation.recoveryBatch.rowsRead // 0),.during.query.rowsRead,.cleanup.rowsRead,.post.query.rowsRead] | add | select(type == "number") | floor' "$RAW/probe.json") || return 61
  total_rows_written=$(jq -er '[.pre.query.rowsWritten,.operation.precheck.meta.rowsWritten,.operation.pendingWrite.rowsWritten,.operation.writeBatch.rowsWritten,(.operation.recoveryBatch.rowsWritten // 0),.during.query.rowsWritten,.cleanup.rowsWritten,.post.query.rowsWritten] | add | select(type == "number") | floor' "$RAW/probe.json") || return 62
  total_changes=$(jq -er '[.pre.query.changes,.operation.precheck.meta.changes,.operation.pendingWrite.changes,.operation.writeBatch.changes,(.operation.recoveryBatch.changes // 0),.during.query.changes,.cleanup.changes,.post.query.changes] | add | select(type == "number") | floor' "$RAW/probe.json") || return 63
  total_statements=$(jq -er '[.pre.query.statements,.operation.precheck.meta.statements,.operation.pendingWrite.statements,.operation.writeBatch.statements,(.operation.recoveryBatch.statements // 0),.during.query.statements,.cleanup.statements,.post.query.statements] | add | select(type == "number") | floor' "$RAW/probe.json") || return 64
  wall_ms=$(jq -er '.workerWallMs | select(type == "number")' "$RAW/probe.json") || return 65
  pre_size=$(jq -er '.pre.query.sizeAfter | select(type == "number") | floor' "$RAW/probe.json") || return 66
  post_size=$(jq -er '.post.query.sizeAfter | select(type == "number") | floor' "$RAW/probe.json") || return 67
  size_delta=$((post_size-pre_size))

  jq -n \
    --argjson rowsRead "$total_rows_read" \
    --argjson rowsWritten "$total_rows_written" \
    --argjson changes "$total_changes" \
    --argjson statements "$total_statements" \
    --argjson wallMs "$wall_ms" \
    --argjson sizeDelta "$size_delta" \
    '{rowsRead:$rowsRead,rowsWritten:$rowsWritten,changes:$changes,statements:$statements,wallMs:$wallMs,sizeDelta:$sizeDelta}' > "$RAW/metrics.json" || return 68

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
  return 0
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
  local failed_stage="$2"
  local metrics='null' pre='null' probe='null' post='null'
  [[ -f "$RAW/metrics.json" ]] && metrics=$(cat "$RAW/metrics.json")
  [[ -f "$RAW/pre.json" ]] && jq -e . "$RAW/pre.json" >/dev/null 2>&1 && pre=$(cat "$RAW/pre.json")
  [[ -f "$RAW/probe.json" ]] && jq -e . "$RAW/probe.json" >/dev/null 2>&1 && probe=$(cat "$RAW/probe.json")
  [[ -f "$RAW/post-cleanup.json" ]] && jq -e . "$RAW/post-cleanup.json" >/dev/null 2>&1 && post=$(cat "$RAW/post-cleanup.json")

  jq -n \
    --arg schemaVersion 'viewloom-12a20-kick-history-category-reprobe-evidence-v1' \
    --arg status "$([[ "$final_rc" == '0' ]] && printf pass || printf failure)" \
    --arg failedAtStage "$failed_stage" \
    --arg headSha "$GITHUB_SHA" \
    --arg probeDay "$PROBE_DAY" \
    --argjson exitCode "$final_rc" \
    --argjson cleanupExitCode "$CLEANUP_RC" \
    --argjson postDeleteHttpStatus "$POST_DELETE_STATUS" \
    --argjson metrics "$metrics" \
    --argjson pre "$pre" \
    --argjson probe "$probe" \
    --argjson post "$post" \
    '{schemaVersion:$schemaVersion,status:$status,provider:"kick",headSha:$headSha,probeDay:$probeDay,exitCode:$exitCode,cleanupExitCode:$cleanupExitCode,failedAtStage:(if $failedAtStage == "" then null else $failedAtStage end),cost:$metrics,pre:{schemaComplete:($pre.schema.complete // null),aggregateRows:($pre.aggregateRows.total // null),providerLeakageRows:($pre.providerLeakageRows // null),latestSnapshotMinute:($pre.latestSnapshot.bucket_minute // null),sourceMode:($pre.latestSnapshot.source_mode // null)},probe:{rawCategoryQueryPaths:($probe.rawCategoryQueryPaths // null),coverageState:($probe.operation.coverageState // null),candidateCategoryRows:($probe.operation.precheck.candidateCategoryRows // null),candidateStreamerCategoryRows:($probe.operation.precheck.candidateStreamerCategoryRows // null),generatedCategoryRows:($probe.operation.generatedCategoryRows // null),generatedStreamerCategoryRows:($probe.operation.generatedStreamerCategoryRows // null),cleanupSucceeded:($probe.checks.cleanupSucceeded // null)},postCleanup:{aggregateRows:($post.aggregateRows.total // null),providerLeakageRows:($post.providerLeakageRows // null)},temporaryWorkerDeleted:($postDeleteHttpStatus==404),postDeleteHttpStatus:$postDeleteHttpStatus,thresholds:{rowsReadMaximum:250000,rowsWrittenMaximum:5000,changesMaximum:3000,statementsMaximum:40,workerWallMsMaximum:20000,sizeIncreaseMaximumBytes:1048576},boundaries:{permanentGeneratorEnabled:false,collectorChanged:false,newCron:false,backfill:false,rawRetentionChanged:false,historyApiCategoryEnabled:false,historyCategoryUiEnabled:false,twitchChanged:false,crossProviderBehaviorChanged:false}}' > "$EVIDENCE"
}

main || {
  MAIN_RC=$?
  MAIN_FAILED_STAGE="$STAGE"
}
cleanup || CLEANUP_RC=$?

FINAL_RC="$MAIN_RC"
FINAL_FAILED_STAGE="$MAIN_FAILED_STAGE"
if (( CLEANUP_RC != 0 && FINAL_RC == 0 )); then
  FINAL_RC="$CLEANUP_RC"
  FINAL_FAILED_STAGE='cleanup'
fi

write_evidence "$FINAL_RC" "$FINAL_FAILED_STAGE"
rm -rf "$RAW"
exit "$FINAL_RC"
