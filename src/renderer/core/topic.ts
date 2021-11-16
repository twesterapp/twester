import { Core } from './core';
import { StreamerLogin } from './streamer';
import { getChannelId } from './data';

export class Topic {
    private topic: string;

    private login: StreamerLogin | null;

    private core: Core;

    constructor(core: Core, topic: string, login: StreamerLogin | null = null) {
        this.core = core;
        this.topic = topic;
        this.login = login;
    }

    isUserTopic(): boolean {
        return this.login === null;
    }

    async value(): Promise<string> {
        if (this.isUserTopic()) {
            return `${this.topic}.${this.core.auth.store.getState().user.id}`;
        }

        return `${this.topic}.${await getChannelId(this.login!)}`;
    }
}
