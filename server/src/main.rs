use actix_cors::Cors;
use actix_web::{error, get, web, App, HttpResponse, HttpServer, Result};
use serde_json::json;

use twester::auth;

#[get("/")]
async fn running_status() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(json!({ "running": "yes" })))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Server up and running on 127.0.0.1:7878");

    HttpServer::new(|| {
        let cors = Cors::permissive();

        App::new()
            .wrap(cors)
            .service(running_status)
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
