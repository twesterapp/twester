import axios from 'axios';
import { signout } from 'renderer/utils/auth';

const token = localStorage.getItem('access-token') || '';

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
        if (token) {
            config.headers.Authorization = `OAuth ${token}`;
        }

        return config;
    },
    (err) => {
        return Promise.reject(err);
    }
);

oauthClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (
            error.response.status === 401 ||
            error.response.data.error === 'Unauthorized'
        ) {
            signout();
        }

        return error;
    }
);

bearerClient.interceptors.request.use(
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

bearerClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (
            error.response.status === 401 ||
            error.response.data.error === 'Unauthorized'
        ) {
            signout();
        }

        return error;
    }
);

export async function makeGraphqlRequest(
    data: Record<string, unknown>
): Promise<Record<string, any>> {
    return oauthClient({
        method: 'POST',
        url: 'https://gql.twitch.tv/gql',
        data,
    })
        .then((res) => {
            const data = res.data;
            return data;
        })
        .catch((e) => {
            console.error('Twitch GraphQL request error: \n', e);
        });
}
