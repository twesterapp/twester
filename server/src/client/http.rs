use reqwest::header::HeaderMap;
use reqwest::{Client, Error, Method, RequestBuilder, Response};
use serde_json::Value;
use std::time::Instant;
use std::{collections::HashMap, result::Result};

pub const TWITCH_CLIENT_ID: &str = "kimne78kx3ncx6brgo4mv6wki5h1ko";

pub struct UserAgent;

impl UserAgent {
    pub fn chrome() -> &'static str {
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
    }
}

pub type Headers = HeaderMap;
pub type Query<'a> = HashMap<&'a str, &'a str>;
pub type ClientResult = Result<Response, Error>;

/// Simple HTTP Client which can be used to perform all kinds of HTTP requests.
pub struct HttpClient {
    client: Client,
}

impl Default for HttpClient {
    fn default() -> Self {
        let client = Client::new();
        HttpClient { client }
    }
}

impl HttpClient {
    pub fn with_headers(headers: HeaderMap) -> Self {
        let client = Client::builder().default_headers(headers).build().unwrap();
        HttpClient { client }
    }

    pub async fn post(
        &self,
        url: &str,
        headers: Option<&Headers>,
        payload: &Value,
    ) -> ClientResult {
        self.request(Method::POST, url, headers, |req| req.json(payload))
            .await
    }

    pub async fn get(
        &self,
        url: &str,
        headers: Option<&Headers>,
        payload: &Query<'_>,
    ) -> ClientResult {
        self.request(Method::GET, url, headers, |req| req.query(payload))
            .await
    }

    async fn request<D>(
        &self,
        method: Method,
        url: &str,
        headers: Option<&Headers>,
        add_data: D,
    ) -> ClientResult
    where
        D: Fn(RequestBuilder) -> RequestBuilder,
    {
        let mut request = self.client.request(method.clone(), url);

        if let Some(headers) = headers {
            request = request.headers(headers.clone());
        }

        request = add_data(request);
        let start = Instant::now();
        let response = request.send().await?;
        let duration = start.elapsed().as_millis();
        let status = &response.status();
        println!(
            "[HttpClient] - {} {} {} {:?}ms",
            method, status, url, duration
        );
        Ok(response)
    }
}
