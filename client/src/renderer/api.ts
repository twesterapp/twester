import axios from 'axios';
import { authStore } from 'renderer/stores/useAuthStore';

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
    const token = authStore.getState().accessToken;

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
    const token = authStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

export function fetchChannelInfo(
  streamerLogin = authStore.getState().user.login
) {
  return bearerClient.get(
    `https://api.twitch.tv/helix/users?login=${streamerLogin}`
  );
}

export function fetchChannelFollowers(channelId: string) {
  return bearerClient.get(
    `https://api.twitch.tv/helix/users/follows?to_id=${channelId}`
  );
}

export async function makeGraphqlRequest(
  data: Record<string, any>
): Promise<Record<string, any>> {
  return oauthClient({ method: 'POST', url: 'https://gql.twitch.tv/gql', data })
    .then((res) => {
      const data = res.data;
      return data;
    })
    .catch((e) => {
      console.error('Twitch GraphQL request error: \n', e);
    });
}
