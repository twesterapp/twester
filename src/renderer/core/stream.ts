import { fetchBroadcastId, fetchMinuteWatchedRequestUrl } from './data';

import { Streamer } from './streamer';
import { core } from './core';
import { logging } from './logging';

const log = logging.getLogger('STREAM');

interface MinuteWatchedRequestInfo {
    url: string;
    payload: { data: string };
}

export class Stream {
    public broadcastId: string;

    public requestInfo: MinuteWatchedRequestInfo;

    constructor(id: string, info: MinuteWatchedRequestInfo) {
        this.broadcastId = id;
        this.requestInfo = info;
    }

    public static async init(streamer: Streamer): Promise<Stream | null> {
        const broadcastId = await fetchBroadcastId(streamer);

        const eventProperties = {
            channel_id: streamer.id,
            broadcast_id: broadcastId,
            player: 'site',
            user_id: Number(core.auth.store.getState().user.id),
        };

        const minuteWatched = {
            event: 'minute-watched',
            properties: eventProperties,
        };

        let afterBase64: string;
        try {
            afterBase64 = btoa(JSON.stringify([minuteWatched]));
        } catch (err) {
            log.error(
                `Failed to perform Base64 encoding for minute watched event request info for login '${streamer.login}'.\n`,
                err
            );
            return null;
        }

        const url = await fetchMinuteWatchedRequestUrl(streamer.login);
        const payload = {
            data: afterBase64,
        };

        const info = {
            url,
            payload,
        };

        return new Stream(broadcastId, info);
    }
}
