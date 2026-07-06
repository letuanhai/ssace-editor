#!/bin/sh
# Build/refresh everything under lib/ - the single place third-party library
# versions are recorded and bumped. lib/ is gitignored: it contains only
# artifacts this script (re)generates.
#
#   lib/ace/         ace-builds npm package (src-noconflict build + types)
#   lib/ace-linters/ the two ace-linters UMD bundles needed to drive an
#                    external LSP server over a web worker (the other ~24
#                    build files are its own in-browser services, unused)
#   lib/sas-lsp/     SAS language server browser bundle, built from
#                    sassoftware/vscode-sas-extension with the embedded
#                    Pyright (Python LSP, ~6 MB) stripped via
#                    remove-pyright.patch at the repo root
#
# The npm copies are byte-identical to the tarballs - never hand-edit lib/
# (runtime tweaks belong in src/ace-patches.js). The npm parts re-vendor on
# every run (seconds); the LSP build (npm ci + two webpack builds, many
# minutes) is skipped while lib/sas-lsp/.version already says SAS_LSP_VERSION.
#
# Requires: npm, git, node >= 18, network.
# Usage: ./build_lib.sh          (package.sh runs it automatically if lib/ is incomplete)
#   BUILD_DIR=<dir> ./build_lib.sh   # override the LSP clone/build location
set -e
cd "$(dirname "$0")"

ACE_BUILDS_VERSION=1.43.3
ACE_LINTERS_VERSION=2.2.0
SAS_LSP_VERSION=v1.20.0 # release tag of sassoftware/vscode-sas-extension
SAS_LSP_REPO=https://github.com/sassoftware/vscode-sas-extension

# -- lib/ace: the src-noconflict build + types (the rest of the package -
# src/, src-min*/, demo/ - never ships) ---------------------------------------
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "== Vendoring ace-builds@$ACE_BUILDS_VERSION"
npm pack --silent "ace-builds@$ACE_BUILDS_VERSION" --pack-destination "$TMP" >/dev/null
tar -xzf "$TMP"/ace-builds-*.tgz -C "$TMP"
rm -rf lib/ace
mkdir -p lib/ace
cp -r "$TMP/package/src-noconflict" "$TMP/package/types" lib/ace/
cp "$TMP/package/ace.d.ts" "$TMP/package/ace-modes.d.ts" \
   "$TMP/package/esm-resolver.js" "$TMP/package/webpack-resolver.js" lib/ace/
rm -rf "$TMP/package"

# -- lib/ace-linters ----------------------------------------------------------
echo "== Vendoring ace-linters@$ACE_LINTERS_VERSION"
npm pack --silent "ace-linters@$ACE_LINTERS_VERSION" --pack-destination "$TMP" >/dev/null
tar -xzf "$TMP"/ace-linters-*.tgz -C "$TMP"
rm -rf lib/ace-linters
mkdir -p lib/ace-linters
cp "$TMP/package/build/language-client.js" \
   "$TMP/package/build/ace-language-client.js" lib/ace-linters/

# -- lib/sas-lsp --------------------------------------------------------------
if [ -f lib/sas-lsp/sas-server.js ] && [ "$(cat lib/sas-lsp/.version 2>/dev/null)" = "$SAS_LSP_VERSION" ]; then
  echo "== lib/sas-lsp/sas-server.js already at $SAS_LSP_VERSION - skipping LSP build"
else
  ROOT=$PWD
  BUILD_DIR=${BUILD_DIR:-$ROOT/.lsp-build}
  SRC="$BUILD_DIR/vscode-sas-extension"

  echo "== Building SAS language server $SAS_LSP_VERSION"
  mkdir -p "$BUILD_DIR"
  [ -d "$SRC/.git" ] || git clone "$SAS_LSP_REPO" "$SRC"
  git -C "$SRC" fetch -q origin tag "$SAS_LSP_VERSION" 2>/dev/null || git -C "$SRC" fetch -q origin
  # Drop any previous patch application (tracked edits + the added stub file)
  git -C "$SRC" checkout -qf "$SAS_LSP_VERSION"
  git -C "$SRC" reset -q --hard "$SAS_LSP_VERSION"
  git -C "$SRC" clean -qfd server/src
  git -C "$SRC" apply "$ROOT/remove-pyright.patch"

  # compile populates server/dist/node/typeshed-fallback, which the browser
  # webpack build depends on; compile-browser alone fails without it.
  # Cap node's heap: webpack's production build otherwise balloons past what
  # small boxes have and gets OOM-killed (observed on a 4 GB host).
  (
    cd "$SRC"
    npm ci
    export NODE_OPTIONS="--max-old-space-size=2560"
    npm run compile
    npm run compile-browser
  )

  mkdir -p lib/sas-lsp
  # Don't ship the 22 MB source map; drop the reference to it too so devtools
  # doesn't log a 404.
  sed '/^\/\/# sourceMappingURL=/d' "$SRC/server/dist/browser/server.js" > lib/sas-lsp/sas-server.js
  cp "$SRC/LICENSE" lib/sas-lsp/LICENSE-sas-lsp
  echo "$SAS_LSP_VERSION" > lib/sas-lsp/.version
fi

echo "== Done: ace-builds@$ACE_BUILDS_VERSION ace-linters@$ACE_LINTERS_VERSION sas-lsp@$SAS_LSP_VERSION"
