use chrono::{DateTime, Local, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::PathBuf;

use crate::file_handler::build_payload;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutosaveResult {
    pub path: String,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoredAutosave {
    pub delta: Value,
    pub plain_text: String,
    pub word_count: usize,
    pub timestamp: String,
}

fn autosave_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|_| "HOME is not set".to_string())?;
    Ok(PathBuf::from(home).join(".config/manjaword/autosave"))
}

fn autosave_path() -> Result<PathBuf, String> {
    Ok(autosave_dir()?.join("latest.manjaword.json"))
}

pub async fn autosave_document(
    delta: Value,
    plain_text: String,
    word_count: usize,
) -> Result<AutosaveResult, String> {
    let dir = autosave_dir()?;
    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|err| format!("unable to prepare autosave directory: {err}"))?;

    let path = autosave_path()?;
    let payload = build_payload(delta, plain_text, word_count);
    let encoded = serde_json::to_string_pretty(&payload)
        .map_err(|err| format!("unable to encode autosave payload: {err}"))?;

    tokio::fs::write(&path, encoded)
        .await
        .map_err(|err| format!("unable to write autosave file: {err}"))?;

    Ok(AutosaveResult {
        path: path.display().to_string(),
        timestamp: Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
    })
}

pub async fn restore_autosave() -> Result<Option<RestoredAutosave>, String> {
    let path = autosave_path()?;
    if !path.exists() {
        return Ok(None);
    }

    let raw = tokio::fs::read_to_string(&path)
        .await
        .map_err(|err| format!("unable to read autosave file: {err}"))?;

    let payload: crate::file_handler::DocumentPayload = serde_json::from_str(&raw)
        .map_err(|err| format!("invalid autosave payload: {err}"))?;

    let timestamp = DateTime::parse_from_rfc3339(&payload.updated_at)
        .map(|value| value.with_timezone(&Local).format("%Y-%m-%d %H:%M:%S").to_string())
        .unwrap_or_else(|_| Utc::now().with_timezone(&Local).format("%Y-%m-%d %H:%M:%S").to_string());

    Ok(Some(RestoredAutosave {
        delta: payload.delta,
        plain_text: payload.plain_text,
        word_count: payload.word_count,
        timestamp,
    }))
}
