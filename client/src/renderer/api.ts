import axios from 'axios';
import { getToken, getUsername } from './utils';

export const oauthClient = axios.create({
  headers: {
    'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
    Authorization: `OAuth ${getToken()}`,
  },
});

export const bearerClient = axios.create({
  headers: {
    'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
    Authorization: `Bearer ${getToken()}`,
  },
});

export const nodeClient = axios.create({
  baseURL: 'http://localhost:6969',
});

export function fetchChannelInfo(streamerLogin = getUsername()) {
  return bearerClient.get(
    `https://api.twitch.tv/helix/users?login=${streamerLogin}`
  );
}
