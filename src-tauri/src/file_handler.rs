use crate::autosave::EditorDocument;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use thiserror::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenedDocument {
    pub path: String,
    pub content: serde_json::Value,
}

#[derive(Debug, Error)]
pub enum FileError {
    #[error("no file selected")]
    NoFile,
    #[error("invalid file extension: expected .manjaword.json")]
    InvalidExtension,
    #[error("path validation failed")]
    InvalidPath,
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
}

fn validate_path(path: &Path) -> Result<(), FileError> {
    let clean = Regex::new(r"[\x00-\x1F]").map_err(|_| FileError::InvalidPath)?;
    let as_str = path.to_string_lossy();
    if clean.is_match(&as_str) {
        return Err(FileError::InvalidPath);
    }
    if path.extension().and_then(|e| e.to_str()) != Some("json")
        || !as_str.ends_with(".manjaword.json")
    {
        return Err(FileError::InvalidExtension);
    }
    Ok(())
}

async fn pick_open_path(app: &AppHandle) -> Result<PathBuf, FileError> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog()
        .file()
        .add_filter("ManjaWord", &["manjaword.json"])
        .pick_file(move |f| {
            let _ = tx.send(f.and_then(|file| file.as_path().map(PathBuf::from)));
        });

    rx.await.ok().flatten().ok_or(FileError::NoFile)
}

async fn pick_save_path(app: &AppHandle) -> Result<PathBuf, FileError> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog()
        .file()
        .add_filter("ManjaWord", &["manjaword.json"])
        .set_file_name("untitled.manjaword.json")
        .save_file(move |f| {
            let _ = tx.send(f.and_then(|file| file.as_path().map(PathBuf::from)));
        });
    rx.await.ok().flatten().ok_or(FileError::NoFile)
}

pub async fn open_file(app: AppHandle) -> Result<OpenedDocument, FileError> {
    let path = pick_open_path(&app).await?;
    validate_path(&path)?;
    let raw = fs::read_to_string(&path)?;
    let parsed: EditorDocument = serde_json::from_str(&raw)?;
    Ok(OpenedDocument {
        path: path.display().to_string(),
        content: parsed.content,
    })
}

pub async fn save_file(app: AppHandle, content: serde_json::Value) -> Result<String, FileError> {
    let path = pick_save_path(&app).await?;
    let mut path = path;
    if !path.to_string_lossy().ends_with(".manjaword.json") {
        path = PathBuf::from(format!("{}.manjaword.json", path.display()));
    }
    validate_path(&path)?;

    let payload = EditorDocument::new(content);
    let json = serde_json::to_string_pretty(&payload)?;
    fs::write(&path, json)?;

    Ok(path.display().to_string())
}
