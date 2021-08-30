use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};

use crate::clients::base::BaseClient;
use crate::models::{CodeReqBody, LoginReqBody, TwitchAuthResponse, TwoFaReqBody};

pub async fn login(body: web::Json<LoginReqBody>) -> HttpResponse {
    let username = body.username.to_string();
    let password = body.password.to_string();
    let response = BaseClient::default()
        .send_username_password(username, password)
        .await
        .unwrap()
        .json::<TwitchAuthResponse>()
        .await
        .unwrap();

    AuthResponse::based_on_twitch_auth_response(response)
}

pub async fn two_fa(body: web::Json<TwoFaReqBody>) -> HttpResponse {
    let two_fa_body = TwoFaReqBody {
        username: body.username.to_string(),
        password: body.password.to_string(),
        captcha: body.captcha.to_string(),
        two_fa: body.two_fa.to_string(),
    };
    let response = BaseClient::default()
        .send_two_fa(two_fa_body)
        .await
        .unwrap()
        .json::<TwitchAuthResponse>()
        .await
        .unwrap();

    AuthResponse::based_on_twitch_auth_response(response)
}

pub async fn code(body: web::Json<CodeReqBody>) -> HttpResponse {
    let code_body = CodeReqBody {
        username: body.username.to_string(),
        password: body.password.to_string(),
        captcha: body.captcha.to_string(),
        code: body.code.to_string(),
    };
    let response = BaseClient::default()
        .send_twitchguard_code(code_body)
        .await
        .unwrap()
        .json::<TwitchAuthResponse>()
        .await
        .unwrap();

    AuthResponse::based_on_twitch_auth_response(response)
}

enum TwitchAuthError {
    InvalidLoginCredentials,
    TwoFaTokenRequired,
    InvalidTwoFaToken,
    TwitchguardCodeRequired,
    InvalidTwitchguardCode,
    TooManyInvalidLoginAttempts,
    Unknown,
}

impl TwitchAuthError {
    pub fn new(error_code: i32) -> Self {
        match error_code {
            3001 | 3002 | 3003 => TwitchAuthError::InvalidLoginCredentials,
            3011 => TwitchAuthError::TwoFaTokenRequired,
            3012 => TwitchAuthError::InvalidTwoFaToken,
            3022 => TwitchAuthError::TwitchguardCodeRequired,
            3023 => TwitchAuthError::InvalidTwitchguardCode,
            1000 => TwitchAuthError::TooManyInvalidLoginAttempts,
            _ => TwitchAuthError::Unknown,
        }
    }

    pub fn get_message(&self) -> String {
        match self {
            Self::InvalidLoginCredentials => "Invalid username or password.".to_string(),
            Self::TwoFaTokenRequired => "Two factor authentication token required.".to_string(),
            Self::InvalidTwoFaToken => "Invalid two factor authentication token.".to_string(),
            Self::TwitchguardCodeRequired => "Twitchguard verification code required.".to_string(),
            Self::InvalidTwitchguardCode => "Invalid Twitchguard verification code.".to_string(),
            // How TF do I split this long String to multiple lines without
            // adding "\n               " when sent to client as JSON object.
            Self::TooManyInvalidLoginAttempts => "You have made several failed login attempts. You will have to wait for sometime(typically several hours) before trying again. This occurs because a CAPTCHA SOLVING is required by Twitch and we cannot do that.".to_string(),
            Self::Unknown => "Something unexpected happened".to_string(),
        }
    }
}

#[derive(Deserialize, Serialize, Debug)]
struct Error {
    code: Option<i32>,
    message: Option<String>,
}

impl Error {
    pub fn new(code: i32, message: String) -> Self {
        Error {
            code: Some(code),
            message: Some(message),
        }
    }
}

#[derive(Deserialize, Serialize, Debug)]
struct AuthResponse {
    #[serde(skip_serializing_if = "Option::is_none")]
    access_token: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    captcha: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<Error>,

    #[serde(skip_serializing_if = "Option::is_none")]
    email: Option<String>,
}

impl Default for AuthResponse {
    fn default() -> Self {
        AuthResponse {
            access_token: None,
            captcha: None,
            error: None,
            email: None,
        }
    }
}

impl AuthResponse {
    pub fn based_on_twitch_auth_response(response: TwitchAuthResponse) -> HttpResponse {
        let mut body = AuthResponse::default();

        if let Some(token) = response.access_token {
            body.access_token = Some(token);
        };

        if let Some(captcha) = response.captcha_proof {
            body.captcha = Some(captcha);
        }

        if let Some(code) = response.error_code {
            let message = TwitchAuthError::new(code).get_message();
            body.error = Some(Error::new(code, message));
        };

        if let Some(email) = response.obscured_email {
            body.email = Some(email);
        }

        HttpResponse::Ok().json(body)
    }
}
