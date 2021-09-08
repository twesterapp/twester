import { sleep } from 'renderer/utils';
import { authStore } from 'renderer/stores/useAuthStore';
import { getAllStreamers, getStreamer } from 'renderer/stores/useStreamerStore';
import { Logger } from 'renderer/stores/useLoggerStore';
import {
  channelIdExistsInCache,
  checkOnline,
  getChannelId,
  getStreamerLoginByChannelIdFromCache,
  setOffline,
} from './data';
import { claimChannelPointsBonus } from './bonus';

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

const logger = new Logger({ prefix: 'PUBSUB' });
let wsPool: WebSocketsPool | null = null;

export function listenForChannelPoints() {
  const topics = getNeededTopics();
  wsPool = new WebSocketsPool();

  for (let i = 0; i < topics.length; i += 1) {
    const topic = topics[i];
    wsPool.submit(topic);
  }
}

export function stopListeningForChannelPoints() {
  if (wsPool) {
    wsPool.stop();
    wsPool = null;
  }
}

function getNeededTopics(): PubSubTopic[] {
  const topics = [new PubSubTopic('community-points-user-v1')];

  for (const streamer of getAllStreamers()) {
    topics.push(new PubSubTopic('video-playback-by-id', streamer.login));
  }

  return topics;
}

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
      return `${this.topic}.${authStore.getState().user.id}`;
    }

    return `${this.topic}.${await getChannelId(this.channelLogin!)}`;
  }
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

class WebSocketsPool {
  private webSocket: WebSocket | null = null;

  private topics: PubSubTopic[] = [];

  private pendingTopics: PubSubTopic[] = [];

  private isOpened = false;

  private isClosed = false;

  private closedOnPurpose = false;

  private pingHandle!: NodeJS.Timeout;

  private pingHandleInterval = 60 * 1000 * 4;

  private _lastMessageTime = 0;

  private _lastMessageType = '';

  constructor() {
    this.webSocket = null;
  }

  submit(topic: PubSubTopic) {
    if (this.webSocket === null || this.topics.length >= 50) {
      this.createNewWebSocket();
    }

    this.topics.push(topic);

    if (!this.isOpened) {
      this.pendingTopics.push(topic);
    } else if (this.webSocket) {
      this.listenForTopic(topic);
    }
  }

  stop() {
    if (this.webSocket && !this.isClosed) {
      logger.debug('Closing connection');
      this.closedOnPurpose = true;
      this.webSocket.close();
    }
  }

  private createNewWebSocket() {
    const webSocket = new WebSocket('wss://pubsub-edge.twitch.tv/v1');
    this.webSocket = webSocket;
    this.isClosed = false;
    this.isOpened = false;
    this.closedOnPurpose = false;
    this.topics = [];
    this.pendingTopics = [];

    webSocket.onmessage = this.onMessage;
    webSocket.onopen = () => this.onOpen();
    webSocket.onclose = () => this.handleWebSocketReconnection();
  }

  private onOpen() {
    logger.debug('Connected');
    this.isOpened = true;
    this.ping();

    for (let i = 0; i < this.pendingTopics.length; i += 1) {
      this.listenForTopic(this.pendingTopics[i]);
    }

    this.pingHandle = setInterval(() => this.ping(), this.pingHandleInterval);
  }

  ping() {
    logger.debug('Sending PING');
    this.send({
      type: 'PING',
    });
  }

  private send(message: Record<string, unknown>) {
    this.webSocket?.send(JSON.stringify(message));
  }

  private onMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);

    if (data.type === 'PONG') {
      logger.debug('Received PONG');
    } else if (data.type === 'MESSAGE') {
      const [topic, topicUser] = data.data.topic.split('.');
      const message = JSON.parse(data.data.message);
      const messageType = message.type;
      let messageData = null;

      if (message.data) {
        messageData = message.data;
      }

      // If we have more than one PubSub connection, messages may be duplicated
      if (
        Date.now() - this._lastMessageTime < 0.1 &&
        this._lastMessageType === messageType
      ) {
        this._lastMessageTime = Date.now();
        return;
      }

      this._lastMessageTime = Date.now();
      this._lastMessageType = messageType;

      if (topic === 'community-points-user-v1') {
        if (messageType === 'points-earned') {
          const channelId = messageData.channel_id;

          if (channelIdExistsInCache(channelId)) {
            const pointsEarned = messageData.point_gain.total_points;
            const newBalance = messageData.balance.balance;
            const streamer = getStreamer(channelId);
            const reason = messageData.point_gain.reason_code;

            if (!streamer) {
              console.error('Not watching any streamer with id: ', channelId);
              return;
            }

            logger.info(
              `+${pointsEarned} -> ${streamer.displayName} (${newBalance} points) - Reason: ${reason}.`
            );
          }
        } else if (messageType === 'claim-available') {
          const channelId = messageData.claim.channel_id;

          if (channelIdExistsInCache(channelId)) {
            const claimId = messageData.claim.id;
            const streamerLogin =
              getStreamerLoginByChannelIdFromCache(channelId);
            claimChannelPointsBonus(streamerLogin, claimId);
          }
        }
      } else if (topic === 'video-playback-by-id') {
        const streamerLogin = getStreamerLoginByChannelIdFromCache(topicUser);

        // There is stream-up message type, but it's sent earlier than the
        // API updates. Therefore making it useless to check for it here, as
        // `checkOnline` will return `isOffline` status.
        if (messageType === 'stream-down') {
          setOffline(streamerLogin);
        } else if (messageType === 'viewcount') {
          checkOnline(streamerLogin);
        }
      }
    } else if (data.type === 'RESPONSE' && data.error.length > 0) {
      console.error(
        `Error while trying to listen for a topic. Error ${data.error}`
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
      data.auth_token = authStore.getState().accessToken;
    }

    const nonce = createNonce(15);
    this.send({ type: 'LISTEN', nonce, data });
  }

  private async handleWebSocketReconnection() {
    clearInterval(this.pingHandle);

    if (this.closedOnPurpose) {
      return;
    }

    this.isClosed = true;
    logger.debug('Reconnecting to Twitch PubSub server in 30 seconds');

    await sleep(30);

    this.webSocket = null;

    if (this.topics) {
      for (let i = 0; i < this.topics.length; i += 1) {
        this.submit(this.topics[i]);
      }
    }
  }
}