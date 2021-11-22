import { ChannelPoints } from './channel-points';
import { Core } from './core';
import { PubSub } from './pubsub';
import { Storage } from '../utils/storage';
import { Store } from '../utils/store';
import { getMinuteWatchedRequestInfo } from './data';
import { logging } from './logging';
import { nodeClient } from '../api';
import { rightNowInSecs } from '../utils/rightNowInSecs';
import { sleep } from '../utils/sleep';

const NAME = 'WATCHER';

const log = logging.getLogger(NAME);

export enum WatcherStatus {
    // Watcher has not booted even once.
    INIT = 'INIT',
    BOOTING = 'BOOTING',
    RUNNING = 'RUNNING',
    PAUSING = 'PAUSING',
    PAUSED = 'PAUSED',
}

interface State {
    status: WatcherStatus;
    minutesWatched: number;
    pointsEarned: number;
}

type SavedState = Omit<State, 'status'>;

export class Watcher extends Store<State> {
    private core: Core;

    private pubsub: PubSub;

    constructor(core: Core) {
        super(NAME);
        this.core = core;
        this.pubsub = new PubSub(this.core);
        this.initStore(() => this.getInitialState());
    }

    public async play() {
        if (
            !this.core.auth.store.getState().accessToken ||
            !this.core.auth.store.getState().user.id
        ) {
            log.exception('User is unauthorized. Skipping to start Watcher.');
            return;
        }

        log.info('Watcher is booting...');
        this.setWatcherStatus(WatcherStatus.BOOTING);

        log.info(
            `Loading data for ${this.core.streamers.all().length} streamers...`
        );

        await ChannelPoints.loadContext();
        await this.core.streamers.checkOnlineStatusOfAllStreamers();
        this.pubsub.connect();

        this.setWatcherStatus(WatcherStatus.RUNNING);
        log.info('Watcher is running!');

        while (this.isRunning()) {
            const streamersToWatch = this.core.streamers.online().slice(0, 2);
            const numOfStreamersToWatch = streamersToWatch.length;

            if (numOfStreamersToWatch) {
                for (let i = 0; i < numOfStreamersToWatch; i += 1) {
                    const streamer = streamersToWatch[i];
                    const nextIteration =
                        rightNowInSecs() + 60 / numOfStreamersToWatch;

                    // FIXME: If the client's internet DC while the app is running
                    // and the internet comes back after any of these
                    // (streamersToWatch) streamer(s) went offline, the watcher
                    // will still keep watching that streamer because this
                    // `isOnline` check is made with cached value instead of
                    // actual recently fetched data from the Twitch server.
                    if (streamer.isOnline()) {
                        try {
                            const info = getMinuteWatchedRequestInfo(
                                streamer.login
                            );

                            if (info) {
                                if (!streamer.watching) {
                                    this.core.streamers.update(streamer.id, {
                                        watching: true,
                                    });
                                    log.info(
                                        `Started watching ${streamer.displayName}`
                                    );

                                    this.fixWatchingStatus();
                                }

                                await nodeClient.post('/minute-watched-event', {
                                    url: info.url,
                                    payload: info.payload,
                                });

                                if (
                                    this.minutePassedSince(
                                        streamer.lastMinuteWatchedEventTime
                                    ) ||
                                    !streamer.lastMinuteWatchedEventTime
                                ) {
                                    this.core.streamers.update(streamer.id, {
                                        minutesWatched:
                                            (streamer.minutesWatched += 1),
                                        lastMinuteWatchedEventTime:
                                            rightNowInSecs(),
                                    });
                                    this.incrementMinutesWatched();
                                }

                                log.debug(
                                    `Minute watched event sent for ${streamer.displayName}`
                                );
                            }
                        } catch {
                            log.error(
                                `Minute watched event failed for ${streamer.displayName}`
                            );
                        }

                        const sleepDuration = nextIteration - rightNowInSecs();
                        await sleep.forSecs(sleepDuration);
                    }
                }
            } else {
                await sleep.forSecs(60);
            }
        }
    }

    public pause() {
        log.info('Watcher is pausing...');
        this.setWatcherStatus(WatcherStatus.PAUSING);

        sleep.abort();
        this.pubsub.disconnect();
        this.core.streamers.resetOnlineStatusOfAllStreamers();

        this.setWatcherStatus(WatcherStatus.PAUSED);
        log.info(`Watcher is paused!`);
    }

    // This is NOT same as `!canPause()`
    public canPlay(): boolean {
        if (
            this.store.getState().status === WatcherStatus.INIT ||
            this.store.getState().status === WatcherStatus.PAUSED
        ) {
            return true;
        }

        return false;
    }

    // This is NOT same as `!canPlay()`
    public canPause(): boolean {
        if (this.store.getState().status === WatcherStatus.RUNNING) {
            return true;
        }

        return false;
    }

    public addPointsEarned(points: number) {
        this.store.setState({
            pointsEarned: this.store.getState().pointsEarned + points,
        });
        this.syncStorageWithStore();
    }

    // This updates `watching` to `false` for streamers that are no longer being
    // watched as they are not in the top 2 among all the online streamers.
    private fixWatchingStatus(): void {
        // We can only watch the first 2 online streamers. So these are the
        // streamers we should NOT be watching.
        const streamersToNotWatch = this.core.streamers.online().slice(2);

        if (!streamersToNotWatch.length) {
            return;
        }

        for (const streamer of streamersToNotWatch) {
            if (streamer.watching) {
                this.core.streamers.update(streamer.id, {
                    watching: false,
                });
                log.info(`Stopped watching ${streamer.displayName}`);
            }
        }
    }

    // IDK if I should compare with 60. This function exists to stop us from doing
    // things that should have happened only once per minute.
    private minutePassedSince(time: number): boolean {
        return rightNowInSecs() - time > 59;
    }

    private getStorageKey() {
        return `${this.core.auth.store.getState().user.id}.watcher`;
    }

    private getInitialState(): State {
        try {
            const savedState: SavedState = JSON.parse(
                Storage.get(this.getStorageKey()) || ''
            );

            log.debug(`Loaded ${this.storeName} state from storage`);

            return {
                ...savedState,
                status: WatcherStatus.INIT,
            };
        } catch (err) {
            log.error(
                `Failed to load ${this.storeName} state from storage:`,
                err.message
            );
            log.warning(`Setting ${this.storeName} state to default`);

            return {
                status: WatcherStatus.INIT,
                minutesWatched: 0,
                pointsEarned: 0,
            };
        }
    }

    private setWatcherStatus(status: WatcherStatus) {
        this.store.setState({ status });
    }

    private isRunning(): boolean {
        if (this.store.getState().status === WatcherStatus.RUNNING) {
            return true;
        }

        return false;
    }

    private incrementMinutesWatched() {
        this.store.setState({
            minutesWatched: (this.store.getState().minutesWatched += 1),
        });
        this.syncStorageWithStore();
    }

    private syncStorageWithStore() {
        const state: SavedState = {
            minutesWatched: this.store.getState().minutesWatched,
            pointsEarned: this.store.getState().pointsEarned,
        };
        Storage.set(this.getStorageKey(), JSON.stringify(state));
    }
}
