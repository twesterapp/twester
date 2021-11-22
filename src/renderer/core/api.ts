import { Streamer, StreamerId, StreamerLogin } from './streamer';
import axios, { AxiosInstance } from 'axios';

import { Core } from './core';
import { StreamerIsOfflineError } from './errors';
import { logging } from './logging';

const log = logging.getLogger('API');

const NODE_PORT = '42069';
const TWITCH_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
const token = localStorage.getItem('access-token') || '';

export interface ChannelContext {
    displayName: string;
    id: string;
    login: string;
}

export class API {
    private core: Core;

    constructor(core: Core) {
        this.core = core;
    }

    public async getMinuteWatchedRequestUrl(
        login: StreamerLogin
    ): Promise<string> {
        return this.getNodeClient()
            .get(`/minute-watched-request-url?streamerLogin=${login}`)
            .then((res) => res.data.data.minute_watched_url);
    }

    public async getBroadcastId(streamer: Streamer): Promise<string> {
        const data = {
            operationName: 'WithIsStreamLiveQuery',
            variables: { id: streamer.id },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash:
                        '04e46329a6786ff3a81c01c50bfa5d725902507a0deb83b0edbf7abe7a3716ea',
                },
            },
        };

        const response = await this.makeGraphqlRequest(data);
        const stream = response.data.user.stream;

        if (!stream) {
            // We catch this error to know if a streamer is online or offline, that's
            // why we are not logging this as exception. We log something as exception
            // if it's unexpected/unhandled/uncaught.
            throw new StreamerIsOfflineError(
                `${streamer.displayName} is offline!`
            );
        }

        const id = stream.id;
        return id;
    }

    public async getUserProfilePicture(id: StreamerId): Promise<string> {
        const data = {
            query: 'query GetUserProfilePicture($userId: ID!) {user(id: $userId) {profileImageURL(width: 300)}}',
            variables: {
                userId: id,
            },
        };

        const response = await this.makeGraphqlRequest(data);
        const profilePictureUrl = response?.data?.user?.profileImageURL;

        if (!profilePictureUrl) {
            const errMsg = `No user profile picture found for streamer id '${id}'.`;
            log.exception(errMsg);
            throw new Error(errMsg);
        }

        return profilePictureUrl;
    }

    public async getChannelContext(
        login: StreamerLogin
    ): Promise<ChannelContext> {
        const data = {
            operationName: 'PersonalSections',
            variables: {
                channelLogin: login,
                creatorAnniversariesExperimentEnabled: false,
                input: {
                    contextChannelName: login,
                    sectionInputs: [
                        'FOLLOWED_SECTION',
                        'RECOMMENDED_SECTION',
                        'SIMILAR_SECTION',
                        'SOCIALPROOF_SECTION',
                    ],
                },
                withChannelUser: true,
            },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash:
                        '9fbdfb00156f754c26bde81eb47436dee146655c92682328457037da1a48ed39',
                },
            },
        };

        const response = await this.makeGraphqlRequest(data);
        const context: ChannelContext = response?.data?.contextUser;

        if (!context) {
            const errMsg = `No channel context info found for login '${login}'`;
            log.exception(errMsg);
            throw new Error(errMsg);
        }

        return context;
    }

    private getNodeClient(): AxiosInstance {
        return axios.create({
            baseURL: `http://localhost:${NODE_PORT}`,
        });
    }

    private async makeGraphqlRequest<
        TResponse extends Record<any, any>,
        TData extends Record<any, any>
    >(data: TData): Promise<TResponse> {
        return axios({
            method: 'POST',
            url: 'https://gql.twitch.tv/gql',
            headers: {
                'Client-Id': TWITCH_CLIENT_ID,
                Authorization: `OAuth ${token}`,
            },
            data,
        })
            .then((res) => {
                const data = res.data;
                return data;
            })
            .catch((error) => {
                log.error(
                    `Failed to make Twitch GraphQL request [${error?.response?.status}]: ${error?.response?.data?.message}`
                );

                if (
                    error?.response?.status === 401 ||
                    error?.response?.data?.error === 'Unauthorized'
                ) {
                    // The token has probably expired and there is no way to refresh
                    // the token, that's why we signout the user.
                    this.core.auth.logout();
                }
            });
    }
}
