use actix_web::{web, HttpRequest, HttpResponse};
use serde::{Deserialize, Serialize};

use crate::clients::auth::AuthClient;
use crate::get_token_from_auth_headers;

#[derive(Deserialize, Serialize, Debug)]
pub struct GetMeQuery {
    username: String,
}

pub async fn get_me(req: HttpRequest, query: web::Query<GetMeQuery>) -> HttpResponse {
    let token = get_token_from_auth_headers(req.headers());

    if let Err(err) = token {
        return HttpResponse::Unauthorized().body(err.get_message());
    }

    let client = AuthClient::with_token(token.unwrap());
    let response = client.get_me(&query.username).await;

    if response.is_left() {
        HttpResponse::Ok().json(response.unwrap_left())
    } else {
        HttpResponse::Ok().json(response.unwrap_right())
    }
}
