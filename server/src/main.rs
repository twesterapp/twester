use actix_cors::Cors;
use actix_web::{error, get, web, App, HttpResponse, HttpServer, Result};
use serde_json::json;
use twitch_harvester_server::auth;

/// Check the status of the API.
/// If the API is up and running is will return a 200 OK response.
#[get("/status")]
async fn status() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(json!({ "status": "running" })))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        let cors = Cors::permissive();

        App::new()
            .wrap(cors)
            .service(status)
            .service(
                web::scope("/auth")
                    .route("", web::post().to(auth::controller::login))
                    .route("/two-fa", web::post().to(auth::controller::two_fa))
                    .route("/code", web::post().to(auth::controller::code)),
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
