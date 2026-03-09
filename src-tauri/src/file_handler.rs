use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::path::{Component, Path, PathBuf};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DocumentPayload {
    pub version: u8,
    pub delta: Value,
    pub plain_text: String,
    pub word_count: usize,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenDocumentResponse {
    pub path: String,
    pub delta: Value,
    pub plain_text: String,
    pub word_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveDocumentResponse {
    pub path: String,
}

pub fn build_payload(delta: Value, plain_text: String, word_count: usize) -> DocumentPayload {
    DocumentPayload {
        version: 1,
        delta,
        plain_text,
        word_count,
        updated_at: Utc::now().to_rfc3339(),
    }
}

pub fn validate_allowed_path(path: &Path) -> Result<(), String> {
    let as_text = path.to_string_lossy();
    if as_text.chars().any(|c| c.is_control()) {
        return Err("invalid path characters".to_string());
    }

    if path
        .components()
        .any(|component| matches!(component, Component::ParentDir))
    {
        return Err("directory traversal is not allowed".to_string());
    }

    if !path.is_absolute() {
        return Err("path must be absolute".to_string());
    }

    let is_allowed = as_text.ends_with(".manjaword.json")
        || as_text.ends_with(".docx")
        || as_text.ends_with(".pdf")
        || as_text.ends_with(".txt");

    if !is_allowed {
        return Err("unsupported file extension".to_string());
    }

    Ok(())
}

pub async fn pick_open_path(app: &AppHandle) -> Result<PathBuf, String> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog()
        .file()
        .add_filter("ManjaWord", &["manjaword.json", "txt"])
        .pick_file(move |picked| {
            let _ = tx.send(picked.and_then(|path| path.as_path().map(PathBuf::from)));
        });

    rx.await
        .map_err(|_| "dialog channel closed".to_string())?
        .ok_or_else(|| "cancelled".to_string())
}

pub async fn pick_save_path(app: &AppHandle, default_name: &str) -> Result<PathBuf, String> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog()
        .file()
        .add_filter("ManjaWord", &["manjaword.json"])
        .set_file_name(default_name)
        .save_file(move |picked| {
            let _ = tx.send(picked.and_then(|path| path.as_path().map(PathBuf::from)));
        });

    rx.await
        .map_err(|_| "dialog channel closed".to_string())?
        .ok_or_else(|| "cancelled".to_string())
}

pub async fn open_document(app: AppHandle) -> Result<OpenDocumentResponse, String> {
    let path = pick_open_path(&app).await?;
    validate_allowed_path(&path)?;

    let raw = tokio::fs::read_to_string(&path)
        .await
        .map_err(|err| format!("unable to read file: {err}"))?;

    let as_text = path.to_string_lossy();
    if as_text.ends_with(".txt") {
        let word_count = count_words(&raw);
        return Ok(OpenDocumentResponse {
            path: path.display().to_string(),
            delta: delta_from_text(&raw),
            plain_text: raw,
            word_count,
        });
    }

    let parsed: Result<DocumentPayload, _> = serde_json::from_str(&raw);

    match parsed {
        Ok(data) => Ok(OpenDocumentResponse {
            path: path.display().to_string(),
            delta: data.delta,
            plain_text: data.plain_text,
            word_count: data.word_count,
        }),
        Err(_) => {
            let fallback_delta: Value = serde_json::from_str(&raw)
                .map_err(|_| "file is not a valid ManjaWord document".to_string())?;
            let plain_text = extract_text_from_delta(&fallback_delta);
            Ok(OpenDocumentResponse {
                path: path.display().to_string(),
                delta: fallback_delta,
                plain_text: plain_text.clone(),
                word_count: count_words(&plain_text),
            })
        }
    }
}

pub async fn save_document(
    path: String,
    delta: Value,
    plain_text: String,
    word_count: usize,
) -> Result<SaveDocumentResponse, String> {
    let mut target = PathBuf::from(path);
    if !target.to_string_lossy().ends_with(".manjaword.json") {
        target = PathBuf::from(format!("{}.manjaword.json", target.display()));
    }

    validate_allowed_path(&target)?;

    let payload = build_payload(delta, plain_text, word_count);
    let encoded = serde_json::to_string_pretty(&payload)
        .map_err(|err| format!("unable to encode document: {err}"))?;

    tokio::fs::write(&target, encoded)
        .await
        .map_err(|err| format!("unable to save document: {err}"))?;

    Ok(SaveDocumentResponse {
        path: target.display().to_string(),
    })
}

pub async fn save_document_as(
    app: AppHandle,
    delta: Value,
    plain_text: String,
    word_count: usize,
) -> Result<SaveDocumentResponse, String> {
    let picked = pick_save_path(&app, "document.manjaword.json").await?;
    save_document(picked.display().to_string(), delta, plain_text, word_count).await
}

pub fn empty_document() -> Value {
    json!({
      "ops": [
        { "insert": "\n" }
      ]
    })
}

pub fn delta_from_text(text: &str) -> Value {
    json!({
      "ops": [
        { "insert": format!("{}\n", text) }
      ]
    })
}

pub fn extract_text_from_delta(delta: &Value) -> String {
    delta
        .get("ops")
        .and_then(Value::as_array)
        .map(|ops| {
            ops.iter()
                .filter_map(|operation| operation.get("insert").and_then(Value::as_str))
                .collect::<Vec<_>>()
                .join("")
        })
        .unwrap_or_default()
        .replace('\n', "\n")
        .trim_end()
        .to_string()
}

pub fn count_words(text: &str) -> usize {
    text.split_whitespace().filter(|token| !token.is_empty()).count()
}
