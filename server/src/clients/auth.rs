use reqwest::header::HeaderMap;
use std::collections::HashMap;

use either::{Either, Left, Right};

use crate::models::{TwitchGetMeResponse, TwitchUnauthorizedError};

use super::http::{HttpClient, HttpResult, UserAgent, TWITCH_CLIENT_ID};

pub struct AuthClient {
    http: HttpClient,
}

pub enum AuthClientError {
    Unauthorized,
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
    ) -> Either<TwitchUnauthorizedError, T> {
        let text = res.unwrap().text().await.unwrap();

        if text.contains("Unauthorized") {
            let body: TwitchUnauthorizedError = serde_json::from_str(&text).unwrap();
            Left(body)
        } else {
            let body: T = serde_json::from_str(&text).unwrap();
            Right(body)
        }
    }

    pub async fn get_me(
        &self,
        username: &str,
    ) -> Either<TwitchUnauthorizedError, TwitchGetMeResponse> {
        let mut query = HashMap::new();
        query.insert("login", username);

        let res = self
            .http
            .get("https://api.twitch.tv/helix/users", None, &query)
            .await;

        self.handle_response::<TwitchGetMeResponse>(res).await
    }
}
