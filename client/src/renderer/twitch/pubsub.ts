/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-classes-per-file */
import { getToken, getUserId, sleep } from 'renderer/utils';
import {
  channelIdExistsInCache,
  claimChannelPointsBonus,
  getChannelId,
  getStreamerLoginByChannelIdFromCache,
} from './graphql';

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

// const ws = new WebSocket('wss://pubsub-edge.twitch.tv/v1');

// function heartbeat() {
//   console.info('SENDING: PING message');
//   const message = {
//     type: 'PING',
//   };

//   ws.send(JSON.stringify(message));
// }

// const heartbeatInterval = 4000 * 60;
// const reconnectInterval = 1000 * 30;
// let heartbeatHandle: NodeJS.Timeout;
// let listenHandle: NodeJS.Timeout;

// export function connect() {
//   ws.onopen = () => {
//     console.info('INFO: Socket opened');
//     heartbeat();
//     heartbeatHandle = setInterval(heartbeat, heartbeatInterval);
//     listen();
//   };

//   ws.onerror = (error) => {
//     console.info(`ERR:  ${JSON.stringify(error)}\n`);
//   };

//   ws.onmessage = (event) => {
//     const message = JSON.parse(event.data);
//     console.info(message);

//     if (message?.data?.message) {
//       console.info(JSON.parse(message.data.message));
//     }

//     if (message.type === 'RECONNECT') {
//       console.info('INFO: Reconnecting...\n');
//       setTimeout(connect, reconnectInterval);
//     }
//   };

//   ws.onclose = () => {
//     console.info('INFO: Socket Closed\n');
//     clearInterval(heartbeatHandle);
//     clearInterval(listenHandle);
//     console.info('INFO: Reconnecting...');
//     setTimeout(connect, reconnectInterval);
//   };
// }

// function listen() {
//   const message = {
//     type: 'LISTEN',
//     nonce: nonce(15),
//     data: {
//       topics: ['whispers.670111413'],
//       auth_token: getToken(),
//     },
//   };

//   console.info('LISTENING for whispers');
//   ws.send(JSON.stringify(message));
// }

function createNonce(length: number) {
  let nonce = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i += 1) {
    nonce += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return nonce;
}

export function listenForChannelPoints() {
  const topics = getNeededTopics();
  const wsPool = new WebSocketsPool();

  for (let i = 0; i < topics.length; i += 1) {
    const topic = topics[i];
    wsPool.submit(topic);
  }
}

function getNeededTopics(): PubSubTopic[] {
  const topics = [
    new PubSubTopic('community-points-user-v1'),
    new PubSubTopic('whispers'),
  ];

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
      return `${this.topic}.${getUserId()}`;
    }

    return `${this.topic}.${await getChannelId(this.channelLogin!)}`;
  }
}

function getReasonName(code: string) {
  return code.replace('_', ' ').replace('CLAIM', 'bonus claimed').toLowerCase();
}

class WebSocketsPool {
  private webSocket: WebSocket | null;

  private topics: PubSubTopic[];

  private pendingTopics: PubSubTopic[];

  private isOpened: boolean;

  private isClosed: boolean;

  private pingHandle!: NodeJS.Timeout;

  private pingHandleInterval = 60 * 1000 * 4;

  private _lastMessageTime = 0;

  private _lastMessageType = '';

  constructor() {
    this.webSocket = null;
    this.isOpened = false;
    this.isClosed = false;
    this.topics = [];
    this.pendingTopics = [];
  }

  submit(topic: PubSubTopic) {
    if (this.webSocket === null || this.topics.length >= 50) {
      this.createNewWebSocket();
    }

    this.topics.push(topic);

    if (!this.isOpened) {
      this.pendingTopics.push(topic);
    } else if (this.webSocket) {
      this.listenForTopic(this.webSocket, topic);
    }
  }

  private createNewWebSocket() {
    const webSocket = new WebSocket('wss://pubsub-edge.twitch.tv/v1');
    this.webSocket = webSocket;

    webSocket.onmessage = this.onMessage;
    webSocket.onopen = () => this.onOpen(webSocket);
    webSocket.onclose = this.handleWebSocketReconnection;
  }

  private onMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);
    console.info('[PubSub]: Received message', data);

    if (data.type === 'MESSAGE') {
      const [topic, _topicUser] = data.data.topic.split('.');
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
            const newBalance = messageData.balance.balance;
            const streamerLogin =
              getStreamerLoginByChannelIdFromCache(channelId);
            const reasonName = getReasonName(
              messageData.point_gain.reason_code
            );
            console.info(
              `${newBalance} channel points for ${streamerLogin}! Reason: ${reasonName}.`
            );
          }
        } else if (messageType === 'claim-available') {
          const channelId = messageData.claim.channelId;

          if (channelIdExistsInCache(channelId)) {
            const claimId = messageData.claim.id;
            const streamerLogin =
              getStreamerLoginByChannelIdFromCache(channelId);
            claimChannelPointsBonus(streamerLogin, claimId);
          }
        }
      }
    } else if (data.type === 'RESPONSE' && data.error.length > 0) {
      console.error(`Error while trying to listen for a topic: ${event}`);
    } else if (data.type === 'RECONNECT') {
      this.handleWebSocketReconnection();
    }
  }

  private onOpen(ws: WebSocket) {
    console.info('[PubSub]: WebSocket Open');
    this.isOpened = true;
    this.ping(ws);

    for (let i = 0; i < this.pendingTopics.length; i += 1) {
      this.listenForTopic(ws, this.pendingTopics[i]);
    }

    this.pingHandle = setInterval(() => this.ping(ws), this.pingHandleInterval);
  }

  ping(ws: WebSocket) {
    this.send(ws, {
      type: 'PING',
    });
  }

  private send(ws: WebSocket, message: Record<string, unknown>) {
    console.info('[PubSub]: Sending message \n', message);
    ws.send(JSON.stringify(message));
  }

  private async listenForTopic(ws: WebSocket, topic: PubSubTopic) {
    const data = {
      topics: [`${await topic.value()}`],
      auth_token: '',
    };

    if (topic.isUserTopic()) {
      data.auth_token = getToken()!;
    }

    const nonce = createNonce(15);
    this.send(ws, { type: 'LISTEN', nonce, data });
  }

  private async handleWebSocketReconnection() {
    this.isClosed = true;
    console.info(
      '[PubSub]: Reconnecting to Twitch PubSub server in 30 seconds'
    );

    await sleep(30);

    this.webSocket = null;
    clearInterval(this.pingHandle);

    if (this.topics) {
      for (let i = 0; i < this.topics.length; i += 1) {
        this.submit(this.topics[i]);
      }
    }
  }
}
