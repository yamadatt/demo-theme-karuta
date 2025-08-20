#!/usr/bin/env bash
set -euo pipefail

# Downloads 12 Unsplash images into this folder for the sample post.
# Usage: bash download_images.sh

here="$(cd "$(dirname "$0")" && pwd)"
cd "$here"

UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
REF="https://unsplash.com/"

fetch() {
  local url="$1" out="$2" tmp
  tmp="${out}.part"
  # Add a random sig to avoid CDN caching the same redirect
  url="${url}&sig=$RANDOM"
  echo "-> Downloading ${out}"
  if ! curl -fL --retry 4 --retry-all-errors --retry-delay 2 -A "$UA" -e "$REF" -o "$tmp" "$url"; then
    echo "!! Failed to download $out" >&2
    rm -f "$tmp"
    return 1
  fi
  if command -v file >/dev/null 2>&1; then
    local mime
    mime="$(file -b --mime-type "$tmp" || echo unknown)"
    case "$mime" in
      image/*) ;;
      *) echo "!! $out not an image (mime: $mime)" >&2; rm -f "$tmp"; return 1 ;;
    esac
  fi
  mv -f "$tmp" "$out"
}

base='https://source.unsplash.com/1600x1000/?'

if [[ -n "${UNSPLASH_ACCESS_KEY:-}" ]]; then
  echo "Using Unsplash API (requires valid access key)."
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq が必要です。macOS: brew install jq / Ubuntu: sudo apt-get install jq" >&2
    exit 1
  fi
  # Request 12 random photos that match the query
  JSON=$(curl -sSf -A "$UA" -e "$REF" \
    -H "Authorization: Client-ID $UNSPLASH_ACCESS_KEY" \
    "https://api.unsplash.com/photos/random?count=12&orientation=landscape&query=new%20york%20street%20fashion")
  urls=( $(echo "$JSON" | jq -r '.[].urls.raw') )
  if [[ ${#urls[@]} -ne 12 ]]; then
    echo "Unexpected API response (URL count ${#urls[@]}). Raw JSON saved to random.json" >&2
    printf "%s" "$JSON" > random.json
    exit 1
  fi
  i=1
  for u in "${urls[@]}"; do
    printf -v out "%03d.jpg" "$i"
    # Normalize to jpg at width 1600
    fetch "${u}&w=1600&q=85&fm=jpg" "$out" || true
    sleep 1
    i=$((i+1))
  done
else
  echo "Using Unsplash Source (no API key)."
  fetch "${base}new-york,street,fashion" 001.jpg || true
  sleep 1
  fetch "${base}soho,new-york,streetstyle" 002.jpg || true
  sleep 1
  fetch "${base}brooklyn,street,fashion" 003.jpg || true
  sleep 1
  fetch "${base}sneakers,nyc,street" 004.jpg || true
  sleep 1
  fetch "${base}denim,nyc,streetstyle" 005.jpg || true
  sleep 1
  fetch "${base}coat,nyc,streetwear" 006.jpg || true
  sleep 1
  fetch "${base}leather,jacket,new-york" 007.jpg || true
  sleep 1
  fetch "${base}vintage,nyc,street" 008.jpg || true
  sleep 1
  fetch "${base}monochrome,nyc,style" 009.jpg || true
  sleep 1
  fetch "${base}accessories,nyc,street" 010.jpg || true
  sleep 1
  fetch "${base}crosswalk,new-york,street" 011.jpg || true
  sleep 1
  fetch "${base}autumn,new-york,street" 012.jpg || true
fi

echo "Done. Check file sizes (should be >50KB)."
