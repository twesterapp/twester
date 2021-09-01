use actix_web::{web, HttpRequest, HttpResponse};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::clients::auth::AuthClient;
use crate::{get_token_from_auth_headers, ApiResponse};

#[derive(Deserialize, Serialize, Debug)]
pub struct GetMeQuery {
    username: String,
}

pub async fn get_me(req: HttpRequest, query: web::Query<GetMeQuery>) -> HttpResponse {
    let token = get_token_from_auth_headers(req.headers());

    if let Err(err) = token {
        return err.as_http_response();
    }

    let client = AuthClient::with_token(token.unwrap());
    let response = client.get_me(&query.username).await;

    if response.is_err() {
        response.err().unwrap().as_http_response()
    } else {
        let user = &response.ok().unwrap().data[0];

        let data = json!({
            "display_name": user.display_name,
            "id": user.id,
            "login": user.login,
            "profile_image_url": user.profile_image_url,
        });

        HttpResponse::Ok().json(ApiResponse::new(data))
    }
}
