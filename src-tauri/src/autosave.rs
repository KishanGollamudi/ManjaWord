use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};
use thiserror::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct EditorDocument {
    pub version: String,
    pub updated_at: String,
    pub content: Value,
}

impl EditorDocument {
    pub fn new(content: Value) -> Self {
        Self {
            version: "1.0.0".to_string(),
            updated_at: Utc::now().to_rfc3339(),
            content,
        }
    }
}

#[derive(Debug, Error)]
pub enum AutosaveError {
    #[error("application data path unavailable")]
    PathUnavailable,
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
}

fn autosave_path(app: &AppHandle) -> Result<PathBuf, AutosaveError> {
    let base = app
        .path()
        .app_local_data_dir()
        .map_err(|_| AutosaveError::PathUnavailable)?;
    fs::create_dir_all(&base)?;
    Ok(base.join("autosave.manjaword.json"))
}

pub fn autosave_document(app: AppHandle, content: Value) -> Result<(), AutosaveError> {
    let path = autosave_path(&app)?;
    let payload = EditorDocument::new(content);
    fs::write(path, serde_json::to_string_pretty(&payload)?)?;
    Ok(())
}

pub fn recover_unsaved_document(app: AppHandle) -> Result<Option<EditorDocument>, AutosaveError> {
    let path = autosave_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }

    let raw = fs::read_to_string(path)?;
    let parsed = serde_json::from_str::<EditorDocument>(&raw)?;
    Ok(Some(parsed))
}
