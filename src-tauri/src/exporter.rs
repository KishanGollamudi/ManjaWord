use docx_rs::{Docx, Paragraph, Run};
use printpdf::{BuiltinFont, Mm, PdfDocument};
use serde_json::Value;
use std::{fs::File, io::BufWriter, path::PathBuf};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ExportError {
    #[error("no file selected")]
    NoFile,
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("docx error: {0}")]
    Docx(#[from] docx_rs::DocxError),
}

fn delta_to_lines(content: &Value) -> Vec<String> {
    content
        .get("ops")
        .and_then(Value::as_array)
        .map(|ops| {
            ops.iter()
                .filter_map(|op| op.get("insert").and_then(Value::as_str))
                .flat_map(|txt| txt.split('\n').map(str::to_string).collect::<Vec<String>>())
                .collect::<Vec<String>>()
        })
        .unwrap_or_default()
}

async fn pick_export_path(
    app: &AppHandle,
    ext: &str,
    default_name: &str,
) -> Result<PathBuf, ExportError> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog()
        .file()
        .add_filter(ext.to_uppercase(), &[ext])
        .set_file_name(default_name)
        .save_file(move |f| {
            let _ = tx.send(f.and_then(|v| v.as_path().map(PathBuf::from)));
        });

    rx.await.ok().flatten().ok_or(ExportError::NoFile)
}

pub async fn export_docx(app: AppHandle, content: Value) -> Result<String, ExportError> {
    let mut path = pick_export_path(&app, "docx", "document.docx").await?;
    if path.extension().and_then(|e| e.to_str()) != Some("docx") {
        path.set_extension("docx");
    }

    let lines = delta_to_lines(&content);
    let mut doc = Docx::new();
    for line in lines {
        if !line.trim().is_empty() {
            doc = doc.add_paragraph(Paragraph::new().add_run(Run::new().add_text(line)));
        }
    }

    doc.build().pack(File::create(&path)?)?;
    Ok(path.display().to_string())
}

pub async fn export_pdf(app: AppHandle, content: Value) -> Result<String, ExportError> {
    let mut path = pick_export_path(&app, "pdf", "document.pdf").await?;
    if path.extension().and_then(|e| e.to_str()) != Some("pdf") {
        path.set_extension("pdf");
    }

    let (doc, page1, layer1) =
        PdfDocument::new("ManjaWord Export", Mm(210.0), Mm(297.0), "Layer 1");
    let layer = doc.get_page(page1).get_layer(layer1);
    let font = doc.add_builtin_font(BuiltinFont::Helvetica)?;

    let lines = delta_to_lines(&content);
    let mut y = 280.0;
    for line in lines {
        if y < 15.0 {
            break;
        }
        if !line.trim().is_empty() {
            layer.use_text(line, 12.0, Mm(15.0), Mm(y), &font);
            y -= 8.0;
        }
    }

    doc.save(&mut BufWriter::new(File::create(&path)?))?;
    Ok(path.display().to_string())
}
