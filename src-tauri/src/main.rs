// src-tauri/src/main.rs

use tauri::{command, generate_handler, State};
use std::sync::{Arc, Mutex};

#[derive(Debug)]
pub enum ExportError {
    InvalidFormat,
    PermissionDenied,
    Other(String),
}

#[command]
pub fn open_document(path: String) {
    // Implementation for opening a document
}

#[command]
pub fn save_document(content: String) -> Result<(), ExportError> {
    // Implementation for saving a document
    Ok(())
}

#[command]
pub fn save_as_document(path: String, content: String) -> Result<(), ExportError> {
    // Implementation for saving a document with a different name
    Ok(())
}

#[command]
pub fn new_document() {
    // Implementation for creating a new document
}

#[command]
pub fn export_docx(path: String) -> Result<(), ExportError> {
    // Implementation for exporting to .docx format
    Ok(())
}

#[command]
pub fn export_pdf(path: String) -> Result<(), ExportError> {
    // Implementation for exporting to PDF format
    Ok(())
}

#[command]
pub fn export_txt(path: String) -> Result<(), ExportError> {
    // Implementation for exporting to .txt format
    Ok(())
}

#[command]
pub fn check_grammar(content: String) {
    // Implementation for checking grammar
}

#[command]
pub fn autosave_init() {
    // Implementation for initializing autosave
}

#[command]
pub fn restore_autosave() {
    // Implementation for restoring autosave data
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(generate_handler![
            open_document,
            save_document,
            save_as_document,
            new_document,
            export_docx,
            export_pdf,
            export_txt,
            check_grammar,
            autosave_init,
            restore_autosave,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}