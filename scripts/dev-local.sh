#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"

# Prefer the user's installation. Codex Desktop also bundles a local runtime.
if ! command -v node >/dev/null 2>&1 || ! command -v pnpm >/dev/null 2>&1; then
  runtime_dir="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies"
  if [[ -x "$runtime_dir/node/bin/node" && -x "$runtime_dir/bin/fallback/pnpm" ]]; then
    export PATH="$runtime_dir/node/bin:$runtime_dir/bin/fallback:$PATH"
  fi
fi

if ! command -v node >/dev/null 2>&1 || ! command -v pnpm >/dev/null 2>&1; then
  echo 'Install Node.js >=22.12 and the pnpm version in package.json, then follow README.md.' >&2
  exit 1
fi

exec pnpm dev "$@"
