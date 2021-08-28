import axios from 'axios';
import express, { Application, NextFunction, Request, Response } from 'express';

const isProd = process.env.NODE_ENV === 'PRODUCTION';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function log(...args: any) {
  if (!isProd) {
    console.log('[AUTH_NODE_SERVER]:', ...args);
  }
}

const client = axios.create({
  baseURL: 'https://passport.twitch.tv/login',
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
  | 1000;

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
      message = 'Invalid username or password.';
      break;
    }

    case 3011: {
      message = 'Two factor authentication token required.';
      break;
    }

    case 3012: {
      message = 'Invalid two factor authentication token.';
      break;
    }

    case 3022: {
      message = 'Twitchguard verification code required.';
      break;
    }

    case 3023: {
      message = 'Invalid Twitchguard verification code.';
      break;
    }

    case 1000: {
      message =
        'You have made several failed login attempts. You will have to wait for sometime(typically several hours) before trying again. This occurs because a CAPTCHA SOLVING is required by Twitch and we cannot do that.';
      break;
    }

    default: {
      message = 'Something unexpected happened.';
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
    const result = await client.post('', body);
    twitchResponse = result.data;
  } catch (e) {
    twitchResponse = e.response.data;
  }

  log(twitchResponse);
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

function logger(req: Request, res: Response, next: NextFunction) {
  const startTime = new Date().getTime();

  res.on('finish', () => {
    const endTime = new Date().getTime() - startTime;

    log(`${req.method} ${req.originalUrl} ${res.statusCode} ${endTime}ms`);
  });
  next();
}

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.get('/', (_, res) => res.status(200).json({ running: 'yes' }));
app.post('/auth', login);
app.post('/auth/two-fa', twoFA);
app.post('/auth/code', code);

export function startServer() {
  app.listen('6969', () => {
    log('Running on port 6969');
  });
}