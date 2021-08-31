use actix_web::{web, HttpRequest, HttpResponse};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::clients::auth::AuthClient;
use crate::get_token_from_auth_headers;

#[derive(Deserialize, Serialize, Debug)]
pub struct GetMeQuery {
    username: String,
}

#[derive(Deserialize, Serialize, Debug)]
struct GetMeTwitchResponseInner {
    broadcaster_type: String,
    created_at: String,
    description: String,
    pub display_name: String,
    pub id: String,
    pub login: String,
    offline_image_url: String,
    pub profile_image_url: String,
    r#type: String,
    view_count: u32,
}

#[derive(Deserialize, Serialize, Debug)]
struct GetMeTwitchResponse {
    pub data: Vec<GetMeTwitchResponseInner>,
}

pub async fn get_me(req: HttpRequest, query: web::Query<GetMeQuery>) -> HttpResponse {
    let token = get_token_from_auth_headers(req.headers());

    if let Err(err) = token {
        return HttpResponse::Unauthorized().body(err.get_message());
    }

    let client = AuthClient::with_token(token.unwrap());
    let response = client
        .get_me(&query.username)
        .await
        .unwrap()
        .json::<GetMeTwitchResponse>()
        .await
        .unwrap();

    let user = &response.data[0];

    let my_response = json!({
        "display_name": user.display_name,
        "id": user.id,
        "login": user.login,
        "profile_image_url": user.profile_image_url,
    });

    HttpResponse::Ok().json(my_response)
}