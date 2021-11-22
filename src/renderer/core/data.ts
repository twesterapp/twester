import { Streamer, StreamerId, StreamerLogin } from './streamer';
import { makeGraphqlRequest, nodeClient } from '../api';

import { StreamerIsOfflineError } from './errors';
import { logging } from './logging';

const log = logging.getLogger('DATA');

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

export async function fetchBroadcastId(streamer: Streamer): Promise<string> {
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

    const response = await makeGraphqlRequest(data);
    const stream = response.data.user.stream;

    if (!stream) {
        // We catch this error to know if a streamer is online or offline, that's
        // why we are not logging this as exception. We log something as exception
        // if it's unexpected/unhandled/uncaught.
        throw new StreamerIsOfflineError(`${streamer.displayName} is offline!`);
    }

    const id = stream.id;
    return id;
}

export async function fetchUserProfilePicture(id: StreamerId): Promise<string> {
    const data = {
        query: 'query GetUserProfilePicture($userId: ID!) {user(id: $userId) {profileImageURL(width: 300)}}',
        variables: {
            userId: id,
        },
    };

    const response = await makeGraphqlRequest(data);
    const profilePictureUrl = response?.data?.user?.profileImageURL;

    if (!profilePictureUrl) {
        const errMsg = `No user profile picture found for streamer id '${id}'.`;
        log.exception(errMsg);
        throw new Error(errMsg);
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

    const response = await makeGraphqlRequest(data);
    const context: ChannelContext = response?.data?.contextUser;

    if (!context) {
        const errMsg = `No channel context info found for login '${login}'`;
        log.exception(errMsg);
        throw new Error(errMsg);
    }

    return context;
}
