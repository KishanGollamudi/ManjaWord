# ManjaWord-Rust

ManjaWord-Rust is a production-focused, lightweight, secure Word-like desktop editor built with **Tauri + Rust + React + Quill**. It uses the operating system's native WebView (instead of bundled Chromium) to drastically reduce bundle size and memory use compared to Electron apps.

## Features

- Rich text editor powered by Quill.js
- Bold, italic, underline
- Font family, font size, headings (H1-H6)
- Alignment (left/center/right/justify)
- Bullet + numbered lists
- Undo / redo
- Word count status bar
- Light / dark mode toggle
- Grammar toggle (offline LanguageTool integration)
- File operations: New, Open, Save, Export DOCX, Export PDF
- Autosave every 30 seconds and recovery on restart

## Architecture

```text
+------------------------------+
| React + Quill Frontend       |
| - UI, formatting, status bar |
| - No filesystem access       |
+--------------+---------------+
               | secure invoke()
+--------------v---------------+
| Tauri IPC Command Layer      |
| open_file / save_file        |
| export_docx / export_pdf     |
| grammar_check / autosave     |
+--------------+---------------+
               |
+--------------v---------------+
| Rust Backend                 |
| file_handler.rs              |
| exporter.rs                  |
| grammar.rs                   |
| autosave.rs                  |
+--------------+---------------+
               |
+--------------v---------------+
| OS APIs / Local Services     |
| Native file dialog           |
| Filesystem via Rust std::fs  |
| Local LanguageTool :8081     |
+------------------------------+
```

## Security model

- Frontend never touches disk APIs directly.
- All file operations are mediated by backend `#[tauri::command]` handlers.
- Save/Open paths are user-selected via native dialogs.
- Path validation blocks invalid control characters and enforces `.manjaword.json` extension.
- Content Security Policy in `tauri.conf.json` allows only local app content + localhost LanguageTool endpoint.
- Minimal Tauri capability permissions (`core`, `dialog open/save`) are enabled; unnecessary permissions are not granted.
- Grammar checks stay local by default (`http://localhost:8081`) to avoid cloud transmission.

## Project structure

```text
ManjaWord-Rust/
├── src/
│   ├── components/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── file_handler.rs
│   │   ├── exporter.rs
│   │   ├── grammar.rs
│   │   └── autosave.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── vite.config.js
└── README.md
```

## Prerequisites (Manjaro Linux)

Install base packages:

```bash
sudo pacman -Syu
sudo pacman -S --needed base-devel curl wget file openssl gtk3 webkit2gtk-4.1 libayatana-appindicator librsvg
```

Install Node.js + npm:

```bash
sudo pacman -S --needed nodejs npm
```

### Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustup default stable
```

### Install Tauri prerequisites

```bash
cargo install tauri-cli --locked
```

## Development

```bash
npm install
npm run tauri dev
```

## Production build

```bash
npm run build
npm run tauri build
```

## Packaging targets

Configured bundle targets:

- Linux AppImage
- macOS DMG/app bundle
- Windows MSI/EXE distribution pipeline

> Cross-platform support depends on building on each target OS or cross-compilation setup.

## Running LanguageTool locally (offline grammar)

1. Download LanguageTool server package.
2. Start server on port `8081`:

```bash
java -cp languagetool-server.jar org.languagetool.server.HTTPServer --port 8081 --allow-origin
```

3. Keep server running while using grammar checks in ManjaWord-Rust.

If the server is unavailable, ManjaWord fails gracefully and keeps editing features available.
