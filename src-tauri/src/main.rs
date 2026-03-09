mod autosave;
mod exporter;
mod file_handler;
mod grammar;

use serde::Serialize;
use serde_json::Value;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct EmptyDocumentResponse {
    delta: Value,
    plain_text: String,
}

#[tauri::command]
async fn new_document() -> Result<EmptyDocumentResponse, String> {
    Ok(EmptyDocumentResponse {
        delta: file_handler::empty_document(),
        plain_text: String::new(),
    })
}

#[tauri::command]
async fn open_document(app: tauri::AppHandle) -> Result<file_handler::OpenDocumentResponse, String> {
    file_handler::open_document(app).await
}

#[tauri::command]
async fn save_document(
    path: String,
    delta: Value,
    plain_text: String,
    word_count: usize,
) -> Result<file_handler::SaveDocumentResponse, String> {
    file_handler::save_document(path, delta, plain_text, word_count).await
}

#[tauri::command]
async fn save_as_document(
    app: tauri::AppHandle,
    delta: Value,
    plain_text: String,
    word_count: usize,
) -> Result<file_handler::SaveDocumentResponse, String> {
    file_handler::save_document_as(app, delta, plain_text, word_count).await
}

#[tauri::command]
async fn export_docx(app: tauri::AppHandle, plain_text: String) -> Result<String, String> {
    exporter::export_docx(app, plain_text).await
}

#[tauri::command]
async fn export_pdf(app: tauri::AppHandle, plain_text: String) -> Result<String, String> {
    exporter::export_pdf(app, plain_text).await
}

#[tauri::command]
async fn export_txt(app: tauri::AppHandle, plain_text: String) -> Result<String, String> {
    exporter::export_txt(app, plain_text).await
}

#[tauri::command]
async fn check_grammar(text: String) -> Result<grammar::GrammarResponse, String> {
    grammar::check_grammar(text).await
}

#[tauri::command]
async fn autosave_document(
    delta: Value,
    plain_text: String,
    word_count: usize,
) -> Result<autosave::AutosaveResult, String> {
    autosave::autosave_document(delta, plain_text, word_count).await
}

#[tauri::command]
async fn restore_autosave() -> Result<Option<autosave::RestoredAutosave>, String> {
    autosave::restore_autosave().await
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            new_document,
            open_document,
            save_document,
            save_as_document,
            export_docx,
            export_pdf,
            export_txt,
            check_grammar,
            autosave_document,
            restore_autosave
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
