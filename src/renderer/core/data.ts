// eslint-disable-next-line import/no-cycle
import { makeGraphqlRequest, nodeClient } from 'renderer/api';
import { authStore } from 'renderer/stores/useAuthStore';
// eslint-disable-next-line import/no-cycle
import {
    getAllStreamers,
    isOnline,
    setOnlineStatus,
    StreamerId,
    StreamerLogin,
} from 'renderer/stores/useStreamerStore';
// eslint-disable-next-line import/no-cycle
import { rightNowInSecs } from 'renderer/utils';
import { StreamerIsOfflineError } from './errors';

interface MinuteWatchedRequest {
    url: string;
    payload: { data: string };
}

/**
 *  CACHING
 */
const channelIdByStreamerLogin: Map<string, string> = new Map();
const streamerLoginByChannelId: Map<string, string> = new Map();
const lastOfflineTime: Map<string, number> = new Map();
const minuteWatchedRequests: Map<string, MinuteWatchedRequest> = new Map();

export function getMinuteWatchedRequestInfo(
    login: StreamerLogin
): MinuteWatchedRequest {
    let info = { url: '', payload: { data: '' } };
    if (minuteWatchedRequests.has(login)) {
        info = minuteWatchedRequests.get(login)!;
    }

    return info;
}

async function getMinuteWatchedRequestUrl(
    streamerLogin: string
): Promise<string> {
    return nodeClient
        .get(`/minute-watched-request-url?streamerLogin=${streamerLogin}`)
        .then((res) => res.data.data.minute_watched_url)
        .catch((e) => console.error('Error: ', e));
}

export async function updateMinuteWatchedEventRequestInfo(
    streamerLogin: string
): Promise<undefined> {
    const eventProperties = {
        channel_id: await getChannelId(streamerLogin),
        broadcast_id: await getBroadcastId(streamerLogin),
        player: 'site',
        // eslint-disable-next-line radix
        user_id: parseInt(authStore.getState().user.id),
    };

    const minuteWatched = {
        event: 'minute-watched',
        properties: eventProperties,
    };

    let afterBase64: string;
    try {
        afterBase64 = btoa(JSON.stringify([minuteWatched]));
    } catch (e) {
        console.error('Failed Base64 encoding');
        return undefined;
    }

    const url = await getMinuteWatchedRequestUrl(streamerLogin);
    const payload = {
        data: afterBase64,
    };

    // Caching
    minuteWatchedRequests.set(streamerLogin, { url, payload });

    return undefined;
}

export async function getChannelId(streamerLogin: string): Promise<string> {
    if (channelIdByStreamerLogin.has(streamerLogin)) {
        return channelIdByStreamerLogin.get(streamerLogin)!;
    }

    const id = await fetchChannelId(streamerLogin);
    channelIdByStreamerLogin.set(streamerLogin, id);
    streamerLoginByChannelId.set(id, streamerLogin);

    return id;
}

export function channelIdExistsInCache(id: string): boolean {
    return streamerLoginByChannelId.has(id);
}

export function getStreamerLoginByChannelIdFromCache(id: string): string {
    let login = '';

    if (streamerLoginByChannelId.has(id)) {
        login = streamerLoginByChannelId.get(id)!;
    }

    return login;
}

export async function getBroadcastId(streamerLogin: string): Promise<string> {
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

export async function updateStreamersToWatch() {
    for (const streamer of getAllStreamers()) {
        await checkOnline(streamer.login);
    }
}

export async function checkOnline(login: StreamerLogin) {
    // Twitch API has a delay for querying channels. If a query is made
    // right after the streamer went offline, it will cause a false
    // "streamer is live" event.
    if (rightNowInSecs() < (lastOfflineTime.get(login) ?? 0) + 60) {
        return;
    }

    if (!isOnline(login)) {
        try {
            await updateMinuteWatchedEventRequestInfo(login);
            setOnlineStatus(login, true);
        } catch (err) {
            if (err instanceof StreamerIsOfflineError) {
                setOnlineStatus(login, false);
            }
        }
    }
}

export async function fetchChannelId(login: StreamerLogin) {
    const data = {
        operationName: 'ReportMenuItem',
        variables: {
            channelLogin: login,
        },
        extensions: {
            persistedQuery: {
                version: 1,
                sha256Hash:
                    '8f3628981255345ca5e5453dfd844efffb01d6413a9931498836e6268692a30c',
            },
        },
    };

    const response = await makeGraphqlRequest(data);
    const responseData = response.data;

    const id = responseData?.user?.id;

    // This should never happen, it's just for precaution so that app doesn't
    // crash in production. If a valid `login` is provided, a valid `channelId`
    // will be returned.
    if (!id) {
        console.error('Failed to fetch channel id');
        return '';
    }

    return id;
}

export async function getUserProfilePicture(id: StreamerId) {
    const data = {
        query: 'query GetUserProfilePicture($userId: ID!) {user(id: $userId) {profileImageURL(width: 300)}}',
        variables: {
            userId: id,
        },
    };

    const response = await makeGraphqlRequest(data);
    const profilePictureUrl = response?.data?.user?.profileImageURL;

    if (!profilePictureUrl) {
        console.error('Failed to fetch channel id');
        return '';
    }

    return profilePictureUrl;
}

export interface ContextUser {
    displayName: string;
    id: string;
    login: string;
}

export async function getChannelContextInfo(
    login: StreamerLogin
): Promise<ContextUser | null> {
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
    const contextUser: ContextUser = response?.data?.contextUser;

    if (!contextUser) {
        console.error('Failed to fetch channel context info');
        return null;
    }

    return contextUser;
}
