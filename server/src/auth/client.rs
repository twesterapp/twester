use crate::http_client::{ClientResult, Headers, HttpClient, UserAgent, TWITCH_CLIENT_ID};
use crate::auth::model::{CodeReqBody, TwoFaReqBody};

use reqwest::header::HeaderMap;
use serde::{Deserialize, Serialize};
use serde_json::{json};

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

    fn for_code(body: CodeReqBody) -> Self {
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

pub struct AuthClient {
    http: HttpClient,
}

impl Default for AuthClient {
    fn default() -> Self {
        AuthClient {
            http: HttpClient::default(),
        }
    }
}

impl AuthClient {
    fn get_headers(&self) -> Headers {
        let mut headers = HeaderMap::default();
        headers.insert("Client-Id", TWITCH_CLIENT_ID.parse().unwrap());
        headers.insert("User-Agent", UserAgent::chrome().parse().unwrap());
        headers
    }

    pub async fn send_username_password(&self, username: String, password: String) -> ClientResult {
        let headers = self.get_headers();
        let auth_body = AuthBody::for_login(username, password);
        let payload = json!(&auth_body);

        self.http
            .post("https://passport.twitch.tv/login", Some(&headers), &payload)
            .await
    }

    pub async fn send_two_fa(&self, body: TwoFaReqBody) -> ClientResult {
        let headers = self.get_headers();
        let auth_body = AuthBody::for_two_fa(body);
        let payload = json!(&auth_body);

        self.http
            .post("https://passport.twitch.tv/login", Some(&headers), &payload)
            .await
    }

    pub async fn send_code(&self, body: CodeReqBody) -> ClientResult {
        let headers = self.get_headers();
        let auth_body = AuthBody::for_code(body);
        let payload = json!(&auth_body);

        self.http
            .post("https://passport.twitch.tv/login", Some(&headers), &payload)
            .await
    }
}
