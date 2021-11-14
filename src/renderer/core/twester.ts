import { StreamerManager } from './streamer-manager';

/**
 * This class is the `core` of Twester.
 *
 * This class is the entry point to everything that Twester is and can do.
 *
 * You should use `twester` (singleton) to interact with Twester instead
 * of directly interacting with other modules like `pubsub`, `watcher` and etc.
 *
 * @class Twester
 */
class Twester {
    public streamers: StreamerManager;

    constructor() {
        this.streamers = new StreamerManager();
    }
}

export const twester = new Twester();
