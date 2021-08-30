pub mod clients;
pub mod handlers;
pub mod models;

use actix_web::http::HeaderMap;
use std::result::Result;

#[derive(Debug)]
pub enum AuthTokenError {
    NotBearer,
    NotFound,
}

impl AuthTokenError {
    pub fn get_message(&self) -> String {
        match self {
            Self::NotFound => "Token not found".to_string(),
            Self::NotBearer => "Token is not of type Bearer".to_string(),
        }
    }
}

pub type TokenResult<'a> = Result<&'a str, AuthTokenError>;

pub fn get_token_from_auth_headers(headers: &HeaderMap) -> TokenResult {
    let auth_header = headers.get("authorization");

    if let Some(auth_header) = auth_header {
        let split: Vec<&str> = auth_header.to_str().unwrap().split(' ').collect();

        if split[0] != "Bearer" {
            return Err(AuthTokenError::NotBearer);
        }

        let token = split[1];
        Ok(token)
    } else {
        Err(AuthTokenError::NotFound)
    }
}
