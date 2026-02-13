mod autosave;
mod exporter;
mod file_handler;
mod grammar;

use autosave::EditorDocument;
use serde_json::Value;
use tauri::AppHandle;

#[tauri::command]
async fn open_file(app: AppHandle) -> Result<file_handler::OpenedDocument, String> {
    file_handler::open_file(app)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_file(app: AppHandle, content: Value) -> Result<String, String> {
    file_handler::save_file(app, content)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn export_docx(app: AppHandle, content: Value) -> Result<String, String> {
    exporter::export_docx(app, content)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn export_pdf(app: AppHandle, content: Value) -> Result<String, String> {
    exporter::export_pdf(app, content)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn grammar_check(text: String) -> Result<grammar::GrammarResponse, String> {
    grammar::grammar_check(text)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn autosave_document(app: AppHandle, content: Value) -> Result<(), String> {
    autosave::autosave_document(app, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn recover_unsaved_document(app: AppHandle) -> Result<Option<EditorDocument>, String> {
    autosave::recover_unsaved_document(app).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            open_file,
            save_file,
            export_docx,
            export_pdf,
            grammar_check,
            autosave_document,
            recover_unsaved_document
        ])
        .run(tauri::generate_context!())
        .expect("error while running ManjaWord-Rust");
}
