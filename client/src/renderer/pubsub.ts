import { getToken } from './utils';

/* eslint-disable @typescript-eslint/no-unused-vars */
const ws = new WebSocket('wss://pubsub-edge.twitch.tv/v1');

function heartbeat() {
  console.log('SENDING: PING message');
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
    console.log('INFO: Socket opened');
    heartbeat();
    heartbeatHandle = setInterval(heartbeat, heartbeatInterval);
  };

  ws.onerror = (error) => {
    console.log(`ERR:  ${JSON.stringify(error)}\n`);
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log(message);

    if (message?.data?.message) {
      console.log(JSON.parse(message.data.message));
    }

    if (message.type === 'RECONNECT') {
      console.log('INFO: Reconnecting...\n');
      setTimeout(connect, reconnectInterval);
    }
  };

  ws.onclose = () => {
    console.log('INFO: Socket Closed\n');
    clearInterval(heartbeatHandle);
    clearInterval(listenHandle);
    console.log('INFO: Reconnecting...');
    setTimeout(connect, reconnectInterval);
  };

  startListening();
}

function startListening() {
  listenHandle = setInterval(listen, 5000);
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

  console.log('LISTENING for whispers');
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
