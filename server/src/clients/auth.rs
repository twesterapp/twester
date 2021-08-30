use reqwest::header::HeaderMap;
use std::collections::HashMap;

use super::http::{ClientResult, HttpClient, UserAgent, TWITCH_CLIENT_ID};

pub struct AuthClient {
    http: HttpClient,
}

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
}

impl AuthClient {
    pub async fn get_me(&self, username: &str) -> ClientResult {
        let mut query = HashMap::new();
        query.insert("login", username);

        self.http
            .get("https://api.twitch.tv/helix/users", None, &query)
            .await
    }
}
