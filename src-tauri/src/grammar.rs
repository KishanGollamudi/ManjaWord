use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GrammarResponse {
    pub available: bool,
    pub matches: usize,
    pub message: Option<String>,
}

#[derive(Debug, Deserialize)]
struct LanguageToolResponse {
    matches: Vec<LanguageToolMatch>,
}

#[derive(Debug, Deserialize)]
struct LanguageToolMatch {
    _message: String,
}

pub async fn check_grammar(text: String) -> Result<GrammarResponse, String> {
    if text.trim().is_empty() {
        return Ok(GrammarResponse {
            available: true,
            matches: 0,
            message: None,
        });
    }

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .map_err(|err| format!("unable to initialize grammar client: {err}"))?;

    let response = client
        .post("http://localhost:8081/v2/check")
        .form(&[("language", "en-US"), ("text", text.as_str())])
        .send()
        .await;

    match response {
        Ok(resp) => {
            if !resp.status().is_success() {
                return Ok(GrammarResponse {
                    available: false,
                    matches: 0,
                    message: Some(format!("grammar server status: {}", resp.status())),
                });
            }

            let payload: LanguageToolResponse = resp
                .json()
                .await
                .map_err(|err| format!("invalid grammar response: {err}"))?;

            Ok(GrammarResponse {
                available: true,
                matches: payload.matches.len(),
                message: None,
            })
        }
        Err(_) => Ok(GrammarResponse {
            available: false,
            matches: 0,
            message: Some("LanguageTool server unavailable".to_string()),
        }),
    }
}
