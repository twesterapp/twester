import { getToken } from 'renderer/utils';

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

const ws = new WebSocket('wss://pubsub-edge.twitch.tv/v1');

function heartbeat() {
  console.info('SENDING: PING message');
  const message = {
    type: 'PING',
  };

  ws.send(JSON.stringify(message));
}

const heartbeatInterval = 1000 * 60;
const reconnectInterval = 1000 * 3;
let heartbeatHandle: any;
let listenHandle: any;

export function connect() {
  ws.onopen = () => {
    console.info('INFO: Socket opened');
    heartbeat();
    heartbeatHandle = setInterval(heartbeat, heartbeatInterval);
    listen();
  };

  ws.onerror = (error) => {
    console.info(`ERR:  ${JSON.stringify(error)}\n`);
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.info(message);

    if (message?.data?.message) {
      console.info(JSON.parse(message.data.message));
    }

    if (message.type === 'RECONNECT') {
      console.info('INFO: Reconnecting...\n');
      setTimeout(connect, reconnectInterval);
    }
  };

  ws.onclose = () => {
    console.info('INFO: Socket Closed\n');
    clearInterval(heartbeatHandle);
    clearInterval(listenHandle);
    console.info('INFO: Reconnecting...');
    setTimeout(connect, reconnectInterval);
  };
}

function listen() {
  const message = {
    type: 'LISTEN',
    nonce: nonce(15),
    data: {
      topics: ['whispers.670111413'],
      auth_token: getToken(),
    },
  };

  console.info('LISTENING for whispers');
  ws.send(JSON.stringify(message));
}

function nonce(length: number) {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function streamersToWatch(): string[] {
  return ['summit1g'];
}
