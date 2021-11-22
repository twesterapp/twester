import { Core } from './core';
import { Streamer } from './streamer';

export class Topic {
    private topic: string;

    private streamer: Streamer | null;

    private core: Core;

    constructor(core: Core, topic: string, streamer: Streamer | null = null) {
        this.core = core;
        this.topic = topic;
        this.streamer = streamer;
    }

    isUserTopic(streamer = this.streamer): streamer is null {
        return streamer === null;
    }

    formatted(): string {
        if (this.isUserTopic(this.streamer)) {
            return `${this.topic}.${this.core.auth.store.getState().user.id}`;
        }

        return `${this.topic}.${this.streamer.id})}`;
    }
}
