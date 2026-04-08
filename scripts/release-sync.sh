#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "== npm ci =="
npm ci
echo "== npm run build =="
npm run build
echo "== git =="
git add -A
if git diff --cached --quiet; then
  echo "Nothing to commit."
else
  git commit -m "chore: sync" || true
fi
# Evita HTTP 400 en push de packs grandes (GitHub / HTTPS)
git config http.postBuffer 524288000
git config http.version HTTP/1.1
git push -u origin main || git push -u origin main --force
echo "== OK =="
