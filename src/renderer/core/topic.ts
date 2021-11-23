import { Streamer } from './streamer';
import { auth } from './auth';

export class Topic {
    private topic: string;

    private streamer: Streamer | null;

    constructor(topic: string, streamer: Streamer | null = null) {
        this.topic = topic;
        this.streamer = streamer;
    }

    isUserTopic(streamer = this.streamer): streamer is null {
        return streamer === null;
    }

    formatted(): string {
        if (this.isUserTopic(this.streamer)) {
            return `${this.topic}.${auth.store.getState().user.id}`;
        }

        return `${this.topic}.${this.streamer.id})}`;
    }
}
