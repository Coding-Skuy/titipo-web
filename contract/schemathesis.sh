#!/usr/bin/env bash
# Uji berbasis properti Schemathesis terhadap contract/openapi.yaml.
#   BASE_URL     server yang diuji (default http://localhost:4010)
#   MOCK=1       jalankan mock Prism lokal dari spec di BASE_URL (tanpa backend; hanya menguji kepatuhan mock/spec)
#   SPEC         berkas spec (default contract/openapi.yaml)
#   AUTH_TOKEN   JWT admin (aud=titipo) opsional; dikirim sebagai Bearer
#   MAX_EXAMPLES contoh per operasi (default 25)
#   INCLUDE_WRITES=1 ikut menguji POST (HANYA untuk server uji)
#   SCHEMATHESIS perintah schemathesis (default `schemathesis`)
set -euo pipefail
cd "$(dirname "$0")/.."

BASE_URL="${BASE_URL:-http://localhost:4010}"
SPEC="${SPEC:-contract/openapi.yaml}"
MAX_EXAMPLES="${MAX_EXAMPLES:-25}"
SCHEMATHESIS="${SCHEMATHESIS:-schemathesis}"

if [ "${MOCK:-0}" = "1" ]; then
  port="${BASE_URL##*:}"
  bunx @stoplight/prism-cli mock -p "$port" "$SPEC" >/tmp/titipo-prism.log 2>&1 &
  mock_pid=$!
  trap 'kill "$mock_pid" 2>/dev/null || true' EXIT
  for _ in $(seq 1 30); do
    curl -s -o /dev/null "$BASE_URL/healthz" && break
    sleep 1
  done
fi

args=(run "$SPEC" --url "$BASE_URL" --max-examples "$MAX_EXAMPLES" --checks all)
# Prism tidak menegakkan auth maupun header Allow; abaikan dua check itu hanya saat MOCK=1.
if [ "${MOCK:-0}" = "1" ]; then args+=(--exclude-checks ignored_auth,unsupported_method); fi
if [ "${INCLUDE_WRITES:-0}" != "1" ]; then args+=(--include-method GET); fi
if [ -n "${AUTH_TOKEN:-}" ]; then args+=(-H "Authorization: Bearer ${AUTH_TOKEN}"); fi

"$SCHEMATHESIS" "${args[@]}"
