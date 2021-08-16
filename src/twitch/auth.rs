use crate::http_client::{ClientResult, Headers, HttpClient, UserAgent, TWITCH_CLIENT_ID};
use actix_web::{web, HttpResponse};
use reqwest::header::HeaderMap;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

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
            username: username,
            password: password,
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
            captcha: Some(Captcha { proof: body.captcha.to_string() }),
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
            captcha: Some(Captcha { proof: body.captcha.to_string() }),
            authy_token: None,
            twitchguard_code: Some(body.code),
        }
    }
}

pub struct AuthClient {
    http: HttpClient,
}

impl AuthClient {
    fn new() -> Self {
        AuthClient {
            http: HttpClient::new(),
        }
    }

    fn get_headers(&self) -> Headers {
        let mut headers = HeaderMap::new();
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

///
/// Models for request and response body.
///

#[derive(Deserialize, Debug)]
pub struct LoginReqBody {
    username: String,
    password: String,
}

#[derive(Deserialize, Debug)]
pub struct TwoFaReqBody {
    username: String,
    password: String,
    captcha: String,
    two_fa: String,
}

#[derive(Deserialize, Debug)]
pub struct CodeReqBody {
    username: String,
    password: String,
    captcha: String,
    code: String,
}

pub struct Controller;

impl Controller {
    pub async fn login(body: web::Json<LoginReqBody>) -> HttpResponse {
        let username = body.username.to_string();
        let password = body.password.to_string();
        let response = AuthClient::new()
            .send_username_password(username, password)
            .await;

        let json = response.unwrap().json::<Value>().await.unwrap();
        HttpResponse::Ok().json(json)
    }

    pub async fn two_fa(body: web::Json<TwoFaReqBody>) -> HttpResponse {
        let two_fa_body = TwoFaReqBody {
            username: body.username.to_string(),
            password: body.password.to_string(),
            captcha: body.captcha.to_string(),
            two_fa: body.two_fa.to_string(),
        };

        let response = AuthClient::new()
            .send_two_fa(two_fa_body)
            .await;

        let json = response.unwrap().json::<Value>().await.unwrap();
        HttpResponse::Ok().json(json)
    }

    pub async fn code(body: web::Json<CodeReqBody>) -> HttpResponse {
        let code_body = CodeReqBody {
            username: body.username.to_string(),
            password: body.password.to_string(),
            captcha: body.captcha.to_string(),
            code: body.code.to_string(),
        };

        let response = AuthClient::new()
            .send_code(code_body)
            .await;

        let json = response.unwrap().json::<Value>().await.unwrap();
        HttpResponse::Ok().json(json)
    }
}
