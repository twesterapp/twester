import { nodeClient } from 'renderer/api';
import { authStore } from 'renderer/stores/useAuthStore';
import {
    getAllStreamers,
    getOnlineStreamers,
    isOnline,
    resetOnlineStatusOfStreamers,
    updateStreamer,
} from 'renderer/stores/useStreamerStore';
import { abortAllSleepingTasks, sleep } from 'renderer/utils';
import { rightNowInSecs } from 'renderer/utils/rightNowInSecs';
import { loadChannelPointsContext } from 'renderer/core/bonus';
import {
    getMinuteWatchedRequestInfo,
    updateStreamersToWatch,
} from 'renderer/core/data';
// eslint-disable-next-line import/no-cycle
import {
    startListeningForChannelPoints,
    stopListeningForChannelPoints,
} from 'renderer/core/pubsub';
import { logging } from 'renderer/core/logging';
import { Store } from 'renderer/core/store';

const NAME = 'WATCHER';

const log = logging.getLogger(NAME);

export enum WatcherStatus {
    // Watcher has not booted even once.
    INIT = 'INIT',
    BOOTING = 'BOOTING',
    RUNNING = 'RUNNING',
    STOPPING = 'STOPPING',
    STOPPED = 'STOPPED',
}

interface State {
    status: WatcherStatus;
    minutesWatched: number;
    pointsEarned: number;
}

type SavedState = Omit<State, 'status'>;

class Watcher extends Store<State> {
    private firstBoot = true;

    constructor() {
        super(NAME);
        this.initStore(() => this.getInitialState());
    }

    public async play() {
        if (
            !authStore.getState().accessToken ||
            !authStore.getState().user.id
        ) {
            log.exception('User is unauthorized. Skipping to start Watcher.');
            return;
        }

        log.debug('Watcher is booting');
        this.setWatcherStatus(WatcherStatus.BOOTING);

        if (this.firstBoot) {
            log.info(`Watcher is starting`);
            this.firstBoot = false;
        } else {
            log.info(`Watcher is resuming`);
        }

        log.info(`Loading data for ${getAllStreamers().length} streamers...`);
        await loadChannelPointsContext();
        await updateStreamersToWatch();
        startListeningForChannelPoints();

        this.setWatcherStatus(WatcherStatus.RUNNING);
        log.debug('Watcher is running');

        while (this.isWatcherRunning()) {
            const streamersToWatch = getOnlineStreamers().slice(0, 2);
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
                    if (isOnline(streamer.login)) {
                        try {
                            const info = getMinuteWatchedRequestInfo(
                                streamer.login
                            );

                            if (info) {
                                if (!streamer.watching) {
                                    updateStreamer(streamer.id, {
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
                                    updateStreamer(streamer.id, {
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

                        const duration = nextIteration - rightNowInSecs();
                        await sleep(duration);
                    }
                }
            } else {
                await sleep(60);
            }
        }
    }

    public pause() {
        log.debug('Watcher is stopping');
        this.setWatcherStatus(WatcherStatus.STOPPING);

        abortAllSleepingTasks();
        stopListeningForChannelPoints();
        resetOnlineStatusOfStreamers();

        this.setWatcherStatus(WatcherStatus.STOPPED);

        log.info(`Watcher is paused`);
        log.debug('Watcher is stopped');
    }

    // This is NOT same as `!canPause()`
    public canPlay(): boolean {
        if (
            this.store.getState().status === WatcherStatus.INIT ||
            this.store.getState().status === WatcherStatus.STOPPED
        ) {
            return true;
        }

        return false;
    }

    // This is NOT same as `!canStart()`
    public canPause(): boolean {
        if (this.store.getState().status === WatcherStatus.RUNNING) {
            return true;
        }

        return false;
    }

    public addPointsEarned(points: number) {
        const { getState, setState } = this.store;
        setState({ pointsEarned: getState().pointsEarned + points });
        this.syncStateWithStorage();
    }

    // This updates `watching` to `false` for streamers that are no longer being
    // watched as they are not in the top 2 among all the online streamers.
    private fixWatchingStatus(): void {
        // We can only watch the first 2 online streamers. So these are the
        // streamers we should NOT be watching.
        const streamersToNotWatch = getOnlineStreamers().slice(2);

        if (!streamersToNotWatch.length) {
            return;
        }

        for (const streamer of streamersToNotWatch) {
            if (streamer.watching) {
                updateStreamer(streamer.id, { watching: false });
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
        return `${authStore.getState().user.id}.watcher`;
    }

    private getInitialState(): State {
        try {
            const savedState: SavedState = JSON.parse(
                localStorage.getItem(this.getStorageKey()) || ''
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
            log.warning(`${this.storeName} state set to default`);

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

    private isWatcherRunning(): boolean {
        if (this.store.getState().status === WatcherStatus.RUNNING) {
            return true;
        }

        return false;
    }

    private incrementMinutesWatched() {
        const { getState, setState } = this.store;
        setState({ minutesWatched: (getState().minutesWatched += 1) });
        this.syncStateWithStorage();
    }

    private syncStateWithStorage() {
        const state: SavedState = {
            minutesWatched: this.store.getState().minutesWatched,
            pointsEarned: this.store.getState().pointsEarned,
        };
        localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
    }
}

export const watcher = new Watcher();
