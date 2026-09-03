#!/usr/bin/env bash
#
# Checks a running ChômageGo demo stack over HTTP only.
#
#   ./scripts/smoke-demo-stack.sh [base-url]     # default http://localhost:8080
#
# Used by both CI jobs — the one that builds the bundle and the one that
# downloads the published artifact — so the two verify exactly the same thing.

set -euo pipefail

base="${1:-http://localhost:8080}"
password='ChomageGo2026!'
domain='demo.chomagego.example'

fail() { echo "FAIL: $*" >&2; exit 1; }
ok() { echo "  ok — $*"; }

echo "==> API health ($base)"
curl -sf "$base/api/health" | grep -q '"status":"ok"' || fail "/api/health did not answer ok"
ok "/api/health"

echo "==> Compiled frontend"
curl -sf "$base/" | grep -q '<div id="root">' || fail "the page is not the compiled index.html"
asset=$(curl -sf "$base/" | grep -o '/assets/[^"]*\.js' | head -n 1)
[ -n "$asset" ] || fail "index.html references no built bundle"
curl -sf "$base$asset" > /dev/null || fail "the entry bundle $asset is not served"
ok "index.html and $asset"
# Client-side routes must fall back to index.html, not 404.
curl -sf "$base/mes-offres" | grep -q '<div id="root">' || fail "SPA fallback is missing"
ok "SPA fallback on /mes-offres"

echo "==> Seeded offers"
offers=$(curl -sf "$base/api/offres" | jq 'length')
[ "$offers" -ge 12 ] || fail "only $offers offers: the map would look empty"
curl -sf "$base/api/offres" \
  | jq -e 'all(.lat != null and .lng != null and (.company | length) > 0)' > /dev/null \
  || fail "some offers are not placed or carry no company"
ok "$offers geolocated offers"

echo "==> Demo accounts"
seeker_jar=$(mktemp)
employer_jar=$(mktemp)
for pair in seeker:candidat employer:employeur admin:admin; do
  expected="${pair%%:*}"
  login="${pair##*:}"
  jar=$(mktemp)
  body=$(curl -sf -c "$jar" -X POST "$base/api/auth/login" \
    -H 'content-type: application/json' \
    -d "{\"email\":\"$login@$domain\",\"password\":\"$password\"}") \
    || fail "$login@$domain could not sign in"
  role=$(echo "$body" | jq -r '.role')
  name=$(echo "$body" | jq -r '.display_name')
  [ "$role" = "$expected" ] || fail "$login has role $role, expected $expected"
  [ -n "$name" ] && [ "$name" != "null" ] || fail "$login has an empty profile"
  # The httpOnly cookie must survive the proxy in front of the API.
  curl -sf -b "$jar" "$base/api/auth/me" | jq -e '.role' > /dev/null \
    || fail "the session cookie of $login does not work"
  ok "$login@$domain -> $role, $name"
  [ "$expected" = "seeker" ] && seeker_jar="$jar"
  [ "$expected" = "employer" ] && employer_jar="$jar"
done

echo "==> Signed-in screens are filled in"
applications=$(curl -sf -b "$seeker_jar" "$base/api/candidatures" | jq 'length')
[ "$applications" -ge 1 ] || fail "the job seeker's applications screen would be empty"
ok "$applications applications for the demo job seeker"
own_offers=$(curl -sf -b "$employer_jar" "$base/api/mes-offres" | jq 'length')
[ "$own_offers" -ge 2 ] || fail "the employer's offers screen would be empty"
ok "$own_offers offers for the demo employer"

echo "==> Publishing an offer is reserved to employers"
payload='{"title":"Offre de vérification","description":"Publiée par le smoke test.","address":"12 quai de la Fosse, 44000 Nantes"}'
post() {
  curl -s -o /dev/null -w '%{http_code}' "${@:2}" -X POST "$base/api/offres" \
    -H 'content-type: application/json' -d "$payload"
}
code=$(post anonymous)
[ "$code" = "401" ] || fail "anonymous publishing returned $code, expected 401"
ok "anonymous -> 401"
code=$(post seeker -b "$seeker_jar")
[ "$code" = "403" ] || fail "a job seeker publishing returned $code, expected 403"
ok "job seeker -> 403"
# The address is geocoded through the government Adresse API, so a transient
# network failure gets a couple of retries before the run is called broken.
for attempt in 1 2 3; do
  code=$(post employer -b "$employer_jar")
  [ "$code" = "201" ] && break
  echo "  attempt $attempt: employer publishing returned $code, retrying"
  sleep 5
done
[ "$code" = "201" ] || fail "an employer publishing returned $code, expected 201"
ok "employer -> 201"

echo "==> No ghost employer account was ever created"
curl -sf "$base/api/offres" | jq -e 'all((.company | length) > 0)' > /dev/null \
  || fail "an offer has no company"
ok "every offer belongs to a named employer"

echo "==> All checks passed"
