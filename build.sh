#!/usr/bin/env bash
set -euo pipefail

npm install
npm run tauri build

echo "Build complete. AppImage is in src-tauri/target/release/bundle/appimage/."
