#!/usr/bin/env bash
# HTTP smoke test against a running instance.
#   BASE_URL=http://localhost:3000 INGEST_SECRET=... npm run smoke
# Without INGEST_SECRET the authenticated ingest checks are skipped.
# NOTE: with a secret it writes two clearly-named test players (SmokeTestA/B) to PlayerStats.
set -u
BASE="${BASE_URL:-http://localhost:3000}"
PASS=0; FAIL=0
ok()   { echo "  ✓ $1"; PASS=$((PASS+1)); }
bad()  { echo "  ✗ $1"; FAIL=$((FAIL+1)); }
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

echo "Smoke testing $BASE"
echo "Pages"
for p in / /server /leaderboards "/leaderboards?metric=playtime&order=asc&page=2&q=a" "/leaderboards?metric=hearts" "/leaderboards?metric=level" "/leaderboards?metric=balance&page=999" /store /login /register /robots.txt /sitemap.xml /opengraph-image; do
  c=$(code "$BASE$p"); [ "$c" = 200 ] && ok "GET $p → 200" || bad "GET $p → $c"
done
c=$(code "$BASE/definitely-not-a-page"); [ "$c" = 404 ] && ok "unknown route → 404" || bad "unknown route → $c"
c=$(code "$BASE/player/NoSuchPlayer_zq9"); [ "$c" = 404 ] && ok "unknown player profile → 404" || bad "unknown player → $c"
c=$(code "$BASE/player/not%20a%20name"); [ "$c" = 404 ] && ok "invalid player name → 404" || bad "invalid player name → $c"
c=$(code "$BASE/discord"); [ "$c" = 307 ] || [ "$c" = 308 ] && ok "/discord redirects ($c)" || bad "/discord → $c"
curl -s "$BASE/sitemap.xml" | grep -q '/leaderboards</loc>' && ok "sitemap lists /leaderboards" || bad "sitemap missing /leaderboards"
curl -s "$BASE/robots.txt" | grep -qi 'sitemap:' && ok "robots.txt points at the sitemap" || bad "robots.txt has no Sitemap line"
curl -s "$BASE/" | grep -q 'application/ld+json' && ok "home page has JSON-LD" || bad "home page JSON-LD missing"

echo "Auth gates"
c=$(code "$BASE/portal"); [ "$c" = 307 ] || [ "$c" = 303 ] || [ "$c" = 302 ] && ok "/portal redirects when logged out ($c)" || bad "/portal → $c"
c=$(code "$BASE/admin"); [ "$c" = 307 ] || [ "$c" = 303 ] || [ "$c" = 302 ] && ok "/admin redirects when logged out ($c)" || bad "/admin → $c"
loc=$(curl -s -o /dev/null -w '%{redirect_url}' "$BASE/admin"); [[ "$loc" == *"/login?next=%2Fadmin"* || "$loc" == *"/login?next=/admin"* ]] && ok "/admin → login with next" || bad "/admin redirect target: $loc"

echo "Security headers"
H=$(curl -sI "$BASE/")
for h in content-security-policy x-content-type-options x-frame-options referrer-policy permissions-policy; do
  echo "$H" | grep -qi "^$h:" && ok "$h present" || bad "$h missing"
done
echo "$H" | grep -qi '^x-powered-by' && bad "x-powered-by leaked" || ok "no x-powered-by"

echo "Status API"
S=$(curl -s "$BASE/api/status")
echo "$S" | grep -q '"state":"\(online\|offline\|unavailable\|unconfigured\)"' && ok "/api/status returns a state: $(echo "$S" | head -c 160)…" || bad "/api/status: $S"
HL=$(curl -s "$BASE/api/health"); echo "$HL" | grep -q '"ok":true' && echo "$HL" | grep -q '"db":"up"' && ok "/api/health ok, db up" || bad "/api/health: $HL"

echo "Ingest API"
c=$(code -X POST "$BASE/api/ingest/stats" -H 'Content-Type: application/json' -d '{"players":[]}')
[ "$c" = 401 ] || [ "$c" = 503 ] && ok "ingest without secret rejected ($c)" || bad "ingest without secret → $c"
c=$(code -X POST "$BASE/api/ingest/stats" -H 'Authorization: Bearer wrong-secret-wrong-secret-wrong-secret' -H 'Content-Type: application/json' -d '{"players":[]}')
[ "$c" = 401 ] || [ "$c" = 503 ] && ok "ingest with wrong secret rejected ($c)" || bad "ingest wrong secret → $c"
if [ -n "${INGEST_SECRET:-}" ]; then
  AUTH="Authorization: Bearer $INGEST_SECRET"
  c=$(code -X POST "$BASE/api/ingest/stats" -H "$AUTH" -H 'Content-Type: application/json' -d '{"players":[{"uuid":"bad","name":"x"}]}')
  [ "$c" = 422 ] && ok "invalid ingest payload → 422" || bad "invalid payload → $c"
  c=$(code -X POST "$BASE/api/ingest/stats" -H "$AUTH" -H 'Content-Type: application/json' -d '{"players":[{"uuid":"00000000-0000-4000-8000-00000000a001","name":"SmokeTestA","level":-1}]}')
  [ "$c" = 422 ] && ok "negative level rejected → 422" || bad "negative level → $c"
  c=$(code -X POST "$BASE/api/ingest/stats" -H "$AUTH" -H 'Content-Type: application/json' -d 'not json')
  [ "$c" = 400 ] && ok "malformed JSON → 400" || bad "malformed JSON → $c"
  R=$(curl -s -X POST "$BASE/api/ingest/stats" -H "$AUTH" -H 'Content-Type: application/json' -d '{"source":"smoke","players":[
    {"uuid":"00000000-0000-4000-8000-00000000a001","name":"SmokeTestA","kills":77,"deaths":3,"playtimeSeconds":7200,"balance":1234.5,"hearts":14,"level":42},
    {"uuid":"00000000000040008000-00000000a002","name":"SmokeTestB","kills":5}]}')
  echo "$R" | grep -q '"upserted":2' && ok "valid ingest upserted 2 players" || bad "valid ingest: $R"
  curl -s "$BASE/leaderboards?q=SmokeTest" | grep -q 'SmokeTestA' && ok "ingested player visible on leaderboard search" || bad "SmokeTestA not on leaderboard"
  curl -s "$BASE/leaderboards?metric=level&q=SmokeTestA" | grep -q 'SmokeTestA' && ok "level board includes a player with a reported level" || bad "SmokeTestA not on level board"
  curl -s "$BASE/leaderboards?metric=level&q=SmokeTestB" | grep -q '/player/SmokeTestB' && bad "player without a level shown on level board" || ok "player without a level excluded from level board"
  P=$(curl -s "$BASE/player/SmokeTestA"); echo "$P" | grep -q 'SmokeTestA' && echo "$P" | grep -q '>77<' && ok "/player/SmokeTestA shows ingested kills" || bad "/player/SmokeTestA content"
  loc=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$BASE/player/smoketesta"); [[ "$loc" == 308*"/player/SmokeTestA" ]] && ok "lower-case profile URL → 308 canonical" || bad "case redirect: $loc"
  c=$(code -X POST "$BASE/api/ingest/verify" -H "$AUTH" -H 'Content-Type: application/json' -d '{"code":"RX-AAAAAA","name":"SmokeTestA","uuid":"00000000-0000-4000-8000-00000000a001"}')
  [ "$c" = 404 ] && ok "verify with unknown code → 404" || bad "verify unknown code → $c"
  c=$(code "$BASE/api/ingest/purchases" -H "$AUTH"); [ "$c" = 200 ] && ok "purchases poll → 200" || bad "purchases poll → $c"
else
  echo "  (INGEST_SECRET not set — skipping authenticated ingest checks)"
fi

echo "Store"
curl -s "$BASE/store" | grep -q 'Payments not configured' && ok "store shows 'Payments not configured' when disabled" || echo "  • store: payments appear configured (skip)"
c=$(code -X POST "$BASE/api/checkout" -H "Origin: https://evil.example" -d 'listing=vip'); [ "$c" = 403 ] && ok "cross-origin checkout POST → 403" || bad "cross-origin checkout → $c"

echo
echo "Passed: $PASS  Failed: $FAIL"
[ "$FAIL" = 0 ]
