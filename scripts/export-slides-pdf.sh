#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_HTML="$ROOT_DIR/slides/sentinel-8004-submission-deck-v2.html"
OUTPUT_DIR="$ROOT_DIR/slides"
OUTPUT_PDF="$OUTPUT_DIR/sentinel-8004-submission-deck-v2.pdf"

if [[ ! -f "$SOURCE_HTML" ]]; then
  echo "Missing slide deck source: $SOURCE_HTML" >&2
  exit 1
fi

find_browser_bin() {
  if [[ -n "${CHROME_BIN:-}" && -x "${CHROME_BIN}" ]]; then
    echo "${CHROME_BIN}"
    return 0
  fi

  local candidate
  for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"; do
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

BROWSER_BIN="$(find_browser_bin || true)"
if [[ -z "$BROWSER_BIN" ]]; then
  echo "Could not find Google Chrome or Brave Browser. Set CHROME_BIN to a browser binary." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

USER_DATA_DIR="$(mktemp -d "${TMPDIR:-/tmp}/sentinel-slides.XXXXXX")"
cleanup() {
  rm -rf "$USER_DATA_DIR"
}
trap cleanup EXIT

"$BROWSER_BIN" \
  --headless \
  --disable-gpu \
  --no-first-run \
  --no-default-browser-check \
  --allow-file-access-from-files \
  --user-data-dir="$USER_DATA_DIR" \
  --run-all-compositor-stages-before-draw \
  --virtual-time-budget=3000 \
  --print-to-pdf="$OUTPUT_PDF" \
  --no-pdf-header-footer \
  "file://$SOURCE_HTML"

echo "Wrote slide PDF: $OUTPUT_PDF"
