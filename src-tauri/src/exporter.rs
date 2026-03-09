use docx_rs::{Docx, Paragraph, Run};
use printpdf::{BuiltinFont, Mm, PdfDocument};
use std::fs::File;
use std::io::BufWriter;
use std::path::{Path, PathBuf};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

use crate::file_handler::validate_allowed_path;

async fn pick_export_path(app: &AppHandle, extension: &str, default_name: &str) -> Result<PathBuf, String> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog()
        .file()
        .add_filter(extension.to_uppercase(), &[extension])
        .set_file_name(default_name)
        .save_file(move |picked| {
            let _ = tx.send(picked.and_then(|path| path.as_path().map(PathBuf::from)));
        });

    rx.await
        .map_err(|_| "dialog channel closed".to_string())?
        .ok_or_else(|| "cancelled".to_string())
}

fn normalize_path(mut path: PathBuf, extension: &str) -> PathBuf {
    if path.extension().and_then(|ext| ext.to_str()) != Some(extension) {
        path.set_extension(extension);
    }
    path
}

fn lines_from_text(text: &str) -> Vec<String> {
    text.lines().map(|line| line.to_string()).collect()
}

pub async fn export_docx(app: AppHandle, plain_text: String) -> Result<String, String> {
    let path = normalize_path(pick_export_path(&app, "docx", "document.docx").await?, "docx");
    validate_allowed_path(Path::new(&path))?;

    let mut doc = Docx::new();
    for line in lines_from_text(&plain_text) {
        let paragraph = Paragraph::new().add_run(Run::new().add_text(line));
        doc = doc.add_paragraph(paragraph);
    }

    let file = File::create(&path).map_err(|err| format!("unable to create file: {err}"))?;
    doc.build()
        .pack(file)
        .map_err(|err| format!("unable to build DOCX: {err}"))?;

    Ok(path.display().to_string())
}

pub async fn export_txt(app: AppHandle, plain_text: String) -> Result<String, String> {
    let path = normalize_path(pick_export_path(&app, "txt", "document.txt").await?, "txt");
    validate_allowed_path(Path::new(&path))?;

    tokio::fs::write(&path, plain_text)
        .await
        .map_err(|err| format!("unable to write TXT: {err}"))?;

    Ok(path.display().to_string())
}

pub async fn export_pdf(app: AppHandle, plain_text: String) -> Result<String, String> {
    let path = normalize_path(pick_export_path(&app, "pdf", "document.pdf").await?, "pdf");
    validate_allowed_path(Path::new(&path))?;

    let (doc, page, layer) = PdfDocument::new("ManjaWord Document", Mm(210.0), Mm(297.0), "Layer 1");
    let current_layer = doc.get_page(page).get_layer(layer);
    let font = doc
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|err| format!("unable to load built-in font: {err}"))?;

    let mut y = 282.0;
    for line in lines_from_text(&plain_text) {
        if y <= 12.0 {
            break;
        }
        current_layer.use_text(line, 11.0, Mm(16.0), Mm(y), &font);
        y -= 7.0;
    }

    let file = File::create(&path).map_err(|err| format!("unable to create PDF file: {err}"))?;
    doc.save(&mut BufWriter::new(file))
        .map_err(|err| format!("unable to write PDF: {err}"))?;

    Ok(path.display().to_string())
}
