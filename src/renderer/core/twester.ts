import { Streamers } from './streamers';

/**
 * This class is the `core` of Twester.
 *
 * This class is the entry point to everything that Twester is and can do.
 *
 * You should use the singleton of this class to interact with Twester instead
 * of directly interacting with other modules like `pubsub`, `watcher` and etc.
 *
 * @class Twester
 */
class Twester {
    public streamers: Streamers;

    constructor() {
        this.streamers = new Streamers();
    }
}

export const twester = new Twester();
