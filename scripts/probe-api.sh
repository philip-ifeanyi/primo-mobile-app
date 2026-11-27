#!/usr/bin/env bash
# Capture the real shape of the Primo backend's responses.
#
# Run this yourself — it needs curl -k, because the backend's certificate is
# expired and self-signed (see scripts/dev-api-proxy.mjs for the detail).
#
#   bash scripts/probe-api.sh 'user@example.com' 'password'
#
# Everything lands in ./api-probe/ as JSON. Nothing here writes data: it
# authenticates, then issues reads plus the two *verification* calls whose
# response shape the code currently has to guess at.

set -uo pipefail

EMAIL="${1:?usage: probe-api.sh EMAIL PASSWORD}"
PASSWORD="${2:?usage: probe-api.sh EMAIL PASSWORD}"
BASE="${PRIMO_API:-https://104.131.48.195:44301/api}"
OUT="api-probe"
mkdir -p "$OUT"

C=(curl -sS -k -m 30)

hit() { # name method path [body]
  local name="$1" method="$2" path="$3" body="${4:-}"
  local code
  if [ -n "$body" ]; then
    code=$("${C[@]}" -o "$OUT/$name.json" -w '%{http_code}' -X "$method" "$BASE$path" \
      -H 'Content-Type: application/json' -H 'Accept: */*' \
      ${TOKEN:+-H "Authorization: Bearer $TOKEN"} --data "$body")
  else
    code=$("${C[@]}" -o "$OUT/$name.json" -w '%{http_code}' -X "$method" "$BASE$path" \
      -H 'Accept: */*' ${TOKEN:+-H "Authorization: Bearer $TOKEN"})
  fi
  printf '%-28s %-6s %-46s %s\n' "$name" "$method" "$path" "$code"
}

echo "=== 1. the whole contract, if it is exposed ==="
for s in /swagger/v1/swagger.json /../swagger/v1/swagger.json /swagger.json; do
  code=$("${C[@]}" -o "$OUT/swagger.json" -w '%{http_code}' "$BASE$s")
  echo "  $s -> $code"
  [ "$code" = "200" ] && { echo "  captured $(wc -c <"$OUT/swagger.json") bytes"; break; }
done

echo
echo "=== 2. authenticate ==="
TOKEN=""
hit auth POST /TokenAuth/Authenticate \
  "{\"userNameOrEmailAddress\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"tenantId\":1}"
TOKEN=$(node -e 'try{const d=require("./'"$OUT"'/auth.json");process.stdout.write((d.result&&(d.result.accessToken||d.result.access_token))||"")}catch(e){}' 2>/dev/null)
if [ -z "$TOKEN" ]; then
  echo "  no token — stopping. the response is in $OUT/auth.json"
  exit 1
fi
echo "  token acquired (${#TOKEN} chars)"

echo
echo "=== 3. reads ==="
hit profile      GET  /services/app/Profile/GetCurrentUserProfileForEdit
hit banks        GET  '/services/app/bank/getall?MaxResultCount=300'
hit kyc_status   GET  /services/app/Kyc/GetAll
hit categories   GET  /services/app/Category/GetAllCategories
hit products     GET  '/services/app/Product/GetAll?MaxResultCount=50'
hit user_products GET /services/app/UserProduct/GetAll
hit mandates     GET  /services/app/Mandate/GetAll
hit referrals    GET  /services/app/Referral/GetAll
hit makes        GET  /services/app/Insurance/GetVehicleMakes

echo
echo "=== 4. the two response shapes the code guesses at ==="
hit bvn   POST /services/app/BVN/Verify  '{"bvn":"22222222222"}'
hit nuban POST /services/app/nuban/Verify '{"nuban":"0000000000","bankCode":"058"}'

echo
echo "=== 5. anything that accepts a file ==="
for p in /services/app/Document/Upload /services/app/File/Upload \
         /services/app/Upload/UploadFile /services/app/Document/GetAll; do
  code=$("${C[@]}" -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE$p")
  printf '  %-44s %s\n' "$p" "$code"
done

echo
echo "wrote $OUT/ — $(ls "$OUT" | wc -l | tr -d ' ') files"
