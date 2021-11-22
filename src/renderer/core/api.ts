import axios, { AxiosInstance } from 'axios';

import { Core } from './core';
import { StreamerLogin } from './streamer';
import { logging } from './logging';

const log = logging.getLogger('API');

const NODE_PORT = '42069';
const TWITCH_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
const token = localStorage.getItem('access-token') || '';

export class API {
    private core: Core;

    private nodeClient: AxiosInstance;

    private gqlClient: AxiosInstance;

    constructor(core: Core) {
        this.core = core;
        this.nodeClient = this.createNodeClient();
        this.gqlClient = this.createGqlClient();
    }

    public async minuteWatchedRequestUrl(
        login: StreamerLogin
    ): Promise<string> {
        return this.nodeClient
            .get(`/minute-watched-request-url?streamerLogin=${login}`)
            .then((res) => res.data.data.minute_watched_url);
    }

    private createNodeClient(): AxiosInstance {
        return axios.create({
            baseURL: `http://localhost:${NODE_PORT}`,
        });
    }

    private createGqlClient(): AxiosInstance {
        return axios.create({
            method: 'POST',
            url: 'https://gql.twitch.tv/gql',
            headers: {
                'Client-Id': TWITCH_CLIENT_ID,
                Authorization: `OAuth ${token}`,
            },
        });
    }

    private makeGraphqlRequest<
        TResponse extends Record<any, any>,
        TData extends Record<any, any>
    >(data: TData): Promise<TResponse> {
        return this.gqlClient({ data })
            .then((res) => {
                const data = res.data;
                return data;
            })
            .catch((err) => {
                log.error(
                    `Failed to make Twitch GraphQL request [${err?.response?.status}]: ${err?.response?.data?.message}`
                );

                if (
                    err?.response?.status === 401 ||
                    err?.response?.data?.error === 'Unauthorized'
                ) {
                    // The token has probably expired and there is no way to refresh
                    // the token, that's why we signout the user.
                    this.core.auth.logout();
                }
            });
    }
}
