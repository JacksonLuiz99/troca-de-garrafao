#!/usr/bin/env bash
# Compila o app e publica o resultado na branch gh-pages do repositório (GitHub Pages).
set -euo pipefail

cd "$(dirname "$0")/.."
remoto="$(git remote get-url origin)"

npx ng build
cd dist/troca-de-garrafao/browser
touch .nojekyll
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy"
git push -q -f "$remoto" gh-pages
echo "Publicado na branch gh-pages."
