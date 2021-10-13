import axios from 'axios';
import { auth } from 'renderer/core/auth';
import { logging } from 'renderer/core/logging';

const log = logging.getLogger('API');

const token = localStorage.getItem('access-token') || '';
const PORT = '42069';

export const nodeClient = axios.create({
    baseURL: `http://localhost:${PORT}`,
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
            auth.signout();
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
            auth.signout();
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
            log.error('Error while making Twitch GraphQL request:\n', e);
        });
}
