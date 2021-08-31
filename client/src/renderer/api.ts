import axios from 'axios';
import { getToken, isAuth } from './utils';

let token: string | null;

if (isAuth()) {
  token = getToken();
}

export const client = axios.create({
  baseURL: 'http://localhost:7878',
});

client.interceptors.request.use(
  (config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);
