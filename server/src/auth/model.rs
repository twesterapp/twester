use serde::{Deserialize};

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
