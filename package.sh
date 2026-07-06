#!/bin/sh
# Build the publishable extension zip into dist/. The repo root is the extension
# root; the runtime tree is manifest.json + src/ + assets/ + lib/, so pack just
# those and skip everything dev-only (docs, test/, SASStudio-3.82/, .git, ...).
set -e
cd "$(dirname "$0")"
VERSION=$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' manifest.json)
OUT="dist/sas-studio-ext-${VERSION}.zip"
mkdir -p dist
rm -f "$OUT"
zip -qr "$OUT" manifest.json src assets lib README.md LICENSE CHANGELOG.md
echo "Wrote $OUT ($(du -h "$OUT" | cut -f1))"
