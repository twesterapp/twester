import { Auth } from './auth';
import { StreamerManager } from './streamer-manager';

/**
 * `Core` is the entry point to everything that `Twester` is and can do.
 *
 * You should use `core` (singleton) to interact with `Twester` instead
 * of directly interacting with other modules like `pubsub`, `watcher` and etc.
 */
export class Core {
    public auth: Auth;

    public streamers: StreamerManager;

    constructor() {
        this.auth = new Auth();
        this.streamers = new StreamerManager(this);
    }
}

export const core = new Core();
