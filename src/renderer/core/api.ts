import { Streamer, StreamerId, StreamerLogin } from './streamer';
import axios, { Method } from 'axios';

import { Core } from './core';
import { MinuteWatchedRequestInfo } from './stream';
import { StreamerIsOfflineError } from './errors';
import { logging } from './logging';

const NODE_PORT = '42069';
const TWITCH_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
const token = localStorage.getItem('access-token') || '';

export interface ChannelContext {
    displayName: string;
    id: string;
    login: string;
}
const log = logging.getLogger('API');

export class API {
    private core: Core;

    constructor(core: Core) {
        this.core = core;
    }

    public async login(data: { username: string; password: string }) {
        return this.makeNodeRequest('POST', '/auth', data);
    }

    public resendCode(username: string) {
        return this.makeNodeRequest(
            'POST',
            `/auth/resend-code?streamerLogin=${username}`
        );
    }

    public async submitTwitchguardCode(data: {
        username: string;
        password: string;
        captcha: string;
        code: string;
    }) {
        return this.makeNodeRequest('POST', '/auth/code', data);
    }

    public async submitTwoFaCode(data: {
        username: string;
        password: string;
        captcha: string;
        two_fa: string;
    }) {
        return this.makeNodeRequest('POST', '/auth/two-fa', data);
    }

    public async getMinuteWatchedRequestUrl(
        login: StreamerLogin
    ): Promise<string> {
        const data = await this.makeNodeRequest(
            'GET',
            `/minute-watched-request-url?streamerLogin=${login}`
        );

        const url = data?.data?.minute_watched_url;

        if (!url) {
            const errMsg = `Failed to get minute watched request url for login '${login}'.`;
            log.exception(errMsg);
            throw new Error(errMsg);
        }

        return url;
    }

    public sendMinuteWatchedEvent(info: MinuteWatchedRequestInfo): void {
        this.makeNodeRequest('POST', '/minute-watched-event', info);
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
        const stream = response?.data?.user?.stream;

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

    public getChannelPointsContext(login: StreamerLogin) {
        const data = {
            operationName: 'ChannelPointsContext',
            variables: { channelLogin: login },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash:
                        '9988086babc615a918a1e9a722ff41d98847acac822645209ac7379eecb27152',
                },
            },
        };

        return this.makeGraphqlRequest(data);
    }

    public claimChannelPointsBonus(id: StreamerId, claimId: string): void {
        const data = {
            operationName: 'ClaimCommunityPoints',
            variables: {
                input: {
                    channelID: id,
                    claimID: claimId,
                },
            },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash:
                        '46aaeebe02c99afdf4fc97c7c0cba964124bf6b0af229395f1f6d1feed05b3d0',
                },
            },
        };

        this.makeGraphqlRequest(data);
    }

    public joinRaid(raidId: string): void {
        const data = {
            operationName: 'JoinRaid',
            variables: { input: { raidID: raidId } },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash:
                        'c6a332a86d1087fbbb1a8623aa01bd1313d2386e7c63be60fdb2d1901f01a4ae',
                },
            },
        };

        this.makeGraphqlRequest(data);
    }

    private async makeNodeRequest<
        TData extends Record<any, any>,
        TResponse extends Record<any, any>,
        TError extends Record<any, any>
    >(
        method: Method,
        path: string,
        data: TData = {} as TData
    ): Promise<TResponse | TError> {
        return axios({
            method,
            url: `http://localhost:${NODE_PORT}${path}`,
            data,
        })
            .then((res) => {
                const data = res.data;
                return data as TResponse;
            })
            .catch((error) => {
                log.error(
                    `makeNodeRequest failed: [${error?.response?.status}]: ${error?.response?.data?.message}`
                );

                return error as TError;
            });
    }

    private async makeGraphqlRequest<
        TData extends Record<any, any>,
        TResponse extends Record<any, any>,
        TError extends Record<any, any>
    >(data: TData): Promise<TResponse | TError> {
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
                return data as TResponse;
            })
            .catch((error) => {
                log.error(
                    `makeGraphqlRequest failed: [${error?.response?.status}]: ${error?.response?.data?.message}`
                );

                if (
                    error?.response?.status === 401 ||
                    error?.response?.data?.error === 'Unauthorized'
                ) {
                    // The token has probably expired and there is no way to refresh
                    // the token, that's why we signout the user.
                    this.core.auth.logout();
                }

                return error as TError;
            });
    }
}
