use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug)]
pub struct LoginReqBody {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize, Debug)]
pub struct TwoFaReqBody {
    pub username: String,
    pub password: String,
    pub captcha: String,
    pub two_fa: String,
}

#[derive(Deserialize, Debug)]
pub struct CodeReqBody {
    pub username: String,
    pub password: String,
    pub captcha: String,
    pub code: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct TwitchAuthResponse {
    pub access_token: Option<String>,
    pub captcha_proof: Option<String>,
    pub error: Option<String>,
    pub error_code: Option<i32>,
    pub error_description: Option<String>,
    pub obscured_email: Option<String>,
}
