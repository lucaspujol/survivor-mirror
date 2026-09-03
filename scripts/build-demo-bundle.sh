#!/usr/bin/env bash
#
# Builds the `chomagego-demo-build` bundle: the compiled frontend, the API and
# a Compose file that runs them without the repository.
#
#   ./scripts/build-demo-bundle.sh [output-directory]
#
# Default output: build/chomagego-demo-build/
# Used as-is by the `demo-build` job in .github/workflows/ci.yml, so what CI
# publishes is exactly what this script produces locally.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out_dir="${1:-$repo_root/build/chomagego-demo-build}"

echo "==> Building the frontend"
cd "$repo_root/web"
npm ci
npm run build

echo "==> Assembling the bundle in $out_dir"
rm -rf "$out_dir"
mkdir -p "$out_dir/web"

# Compiled frontend, straight from Vite.
cp -R "$repo_root/web/dist" "$out_dir/web/dist"
cp "$repo_root/deploy/demo/web/Dockerfile" "$out_dir/web/Dockerfile"
cp "$repo_root/deploy/demo/web/nginx.conf" "$out_dir/web/nginx.conf"

# API sources: Python is not compiled, so the deployable form is the source
# tree plus its migrations and its pinned requirements.
cp -R "$repo_root/api" "$out_dir/api"
find "$out_dir/api" \
  \( -name '__pycache__' -o -name '.venv' -o -name '.pytest_cache' \) \
  -prune -exec rm -rf {} +
find "$out_dir/api" -name '*.py[co]' -delete

cp "$repo_root/deploy/demo/compose.yaml" "$out_dir/compose.yaml"
cp "$repo_root/deploy/demo/DEMO.md" "$out_dir/DEMO.md"

cat > "$out_dir/BUILD-INFO.txt" <<INFO
ChômageGo — demo build
======================

Commit      : ${GITHUB_SHA:-$(git -C "$repo_root" rev-parse HEAD)}
Branch/ref  : ${GITHUB_REF_NAME:-$(git -C "$repo_root" rev-parse --abbrev-ref HEAD)}
Built at    : $(date -u '+%Y-%m-%dT%H:%M:%SZ') (UTC)
Built by    : ${GITHUB_WORKFLOW:-local build} (run ${GITHUB_RUN_ID:-n/a})
Node        : $(node --version)
npm         : $(npm --version)

Start with:  docker compose up --build
Then open:   http://localhost:8080
Read:        DEMO.md (demo accounts and walkthrough)
INFO

echo "==> Bundle ready"
du -sh "$out_dir"
