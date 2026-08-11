#!/usr/bin/env bash
# Open Remotion Studio in a clean Chrome profile with ALL extensions disabled
# (blocks MetaMask, Phantom, etc. from injecting into the page).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROFILE_DIR="${TMPDIR:-/tmp}/remotion-giver-chrome-clean"
mkdir -p "$PROFILE_DIR"

# Prefer an already-running Studio (3000–3010), else start one
detect_url() {
  local port
  for port in 3001 3002 3000 3003 3004 3005; do
    if curl -sf -o /dev/null "http://localhost:${port}/" 2>/dev/null; then
      echo "http://localhost:${port}/GiverDemo"
      return 0
    fi
  done
  return 1
}

if [ -n "${1:-}" ]; then
  URL="$1"
elif URL="$(detect_url)"; then
  :
else
  echo "Starting Remotion Studio…"
  (cd "$ROOT" && npx remotion studio --no-open) &
  STUDIO_PID=$!
  cleanup() {
    if kill -0 "$STUDIO_PID" 2>/dev/null; then
      kill "$STUDIO_PID" 2>/dev/null || true
    fi
  }
  trap cleanup EXIT

  echo "Waiting for Studio…"
  for _ in $(seq 1 60); do
    if URL="$(detect_url)"; then
      break
    fi
    sleep 1
  done
fi

if [ -z "${URL:-}" ]; then
  echo "Could not find Remotion Studio. Start it with: npm run dev"
  exit 1
fi

# Prefer Chrome, then Chromium, then Edge
open_chrome() {
  local app="$1"
  open -na "$app" --args \
    --user-data-dir="$PROFILE_DIR" \
    --disable-extensions \
    --disable-component-extensions-with-background-pages \
    --no-first-run \
    --no-default-browser-check \
    "$URL"
}

if [ -d "/Applications/Google Chrome.app" ]; then
  open_chrome "Google Chrome"
elif [ -d "/Applications/Chromium.app" ]; then
  open_chrome "Chromium"
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open_chrome "Microsoft Edge"
else
  echo "No Chrome/Chromium/Edge found. Open this URL in a browser with extensions disabled:"
  echo "  $URL"
  exit 1
fi

echo "Opened clean browser (extensions disabled): $URL"
echo "Profile: $PROFILE_DIR"

# If we started Studio in this script, keep the process alive
if [ -n "${STUDIO_PID:-}" ]; then
  wait "$STUDIO_PID"
fi
