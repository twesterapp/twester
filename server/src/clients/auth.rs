use actix_web::HttpResponse;
use reqwest::header::HeaderMap;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::models::TwitchGetMeResponse;
use crate::ApiError;

use super::http::{HttpClient, HttpResult, UserAgent, TWITCH_CLIENT_ID};

pub struct AuthClient {
    http: HttpClient,
}

#[derive(Deserialize, Serialize, Debug)]
pub enum AuthClientError {
    Unauthorized,
}

impl std::fmt::Display for AuthClientError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.get_message())
    }
}

impl std::error::Error for AuthClientError {}

impl AuthClientError {
    fn get_message(&self) -> &str {
        match self {
            Self::Unauthorized => "Unauthorized",
        }
    }

    fn get_json(&self) -> ApiError {
        ApiError::new(None, self.get_message())
    }

    pub fn as_http_response(&self) -> HttpResponse {
        match self {
            Self::Unauthorized => HttpResponse::Unauthorized().json(self.get_json()),
        }
    }
}

pub type AuthClientResult<T> = Result<T, AuthClientError>;

impl AuthClient {
    pub fn with_token(token: &str) -> Self {
        let mut headers: HeaderMap = HeaderMap::new();
        headers.insert("Client-Id", TWITCH_CLIENT_ID.parse().unwrap());
        headers.insert("User-Agent", UserAgent::chrome().parse().unwrap());
        headers.insert(
            "Authorization",
            format!("Bearer {}", token).parse().unwrap(),
        );

        AuthClient {
            http: HttpClient::with_headers(headers),
        }
    }

    async fn handle_response<T: serde::de::DeserializeOwned>(
        &self,
        res: HttpResult,
    ) -> AuthClientResult<T> {
        let text = res.unwrap().text().await.unwrap();

        if text.contains("Unauthorized") {
            Err(AuthClientError::Unauthorized)
        } else {
            let body: T = serde_json::from_str(&text).unwrap();
            Ok(body)
        }
    }

    pub async fn get_me(&self, username: &str) -> AuthClientResult<TwitchGetMeResponse> {
        let mut query = HashMap::new();
        query.insert("login", username);

        let res = self
            .http
            .get("https://api.twitch.tv/helix/users", None, &query)
            .await;

        self.handle_response::<TwitchGetMeResponse>(res).await
    }
}
