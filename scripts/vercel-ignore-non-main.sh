#!/usr/bin/env bash
# Vercel → Project → Settings → Git → Ignored Build Step (o Build & Deployment).
# exit 0 = omitir el deploy; exit 1 = continuar con el build.
# Solo construye cuando la ref Git es main (producción típica en este repo).
set -eu
ref="${VERCEL_GIT_COMMIT_REF:-}"
if [ -z "$ref" ]; then
  echo "vercel-ignore-non-main: sin VERCEL_GIT_COMMIT_REF, continuar build"
  exit 1
fi
if [ "$ref" = "main" ]; then
  echo "vercel-ignore-non-main: main → build"
  exit 1
fi
echo "vercel-ignore-non-main: omitir preview ($ref)"
exit 0
