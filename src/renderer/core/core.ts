import { Auth } from './auth';
import { StreamerManager } from './streamer-manager';
import { Watcher } from './watcher';

/**
 * `Core` is the entry point to everything that `Twester` is and can do.
 *
 * You should use `core` (singleton) to interact with `Twester` instead
 * of directly interacting with other modules like `pubsub`, `streamer` and etc.
 */
export class Core {
    public auth: Auth;

    public streamers: StreamerManager;

    public watcher: Watcher;

    constructor() {
        this.auth = new Auth();
        this.streamers = new StreamerManager(this);
        this.watcher = new Watcher(this);
    }
}

export const core = new Core();
