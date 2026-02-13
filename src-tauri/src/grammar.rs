use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct GrammarMatch {
    pub message: String,
    pub offset: usize,
    pub length: usize,
    pub replacements: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GrammarResponse {
    pub matches: Vec<GrammarMatch>,
}

#[derive(Debug, Deserialize)]
struct LTResponse {
    matches: Vec<LTMatch>,
}

#[derive(Debug, Deserialize)]
struct LTMatch {
    message: String,
    offset: usize,
    length: usize,
    replacements: Vec<LTReplacement>,
}

#[derive(Debug, Deserialize)]
struct LTReplacement {
    value: String,
}

#[derive(Debug, Error)]
pub enum GrammarError {
    #[error("grammar service unavailable")]
    Unavailable,
}

pub async fn grammar_check(text: String) -> Result<GrammarResponse, GrammarError> {
    let client = reqwest::Client::new();
    let resp = client
        .post("http://localhost:8081/v2/check")
        .form(&[("text", text), ("language", "en-US".to_string())])
        .send()
        .await
        .map_err(|_| GrammarError::Unavailable)?;

    let parsed: LTResponse = resp.json().await.map_err(|_| GrammarError::Unavailable)?;
    let mapped = parsed
        .matches
        .into_iter()
        .map(|m| GrammarMatch {
            message: m.message,
            offset: m.offset,
            length: m.length,
            replacements: m.replacements.into_iter().map(|r| r.value).collect(),
        })
        .collect();

    Ok(GrammarResponse { matches: mapped })
}
