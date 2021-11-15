import { OnlineStatus, Streamer, StreamerLogin } from './streamer';
import {
    channelIdExistsInCache,
    checkOnline,
    getChannelId,
} from 'renderer/core/data';

import { ChannelPoints } from './channel-points';
import { Core } from './core';
import { core } from 'renderer/core';
import { logging } from 'renderer/core/logging';
import { makeGraphqlRequest } from 'renderer/api';

const NAME = 'PUBSUB';

const log = logging.getLogger(NAME);

/**
 * Some important notes about the Twitch PubSub
 *
 * 1. Clients must LISTEN on at least one topic within 15 seconds of
 *    establishing the connection, or they will be disconnected by the server.
 *
 * 2. To keep the server from closing the connection, clients must send a PING
 *    command at least once every 5 minutes. If a client does not receive a PONG
 *    message within 10 seconds of issuing a PING command, it should reconnect
 *    to the server.
 *
 * 3. Clients may receive a RECONNECT message at any time. This indicates that
 *    the server is about to restart (typically for maintenance) and will
 *    disconnect the client within 30 seconds. During this time, we recommend
 *    that clients reconnect to the server; otherwise, the client will be
 *    forcibly disconnected.
 *
 * 4. You can listen to max 50 topics at a time. So once you reach 50, you
 *    should reconnect to PubSub and start listening to the topics. You could
 *    also `UNLISTEN` to topics no longer required but it's easier to just
 *    reconnect and start listening to topics. These topics will keep on
 *    incrementing as the streamer goes offline and we start "watching" and
 *    listening to topics for the new streamer.
 */

class PubSubTopic {
    private topic: string;

    private channelLogin: string | null;

    constructor(topic: string, channelLogin: string | null = null) {
        this.topic = topic;
        this.channelLogin = channelLogin;
    }

    isUserTopic(): boolean {
        return this.channelLogin === null;
    }

    async value(): Promise<string> {
        if (this.isUserTopic()) {
            return `${this.topic}.${core.auth.store.getState().user.id}`;
        }

        return `${this.topic}.${await getChannelId(this.channelLogin!)}`;
    }
}

class Raid {
    public id: string;

    public loginToRaid: StreamerLogin;

    constructor(raidId: string, targetLogin: StreamerLogin) {
        this.id = raidId;
        this.loginToRaid = targetLogin;
    }
}

const raidCache: Map<StreamerLogin, Raid> = new Map();

function updateRaid(streamer: Streamer, raid: Raid) {
    if (raidCache.get(streamer.login)) {
        return;
    }

    raidCache.set(streamer.login, raid);
    const data = {
        operationName: 'JoinRaid',
        variables: { input: { raidID: raid.id } },
        extensions: {
            persistedQuery: {
                version: 1,
                sha256Hash:
                    'c6a332a86d1087fbbb1a8623aa01bd1313d2386e7c63be60fdb2d1901f01a4ae',
            },
        },
    };
    makeGraphqlRequest(data);
    log.info(
        `Joining raid from ${streamer.displayName} to ${raid.loginToRaid}!`
    );
}

function createNonce(length: number) {
    let nonce = '';
    const possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i += 1) {
        nonce += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return nonce;
}

export class PubSub {
    private ws: WebSocket | null = null;

    private topics: PubSubTopic[] = [];

    private pendingTopics: PubSubTopic[] = [];

    private isOpened = false;

    private isClosed = false;

    private shouldTryReconnecting = false;

    private closedOnPurpose = false;

    private pingHandle!: NodeJS.Timeout;

    private pingInterval = 4.5 * 60 * 1000;

    private reconnectionHandle!: NodeJS.Timeout;

    private reconnectionInterval = 30 * 1000;

    private lastMessageTime = 0;

    private lastMessageType = '';

    private core: Core;

    constructor(core: Core) {
        this.core = core;
    }

    public connect(): void {
        log.debug('Starting to listen for channel points.');

        for (const topic of this.getTopics()) {
            this.submit(topic);
        }
    }

    public disconnect(): void {
        log.debug('Stopping to listen for channel points.');

        if (!this.ws) {
            log.exception(
                `WebSocket instance 'ws' is null. Cannot close PubSub connection and stop listening for channel points.`
            );
        }

        if (this.ws) {
            this.stop();
            this.ws = null;
        }
    }

    private getTopics(): PubSubTopic[] {
        const topics = [new PubSubTopic('community-points-user-v1')];

        for (const streamer of core.streamers.all()) {
            topics.push(
                new PubSubTopic('video-playback-by-id', streamer.login)
            );
            topics.push(new PubSubTopic('raid', streamer.login));
        }

        return topics;
    }

    private submit(topic: PubSubTopic) {
        if (!this.ws || this.topics.length >= 50) {
            this.createNewWebSocket();
        }

        this.topics.push(topic);

        if (!this.isOpened) {
            this.pendingTopics.push(topic);
        } else if (this.ws) {
            this.listenForTopic(topic);
        }
    }

    private stop() {
        this.closedOnPurpose = true;

        if (!this.isOpened) {
            log.warning(
                'Skipped closing PubSub as no connection was established yet'
            );
            return;
        }

        if (this.isClosed) {
            log.warning('Skipped closing PubSub as it is already closed');
            return;
        }

        if (this.ws) {
            log.debug('PubSub is closing');

            this.clearPingHandle();
            this.ws.close();
            this.isClosed = true;

            log.debug('PubSub is closed');
        }
    }

    private createNewWebSocket() {
        log.debug('PubSub is connecting');

        this.ws = new WebSocket('wss://pubsub-edge.twitch.tv/v1');
        this.isOpened = false;
        this.isClosed = false;
        this.closedOnPurpose = false;
        this.topics = [];
        this.pendingTopics = [];

        this.ws.onmessage = (event) => this.onMessage(event);
        this.ws.onopen = () => this.onOpen();
        this.ws.onclose = () => this.handleWebSocketReconnection();
    }

    private onOpen() {
        log.debug('PubSub is open');

        this.isOpened = true;
        clearInterval(this.reconnectionHandle);
        if (this.shouldTryReconnecting) {
            log.info('PubSub reconnected');
            this.shouldTryReconnecting = false;
        }

        if (this.closedOnPurpose) {
            log.warning('PubSub was opened after it was closed on pupose');
            this.stop();
            return;
        }

        this.ping();

        if (this.pendingTopics) {
            for (let i = 0; i < this.pendingTopics.length; i += 1) {
                this.listenForTopic(this.pendingTopics[i]);
            }
        }

        this.pingHandle = setInterval(() => this.ping(), this.pingInterval);
    }

    private ping() {
        log.debug('PubSub sending PING');

        this.send({
            type: 'PING',
        });
    }

    private send(message: Record<string, unknown>) {
        // The internal webSocket's ready state is checked before sending
        // a message because after a network error/disconnect, we try to
        // reconnect and sometimes the `isOpened` is true but the webSocket's
        // state is still on `CONNECTING`.
        // This protects the app from crashing in those situations.
        if (
            this.isOpened &&
            !this.isClosed &&
            this.ws?.readyState === WebSocket.OPEN
        ) {
            this.ws?.send(JSON.stringify(message));
        }
    }

    private onMessage(event: MessageEvent) {
        const data = JSON.parse(event.data);

        if (data.type === 'PONG') {
            log.debug('PubSub received PONG');
        } else if (data.type === 'MESSAGE') {
            const [topic, streamerId] = data.data.topic.split('.');
            const message = JSON.parse(data.data.message);
            const messageType = message.type;
            let messageData = null;

            if (message.data) {
                messageData = message.data;
            }

            // If we have more than one connection, messages may be duplicated
            if (
                Date.now() - this.lastMessageTime < 0.1 &&
                this.lastMessageType === messageType
            ) {
                this.lastMessageTime = Date.now();
                return;
            }

            this.lastMessageTime = Date.now();
            this.lastMessageType = messageType;

            if (topic === 'community-points-user-v1') {
                if (messageType === 'points-earned') {
                    const channelId = messageData.channel_id;

                    if (channelIdExistsInCache(channelId)) {
                        const pointsEarned =
                            messageData.point_gain.total_points;
                        const newBalance = messageData.balance.balance;
                        const streamer = this.core.streamers.getById(channelId);
                        const reason = messageData.point_gain.reason_code;

                        if (!streamer) {
                            log.error(
                                `Ignoring ${pointsEarned} points earned for #${channelId}" because this streamer is not added for being watched`
                            );
                            return;
                        }

                        if (!streamer.watching) {
                            log.warning(
                                `Ignoring ${pointsEarned} points earned for ${streamer.displayName} because this streamer is not being watched`
                            );
                            return;
                        }

                        if (reason === 'PREDICTION') {
                            log.warning(
                                `Ignoring ${pointsEarned} points earned for ${streamer.displayName} because the points were earned in a prediction and it was done on Twitch`
                            );
                            return;
                        }

                        log.info(
                            `+${pointsEarned} points for ${streamer.displayName} (${newBalance}) - Reason: ${reason}`
                        );

                        this.core.streamers.update(streamer.id, {
                            currentBalance: newBalance,
                            pointsEarned: streamer.pointsEarned + pointsEarned,
                        });
                        this.core.watcher.addPointsEarned(pointsEarned);
                    }
                } else if (messageType === 'claim-available') {
                    const channelId = messageData.claim.channel_id;

                    if (channelIdExistsInCache(channelId)) {
                        const claimId = messageData.claim.id;
                        const streamer = this.core.streamers.getById(channelId);

                        if (!streamer) {
                            log.error(
                                `Cannot claim bonus for #${channelId} because this streamer is not added for being watched`
                            );
                            return;
                        }

                        if (!streamer.watching) {
                            log.warning(
                                `Not claiming bonus for ${streamer.displayName} because this streamer is not being watched`
                            );
                            return;
                        }

                        ChannelPoints.claimBonus(streamer.login, claimId);
                    }
                }
            } else if (topic === 'video-playback-by-id') {
                const streamer = this.core.streamers.getById(streamerId);

                if (!streamer) {
                    log.error(`No streamer found with id: ${streamerId}`);
                    return;
                }

                // There is stream-up message type, but it's sent earlier than
                // the API updates. Therefore making it useless to check for it
                //  here, as `checkOnline` will return `isOffline` status.
                if (messageType === 'stream-down') {
                    this.core.streamers.setStreamerOnlineStatus(
                        streamer.login,
                        OnlineStatus.OFFLINE
                    );
                } else if (messageType === 'viewcount') {
                    checkOnline(streamer.login);
                }
            } else if (topic === 'raid') {
                const streamer = this.core.streamers.getById(streamerId);

                if (!streamer) {
                    log.error(`No streamer found with id: ${streamerId}`);
                    return;
                }

                if (messageType === 'raid_update_v2') {
                    const raidInfo = message.raid;
                    const raid = new Raid(raidInfo.id, raidInfo.target_login);
                    updateRaid(streamer, raid);
                }
            }
        } else if (data.type === 'RESPONSE' && data.error.length > 0) {
            log.error(
                `Error while trying to listen for a topic:\n${data.error}`
            );
        } else if (data.type === 'RECONNECT') {
            this.handleWebSocketReconnection();
        }
    }

    private async listenForTopic(topic: PubSubTopic) {
        const data = {
            topics: [`${await topic.value()}`],
            auth_token: '',
        };

        if (topic.isUserTopic()) {
            data.auth_token = this.core.auth.store.getState().accessToken;
        }

        const nonce = createNonce(15);
        this.send({ type: 'LISTEN', nonce, data });
    }

    private clearPingHandle() {
        if (this.pingHandle) {
            clearInterval(this.pingHandle);
        }
    }

    private async handleWebSocketReconnection() {
        if (this.closedOnPurpose) {
            return;
        }

        this.clearPingHandle();
        this.shouldTryReconnecting = true;

        log.info('PubSub disconnected! Trying to reconnect...');
        this.reconnectionHandle = setInterval(
            () => this.tryReconnecting(),
            this.reconnectionInterval
        );
    }

    private tryReconnecting() {
        if (this.shouldTryReconnecting) {
            this.ws = null;

            if (this.topics) {
                for (let i = 0; i < this.topics.length; i += 1) {
                    this.submit(this.topics[i]);
                }
            }
        }
    }
}
