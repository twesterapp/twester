use crate::auth::client::AuthClient;
use crate::auth::model::{
    AuthResponse, CodeReqBody, LoginReqBody, TwitchAuthResponse, TwoFaReqBody,
};
use actix_web::{web, HttpResponse};

pub async fn login(body: web::Json<LoginReqBody>) -> HttpResponse {
    let username = body.username.to_string();
    let password = body.password.to_string();
    let response = AuthClient::default()
        .send_username_password(username, password)
        .await;
    let twitch_auth_response = response
        .unwrap()
        .json::<TwitchAuthResponse>()
        .await
        .unwrap();

    HttpResponse::Ok().json(AuthResponse::from_twitch_auth_response(
        twitch_auth_response,
    ))
}

pub async fn two_fa(body: web::Json<TwoFaReqBody>) -> HttpResponse {
    let two_fa_body = TwoFaReqBody {
        username: body.username.to_string(),
        password: body.password.to_string(),
        captcha: body.captcha.to_string(),
        two_fa: body.two_fa.to_string(),
    };
    let response = AuthClient::default().send_two_fa(two_fa_body).await;
    let twitch_auth_response = response
        .unwrap()
        .json::<TwitchAuthResponse>()
        .await
        .unwrap();

    HttpResponse::Ok().json(AuthResponse::from_twitch_auth_response(
        twitch_auth_response,
    ))
}

pub async fn code(body: web::Json<CodeReqBody>) -> HttpResponse {
    let code_body = CodeReqBody {
        username: body.username.to_string(),
        password: body.password.to_string(),
        captcha: body.captcha.to_string(),
        code: body.code.to_string(),
    };
    let response = AuthClient::default().send_twitchguard_code(code_body).await;
    let twitch_auth_response = response
        .unwrap()
        .json::<TwitchAuthResponse>()
        .await
        .unwrap();

    HttpResponse::Ok().json(AuthResponse::from_twitch_auth_response(
        twitch_auth_response,
    ))
}
