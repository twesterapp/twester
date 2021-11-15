import { Auth } from './auth';
import { PubSub } from './pubsub';
import { StreamerManager } from './streamer-manager';
import { Watcher } from './watcher';

/**
 * `Core` is the entry point to everything that `Twester` is and can do.
 *
 * You should use `core` (singleton) to interact with `Twester` instead
 * of directly interacting with other modules like `pubsub`, `watcher` and etc.
 */
export class Core {
    public auth: Auth;

    public pubsub: PubSub;

    public streamers: StreamerManager;

    public watcher: Watcher;

    constructor() {
        this.auth = new Auth();
        this.pubsub = new PubSub(this);
        this.streamers = new StreamerManager(this);
        this.watcher = new Watcher(this);
    }
}

export const core = new Core();
