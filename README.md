# ManjaWord

ManjaWord is a lightweight Microsoft Word-like desktop editor for Manjaro/Arch Linux. It uses a secure Tauri v2 Rust backend and a React + Vite frontend with Quill rich text editing.

## Features

- Rich text editing with Quill
- Bold, italic, underline
- Headings H1-H6
- Font family and size selectors
- Alignment, bullet lists, numbered lists
- Undo/redo
- File menu actions: new, open, save, save as
- Export to DOCX, PDF, TXT
- Grammar checking with local LanguageTool server
- Autosave every 30 seconds
- Autosave restore on startup
- Dark mode with persisted theme
- Secure file access through Tauri IPC only

## Build Instructions

### Prerequisites (Manjaro / Arch)

```bash
sudo pacman -Syu --needed \
  base-devel \
  rust \
  cargo \
  nodejs \
  npm \
  webkit2gtk \
  gtk3 \
  libappindicator-gtk3 \
  librsvg \
  patchelf
```

### Install dependencies

```bash
npm install
```

### Development run

```bash
npm run tauri dev
```

### Production build (AppImage)

```bash
npm run tauri build
```

Generated bundle will be under:

`src-tauri/target/release/bundle/appimage/`

## Running LanguageTool (optional but recommended)

Grammar checking uses a local LanguageTool server at `http://localhost:8081/v2/check`.

```bash
docker run --rm -p 8081:8010 silviof/docker-languagetool
```

If the server is unavailable, ManjaWord continues without grammar results.

## AUR Installation (Template)

1. Copy `build/PKGBUILD` and `build/manjaword.desktop` into an AUR packaging repo.
2. Ensure source tarball and checksums are updated in `PKGBUILD`.
3. Build and install:

```bash
makepkg -si
```

## Troubleshooting

- `npm run tauri dev` fails with WebKit/GTK errors:
  - Install missing packages listed in prerequisites.
- Grammar count always `0`:
  - Verify LanguageTool is running on port `8081`.
- Save/export fails:
  - Check selected path extension is one of: `.manjaword.json`, `.docx`, `.pdf`, `.txt`.
- AppImage build missing:
  - Re-run `npm run tauri build` and inspect Tauri bundler logs.
