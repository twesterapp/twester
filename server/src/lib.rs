pub mod clients;
pub mod handlers;
pub mod models;

use actix_web::{http::HeaderMap, HttpResponse};
use serde::{Deserialize, Serialize};
use std::result::Result;

#[derive(Deserialize, Serialize, Debug)]
pub struct ApiResponse<T> {
    data: T,
}

impl<T> ApiResponse<T>
where
    T: serde::de::DeserializeOwned,
{
    pub fn new(data: T) -> Self {
        ApiResponse { data }
    }
}

#[derive(Deserialize, Serialize, Debug)]
pub struct Error {
    #[serde(skip_serializing_if = "Option::is_none")]
    code: Option<u16>,
    message: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ApiError {
    error: Error,
}

impl ApiError {
    pub fn new(code: Option<u16>, message: &str) -> Self {
        ApiError {
            error: Error {
                code,
                message: message.to_string(),
            },
        }
    }
}

#[derive(Debug)]
pub enum AuthTokenError {
    NotBearer,
    NotFound,
}

impl AuthTokenError {
    pub fn as_http_response(&self) -> HttpResponse {
        HttpResponse::Unauthorized().json(ApiError::new(None, self.get_message()))
    }

    fn get_message<'a>(&self) -> &'a str {
        match self {
            Self::NotFound => "Authorization token is missing",
            Self::NotBearer => "Authorization token must be of type Bearer",
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
