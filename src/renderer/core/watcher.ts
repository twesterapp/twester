import { nodeClient } from 'renderer/api';
import { authStore } from 'renderer/stores/useAuthStore';
import { Logger } from 'renderer/stores/useLoggerStore';
import {
    getAllStreamers,
    getOnlineStreamers,
    isOnline,
    resetOnlineStatusOfStreamers,
    updateStreamer,
} from 'renderer/stores/useStreamerStore';
import {
    setWatcherStatus,
    isWatcherRunning,
    WatcherStatus,
    canStopWatcher,
    canStartWatcher,
    incrementMinutesWatched,
} from 'renderer/stores/useWatcherStore';
import {
    abortAllSleepingTasks,
    formatMinutesToString,
    rightNowInSecs,
    sleep,
} from 'renderer/utils';
import { v4 as uuid } from 'uuid';
import { loadChannelPointsContext } from './bonus';
import { getMinuteWatchedRequestInfo, updateStreamersToWatch } from './data';
import {
    listenForChannelPoints,
    stopListeningForChannelPoints,
} from './pubsub';

class Watcher {
    private id: string;

    private startTime: number;

    private logger: Logger;

    constructor() {
        this.logger = new Logger({ prefix: 'WATCHER' });
        this.startTime = 0;
        this.id = '';
    }

    public async play() {
        if (
            !authStore.getState().accessToken ||
            !authStore.getState().user.id
        ) {
            console.error('User not authorized');
            return;
        }

        if (!this.id) {
            this.id = uuid();
            this.logger.info(`Starting session: ${this.id}`);
            this.startTime = rightNowInSecs();
        } else {
            this.logger.info(`Resuming session: ${this.id}`);
        }

        this.logger.debug('Booting');
        setWatcherStatus(WatcherStatus.BOOTING);
        this.logger.info(
            `Loading data for ${getAllStreamers().length} streamers...`
        );

        await loadChannelPointsContext();
        await updateStreamersToWatch();
        listenForChannelPoints();

        setWatcherStatus(WatcherStatus.RUNNING);
        this.logger.debug('Running');

        while (isWatcherRunning()) {
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
                                    this.logger.info(
                                        `Started watching ${streamer.displayName}'s livestream!`
                                    );
                                }

                                await nodeClient.post('/minute-watched-event', {
                                    url: info.url,
                                    payload: info.payload,
                                });

                                if (
                                    minutePassedSince(
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
                                    incrementMinutesWatched();
                                }

                                this.logger.debug(
                                    `Sent minute watched event for ${streamer.displayName}`
                                );
                            }
                        } catch {
                            console.error(
                                'Error while trying to watch a minute'
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
        const timePassedInMinutes = Math.floor(
            (rightNowInSecs() - this.startTime) / 60
        );
        this.logger.info(
            `Pausing session: ${this.id} - ${formatMinutesToString(
                timePassedInMinutes
            )}`
        );
        this.logger.debug('Stopping');

        setWatcherStatus(WatcherStatus.STOPPING);

        abortAllSleepingTasks();
        stopListeningForChannelPoints();
        resetOnlineStatusOfStreamers();

        setWatcherStatus(WatcherStatus.STOPPED);

        this.logger.debug('Stopped');
    }

    public canPlay(): boolean {
        return canStartWatcher();
    }

    public canPause(): boolean {
        return canStopWatcher();
    }
}

export const watcher = new Watcher();

// IDK if I should compare with 60. This function exists to stop us from doing
// things that should have happened only once per minute at max.
function minutePassedSince(time: number): boolean {
    return rightNowInSecs() - time > 59;
}
