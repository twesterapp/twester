use reqwest::header::HeaderMap;
use serde::{Deserialize, Serialize};
use serde_json::json;

use super::http::{ClientResult, HttpClient, UserAgent, TWITCH_CLIENT_ID};
use crate::models::{CodeReqBody, TwoFaReqBody};

const AUTH_URL: &str = "https://passport.twitch.tv/login";

pub struct BaseClient {
    http: HttpClient,
}

impl Default for BaseClient {
    fn default() -> Self {
        let mut headers: HeaderMap = HeaderMap::new();
        headers.insert("Client-Id", TWITCH_CLIENT_ID.parse().unwrap());
        headers.insert("User-Agent", UserAgent::chrome().parse().unwrap());

        BaseClient {
            http: HttpClient::with_headers(headers),
        }
    }
}

impl BaseClient {
    pub async fn send_username_password(&self, username: String, password: String) -> ClientResult {
        let auth_body = AuthBody::for_login(username, password);
        let payload = json!(&auth_body);

        self.http.post(AUTH_URL, None, &payload).await
    }

    pub async fn send_two_fa(&self, body: TwoFaReqBody) -> ClientResult {
        let auth_body = AuthBody::for_two_fa(body);
        let payload = json!(&auth_body);

        self.http.post(AUTH_URL, None, &payload).await
    }

    pub async fn send_twitchguard_code(&self, body: CodeReqBody) -> ClientResult {
        let auth_body = AuthBody::for_twitchguard_code(body);
        let payload = json!(&auth_body);

        self.http.post(AUTH_URL, None, &payload).await
    }
}

#[derive(Serialize, Deserialize)]
struct Captcha {
    proof: String,
}

#[derive(Serialize, Deserialize)]
struct AuthBody {
    username: String,
    password: String,
    client_id: String,
    undelete_user: bool,
    remember_me: bool,
    captcha: Option<Captcha>,
    authy_token: Option<String>,
    twitchguard_code: Option<String>,
}

impl AuthBody {
    fn for_login(username: String, password: String) -> Self {
        AuthBody {
            username,
            password,
            client_id: TWITCH_CLIENT_ID.to_string(),
            undelete_user: false,
            remember_me: true,
            captcha: None,
            authy_token: None,
            twitchguard_code: None,
        }
    }

    fn for_two_fa(body: TwoFaReqBody) -> Self {
        AuthBody {
            username: body.username.to_string(),
            password: body.password.to_string(),
            client_id: TWITCH_CLIENT_ID.to_string(),
            undelete_user: false,
            remember_me: true,
            captcha: Some(Captcha {
                proof: body.captcha.to_string(),
            }),
            authy_token: Some(body.two_fa),
            twitchguard_code: None,
        }
    }

    fn for_twitchguard_code(body: CodeReqBody) -> Self {
        AuthBody {
            username: body.username.to_string(),
            password: body.password.to_string(),
            client_id: TWITCH_CLIENT_ID.to_string(),
            undelete_user: false,
            remember_me: true,
            captcha: Some(Captcha {
                proof: body.captcha.to_string(),
            }),
            authy_token: None,
            twitchguard_code: Some(body.code),
        }
    }
}
