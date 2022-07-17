import { Storage } from 'renderer/utils/storage';

import { logging } from './logging';

/**
 * Twitch's IRC chat.
 */

const IRC_URL = 'irc-ws.chat.twitch.tv';
const IRC_PORT = '443';
const PING_INTERVAL = 60 * 1000;

const log = logging.getLogger('IRC');

export class IRC {
    private channel: string;

    private ws: WebSocket;

    private pingHandle: NodeJS.Timeout | null = null;

    constructor(channel: string) {
        this.channel = channel;

        const url = `wss://${IRC_URL}:${IRC_PORT}`;

        this.ws = new WebSocket(url);
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
    }

    private onOpen() {
        log.debug(`Connected to Twitch IRC for: ${this.channel}`);
        const password = `oauth:${Storage.get('access-token')}`;

        // Emitting "logon" event
        log.debug('Sending authentication to server..');

        let caps = 'twitch.tv/tags twitch.tv/commands';
        caps += ' twitch.tv/membership';
        this.ws.send(`CAP REQ :${caps}`);

        this.ws.send(`PASS ${password}`);

        this.ws.send(`NICK ${this.channel}`);
    }

    private onMessage(event: MessageEvent) {
        const messages: string[] = event.data.trim().split('\r\n');

        messages.forEach((message) => {
            const msg = parseMessage(message);

            if (msg) {
                this.handleMessage(msg);
            }
        });
    }

    private handleMessage(message: Message) {
        if (!message) {
            return;
        }

        log.debug('IRC Message:', { message });
        // const msg = message.params[1] ?? null;
        // const msgid = message.tags['msg-id'] ?? null;

        // Messages with no prefix
        if (message.prefix === null) {
            switch (message.command) {
                // Received PING from server
                case 'PING':
                    log.debug('Recieved PING');
                    if (this.isConnected()) {
                        log.debug('Sending PONG');
                        this.ws.send('PONG');
                    }
                    break;

                // Received PONG from server, return current latency
                case 'PONG': {
                    log.debug('Recieved PONG');
                    break;
                }

                default:
                    log.warning(
                        'Could not parse message with no prefix. Message:',
                        message
                    );
                    break;
            }
        }

        // Messages with "tmi.twitch.tv" as a prefix
        else if (message.prefix === 'tmi.twitch.tv') {
            switch (message.command) {
                case '002':
                case '003':
                case '004':
                case '372':
                case '375':
                case 'CAP':
                    break;

                // Retrieve username from server.
                case '001': {
                    const username = message.params;
                    log.debug('Username returned from server:', username);
                    break;
                }

                // Connected to server.
                case '376': {
                    log.debug('Connected to server.');

                    // Set an internal ping timeout check interval.
                    this.pingHandle = setInterval(() => {
                        // Make sure the connection is opened before sending the message.
                        if (this.isConnected()) {
                            log.debug('Sending PING');
                            this.ws.send('PING');
                        }
                    }, PING_INTERVAL);

                    if (this.isConnected()) {
                        const channel = parseChannel(this.channel);
                        this.join(channel);
                    }
                    break;
                }

                default:
                    break;
            }
        } else {
            switch (message.command) {
                case '353':
                    log.debug(
                        'names',
                        message.params[2],
                        message.params[3].split(' ')
                    );
                    break;

                case '366':
                    break;

                // Someone has joined the channel.
                case 'JOIN': {
                    const [nick] = message.prefix.split('!');
                    // You have joined a channel.
                    const matchesUsername = nick === 'ceoshikhar';
                    const channel = parseChannel(message.params[0] ?? null);
                    if (matchesUsername) {
                        log.debug('Joined', { channel, nick, matchesUsername });
                        this.sendMessage(parseChannel(this.channel), 'hi!');
                    }
                    break;
                }

                default:
                    break;
            }
        }
    }

    private join(channel: string): void {
        log.debug('Trying to join channel:', channel);
        this.ws.send(`JOIN ${channel}`);
    }

    private sendMessage(channel: string, message: string): void {
        log.debug(`Sending message: '${message}' to channel: ${channel}`);
        // PRIVMSG #<channel name> :This is a sample message
        this.ws.send(`PRIVMSG ${channel} :${message}`);
    }

    // Determine if the client has a WebSocket and it's open.
    private isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === 1;
    }

    private clearPingHandle() {
        if (this.pingHandle) {
            clearInterval(this.pingHandle);
        }
    }
}

interface Message {
    raw: string;
    tags: Record<string, any>;
    prefix: string | null;
    command: string | null;
    params: string[];
}

function parseMessage(raw: string): Message | null {
    const message: Message = {
        raw,
        tags: {},
        prefix: null,
        command: null,
        params: [],
    };

    // Position and nextspace are used by the parser as a reference
    let position = 0;
    let nextspace = 0;

    // The first thing we check for is IRCv3.2 message tags.
    // http://ircv3.atheme.org/specification/message-tags-3.2
    if (raw.charCodeAt(0) === 64) {
        nextspace = raw.indexOf(' ');

        // Malformed IRC message
        if (nextspace === -1) {
            return null;
        }

        // Tags are split by a semi colon
        const rawTags = raw.slice(1, nextspace).split(';');

        for (let i = 0; i < rawTags.length; i += 1) {
            // Tags delimited by an equals sign are key=value tags.
            // If there's no equals, we assign the tag a value of true.
            const tag = rawTags[i];
            const pair = tag.split('=');
            message.tags[pair[0]] = tag.slice(tag.indexOf('=') + 1) || true;
        }

        position = nextspace + 1;
    }

    // Skip any trailing whitespace
    while (raw.charCodeAt(position) === 32) {
        position += 1;
    }

    // Extract the message's prefix if present. Prefixes are prepended with a colon
    if (raw.charCodeAt(position) === 58) {
        nextspace = raw.indexOf(' ', position);

        // If there's nothing after the prefix, deem this message to be malformed.
        if (nextspace === -1) {
            return null;
        }

        message.prefix = raw.slice(position + 1, nextspace);
        position = nextspace + 1;

        // Skip any trailing whitespace
        while (raw.charCodeAt(position) === 32) {
            position += 1;
        }
    }

    nextspace = raw.indexOf(' ', position);

    // If there's no more whitespace left, extract everything from the
    // current position to the end of the string as the command
    if (nextspace === -1) {
        if (raw.length > position) {
            message.command = raw.slice(position);
            return message;
        }
        return null;
    }

    // Else, the command is the current position up to the next space. After
    // that, we expect some parameters.
    message.command = raw.slice(position, nextspace);

    position = nextspace + 1;

    // Skip any trailing whitespace
    while (raw.charCodeAt(position) === 32) {
        position += 1;
    }

    while (position < raw.length) {
        nextspace = raw.indexOf(' ', position);

        // If the character is a colon, we've got a trailing parameter.
        // At this point, there are no extra params, so we push everything
        // from after the colon to the end of the string, to the params array
        // and break out of the loop.
        if (raw.charCodeAt(position) === 58) {
            message.params.push(raw.slice(position + 1));
            break;
        }

        // If we still have some whitespace.
        if (nextspace !== -1) {
            // Push whatever's between the current position and the next
            // space to the params array.
            message.params.push(raw.slice(position, nextspace));
            position = nextspace + 1;

            // Skip any trailing whitespace and continue looping.
            while (raw.charCodeAt(position) === 32) {
                position += 1;
            }

            continue;
        }

        // If we don't have any more whitespace and the param isn't trailing,
        // push everything remaining to the params array.
        if (nextspace === -1) {
            message.params.push(raw.slice(position));
            break;
        }
    }
    return message;
}

function parseChannel(str: string) {
    const channel = (str || '').toLowerCase();
    // Return a valid channel name.
    return channel[0] === '#' ? channel : `#${channel}`;
}
