import { StreamerId, StreamerLogin } from './streamer';
import { makeGraphqlRequest, nodeClient } from '../api';

import { StreamerIsOfflineError } from './errors';
import { logging } from './logging';

const log = logging.getLogger('DATA');
/**
 *  CACHING
 */
const channelIdByStreamerLogin: Map<string, string> = new Map();
const streamerLoginByChannelId: Map<string, string> = new Map();

export async function fetchMinuteWatchedRequestUrl(
    login: StreamerLogin
): Promise<string> {
    return nodeClient
        .get(`/minute-watched-request-url?streamerLogin=${login}`)
        .then((res) => res.data.data.minute_watched_url)
        .catch((err) =>
            log.error(
                `Failed to fetch minute watched request URL for login '${login}'.\n`,
                err
            )
        );
}

export async function getChannelId(streamerLogin: string): Promise<string> {
    const id = channelIdByStreamerLogin.get(streamerLogin);

    if (id) {
        return id;
    }

    const channelId = await fetchChannelId(streamerLogin);
    channelIdByStreamerLogin.set(streamerLogin, channelId);
    streamerLoginByChannelId.set(channelId, streamerLogin);

    return channelId;
}

export function channelIdExistsInCache(id: string): boolean {
    return streamerLoginByChannelId.has(id);
}

export function getStreamerLoginByChannelIdFromCache(id: string): string {
    const login = streamerLoginByChannelId.get(id)!;

    if (!login) {
        throw new Error(`No login exists for channel id '${id}'`);
    }

    return login;
}

export async function fetchBroadcastId(streamerLogin: string): Promise<string> {
    const data = {
        operationName: 'WithIsStreamLiveQuery',
        variables: { id: await getChannelId(streamerLogin) },
        extensions: {
            persistedQuery: {
                version: 1,
                sha256Hash:
                    '04e46329a6786ff3a81c01c50bfa5d725902507a0deb83b0edbf7abe7a3716ea',
            },
        },
    };

    const response = await makeGraphqlRequest(data);
    const stream = response.data.user.stream;

    if (!stream) {
        throw new StreamerIsOfflineError(`${streamerLogin} is offline!`);
    }

    const id = stream.id;
    return id;
}


export async function fetchUserProfilePicture(id: StreamerId) {
    const data = {
        query: 'query GetUserProfilePicture($userId: ID!) {user(id: $userId) {profileImageURL(width: 300)}}',
        variables: {
            userId: id,
        },
    };

    const response = await makeGraphqlRequest(data);
    const profilePictureUrl = response?.data?.user?.profileImageURL;

    if (!profilePictureUrl) {
        log.error(`No user profile picture found for streamerId '${id}'`);
        return '';
    }

    return profilePictureUrl;
}

export interface ChannelContext {
    displayName: string;
    id: string;
    login: string;
}

export async function fetchChannelContextInfo(
    login: StreamerLogin
): Promise<ChannelContext | null> {
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

    const response = await makeGraphqlRequest(data);
    const context: ChannelContext = response?.data?.contextUser;

    if (!context) {
        log.error(`No channel context info found for login '${login}'`);
        return null;
    }

    return context;
}
