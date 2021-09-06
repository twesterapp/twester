import axios from 'axios';
import { getToken, getUser } from './utils';

export const nodeClient = axios.create({
  baseURL: 'http://localhost:6969',
});

export const oauthClient = axios.create({
  headers: {
    'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
  },
});

export const bearerClient = axios.create({
  headers: {
    'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
  },
});

oauthClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `OAuth ${token}`;
    }

    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

bearerClient.interceptors.request.use(
  (config) => {
    console.log('Inside interceptor');
    const token = getToken();
    console.log('Token value inside interceptor', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

export function fetchChannelInfo(streamerLogin = getUser().login) {
  return bearerClient.get(
    `https://api.twitch.tv/helix/users?login=${streamerLogin}`
  );
}

export function fetchChannelFollowers(channelId: string) {
  return bearerClient.get(
    `https://api.twitch.tv/helix/users/follows?to_id=${channelId}`
  );
}
