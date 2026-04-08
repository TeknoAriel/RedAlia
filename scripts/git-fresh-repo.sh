#!/usr/bin/env bash
# Uso: desde la raíz del proyecto, tras asegurar .gitignore (node_modules, *.node, .next).
# Borra TODO el historial local y sube un único commit limpio (requiere --force si el remoto tiene commits viejos).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REMOTE="${1:-https://github.com/TeknoAriel/RedAlia.git}"

echo ">> Eliminando historial .git en $ROOT"
rm -rf .git

git init -b main
git add -A
if git diff --cached --quiet; then
  echo "No hay nada para commitear."
  exit 1
fi

git commit -m "Initial: Redalia (Next.js, muestra KiteProp en data/, sin node_modules)"

git remote add origin "$REMOTE"
git config http.postBuffer 524288000
git config http.version HTTP/1.1

echo ">> Push con --force (necesario si GitHub rechazó pushes anteriores por archivos grandes)"
git push -u origin main --force

echo ">> Listo."
