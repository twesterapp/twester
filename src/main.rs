use actix_web::{error, get, web, App, HttpResponse, HttpServer, Result};
use backend::twitch::auth;
use serde_json::json;

/// Check the status of the API.
/// If the API is up and running is will return a 200 OK response.
#[get("/status")]
async fn status() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(json!({ "status": "running" })))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(status)
            .service(
                web::scope("/auth")
                    .route("", web::post().to(auth::Controller::login))
                    .route("/two-fa", web::post().to(auth::Controller::two_fa))
                    .route("/code", web::post().to(auth::Controller::code)),
            )
            .app_data(web::JsonConfig::default().error_handler(|err, _req| {
                error::InternalError::from_response(
                    "",
                    HttpResponse::BadRequest()
                        .content_type("application/json")
                        .body(format!(r#"{{"error":"{}"}}"#, err)),
                )
                .into()
            }))
    })
    .bind("127.0.0.1:7878")?
    .run()
    .await
}
