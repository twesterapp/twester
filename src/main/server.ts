import axios from 'axios';
import express, { Application, NextFunction, Request, Response } from 'express';
import querystring from 'querystring';
import { createServer } from 'http';
import { print } from './util';

const SERVER = 'SERVER   ';
const SERVER_HEX = '#C266FC';

function log(...args: any) {
    print(new Date(), SERVER, SERVER_HEX, ...args);
}

const client = axios.create({
    headers: {
        'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
    },
});

interface TwoFaReqBody {
    username: string;
    password: string;
    captcha: string;
    two_fa: string;
}

interface CodeReqBody {
    username: string;
    password: string;
    captcha: string;
    code: string;
}

interface TwitchAuthResponse {
    access_token?: string;
    captcha_proof?: string;
    error?: string;
    error_code?: TwitchAuthErrorCodes;
    obscured_email?: string;
}

interface LoginReqBody {
    username: string;
    password: string;
}

interface AuthResponse {
    access_token?: string;
    captcha?: string;
    error?: { code: TwitchAuthErrorCodes; message: string };
    email?: string;
}

type TwitchAuthErrorCodes =
    | 3001
    | 3002
    | 3003
    | 3011
    | 3012
    | 3022
    | 3023
    | 1000
    | 1014;

interface AuthBody {
    username: string;
    password: string;
    client_id: string;
    undelete_user: boolean;
    remember_me: boolean;
    captcha?: { proof: string };
    authy_token?: string;
    twitchguard_code?: string;
}

const defaultAuthBody: AuthBody = {
    username: '',
    password: '',
    client_id: 'kimne78kx3ncx6brgo4mv6wki5h1ko',
    undelete_user: false,
    remember_me: true,
};

function getTwitchAuthErrorMessage(code: TwitchAuthErrorCodes) {
    let message: string;

    switch (code) {
        case 3001 || 3002 || 3003: {
            message = 'Invalid login credentials';
            break;
        }

        case 3011: {
            message = 'Two factor authentication token required';
            break;
        }

        case 3012: {
            message = 'Invalid two factor authentication token';
            break;
        }

        case 3022: {
            message = 'Twitchguard verification code required';
            break;
        }

        case 3023: {
            message = 'Invalid Twitchguard verification code';
            break;
        }

        case 1000: {
            message = 'Captcha Solving required';
            break;
        }

        case 1014: {
            message = 'User does not exist';
            break;
        }

        default: {
            message = 'Something unexpected happened';
            break;
        }
    }

    return message;
}

function createAuthResBody(res: TwitchAuthResponse): AuthResponse {
    const authResponse: AuthResponse = {};

    if (res.access_token) {
        authResponse.access_token = res.access_token;
        return authResponse;
    }

    if (res.captcha_proof) {
        authResponse.captcha = res.captcha_proof;
    }

    if (res.error_code) {
        const message = getTwitchAuthErrorMessage(res.error_code);
        const error = {
            code: res.error_code,
            message,
        };

        authResponse.error = error;
    }

    if (res.obscured_email) {
        authResponse.email = res.obscured_email;
    }

    return authResponse;
}

async function makeRequest(body: AuthBody): Promise<TwitchAuthResponse> {
    let twitchResponse;

    try {
        const result = await client.post(
            'https://passport.twitch.tv/login',
            body
        );
        twitchResponse = result.data;
    } catch (e) {
        twitchResponse = e.response.data;
    }

    return twitchResponse;
}

async function login(req: Request, res: Response): Promise<Response> {
    const body: LoginReqBody = req.body;
    const { username, password } = body;
    const authBody: AuthBody = {
        ...defaultAuthBody,
        username,
        password,
    };

    const twitchResponse = await makeRequest(authBody);

    return res.status(200).json(createAuthResBody(twitchResponse));
}

async function twoFA(req: Request, res: Response): Promise<Response> {
    const body: TwoFaReqBody = req.body;
    const authBody: AuthBody = {
        ...defaultAuthBody,
        username: body.username,
        password: body.password,
        captcha: { proof: body.captcha },
        authy_token: body.two_fa,
    };

    const twitchResponse = await makeRequest(authBody);

    return res.status(200).json(createAuthResBody(twitchResponse));
}

async function code(req: Request, res: Response): Promise<Response> {
    const body: CodeReqBody = req.body;
    const authBody: AuthBody = {
        ...defaultAuthBody,
        username: body.username,
        password: body.password,
        captcha: { proof: body.captcha },
        twitchguard_code: body.code,
    };

    const twitchResponse = await makeRequest(authBody);

    return res.status(200).json(createAuthResBody(twitchResponse));
}

async function minuteWatchedRequestUrl(
    req: Request,
    res: Response
): Promise<Response> {
    const streamerLogin = req.query.streamerLogin;

    if (!streamerLogin) {
        return res.status(400).json({
            error: {
                message: 'No streamer login provide in the request query',
            },
        });
    }

    try {
        const mainPageRequest = await client.get(
            `https://www.twitch.tv/${streamerLogin}`
        );

        const mainPageResponse = mainPageRequest.data;
        const settingsUrl = mainPageResponse.match(
            /https:\/\/static.twitchcdn.net\/config\/settings.*?js/
        )[0];

        const settingsRequest = await client.get(settingsUrl);
        const settingsResponse = settingsRequest.data;
        const minuteWatchedUrl =
            settingsResponse.match(/"spade_url":"(.*?)"/)[1];

        return res.status(200).json({
            data: {
                minute_watched_url: minuteWatchedUrl,
            },
        });
    } catch (_) {
        return res.status(500).json({
            error: {
                message: 'Error while trying to fetch minute watched url',
            },
        });
    }
}

interface MinuteWatchedEventBody {
    url: string;
    payload: { data: string };
}

async function sendMinuteWatchedEvent(
    req: Request,
    res: Response
): Promise<Response> {
    const body: MinuteWatchedEventBody = req.body;

    if (!body.url || !body.payload) {
        return res
            .status(400)
            .json({ error: { message: 'Invalid request body' } });
    }

    try {
        const result = await axios.post(
            body.url,
            querystring.stringify(body.payload),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
                },
            }
        );

        if (result.status === 204) {
            return res.status(200).json({});
        }

        return res.status(500).json({
            error: {
                message: 'Error while trying to send minute watched event',
            },
        });
    } catch (e) {
        return res.status(500).json({
            error: {
                message: 'Error while trying to send minute watched event',
            },
        });
    }
}

async function resendCode(req: Request, res: Response): Promise<Response> {
    const streamerLogin = req.query.streamerLogin;

    if (!streamerLogin) {
        return res.status(400).json({
            error: {
                message: 'No streamer login provide in the request query',
            },
        });
    }

    try {
        await client.post(
            `https://passport.twitch.tv/resend_login_verification_email?login=${streamerLogin}`
        );

        return res.status(200).json({});
    } catch (e) {
        return res.status(200).json(e.response?.data);
    }
}

function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
    const startTime = new Date().getTime();

    res.on('finish', () => {
        const endTime = new Date().getTime() - startTime;
        log(`${res.statusCode} ${req.method} ${req.originalUrl} ${endTime}ms`);
    });

    next();
}

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

app.use((_, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
});

app.get('/', (_, res) => res.status(200).json({ running: 'yes' }));
app.get('/minute-watched-request-url', minuteWatchedRequestUrl);
app.post('/minute-watched-event', sendMinuteWatchedEvent);
app.post('/auth', login);
app.post('/auth/two-fa', twoFA);
app.post('/auth/code', code);
app.post('/auth/resend-code', resendCode);

// This helps to prevent express from throwing `EADDRINUSE` error when user
// tries to start another instance of the app.
function isPortFree(port: string) {
    return new Promise((resolve) => {
        const server = createServer()
            .listen(port, () => {
                server.close();
                log(`Port ${port} is free`);
                resolve(true);
            })
            .on('error', () => {
                log(`Port ${port} is not free`);
                resolve(false);
            });
    });
}

const PORT = '42069';

export async function startServer() {
    if (await isPortFree(PORT)) {
        app.listen(PORT, () => {
            log(`Server started at http://127.0.0.1:${PORT} 🚀`);
        });
    }
}
