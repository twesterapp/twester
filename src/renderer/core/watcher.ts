import { nodeClient } from 'renderer/api';
import { authStore } from 'renderer/stores/useAuthStore';
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
import { abortAllSleepingTasks, sleep } from 'renderer/utils';
import { rightNowInSecs } from 'renderer/utils/rightNowInSecs';
import { v4 as uuid } from 'uuid';
import { loadChannelPointsContext } from './bonus';
import { getMinuteWatchedRequestInfo, updateStreamersToWatch } from './data';
import {
    startListeningForChannelPoints,
    stopListeningForChannelPoints,
} from './pubsub';

import { logging } from './logging';

const log = logging.getLogger('WATCHER');

class Watcher {
    private id: string;

    constructor() {
        this.id = '';
    }

    public async play() {
        if (
            !authStore.getState().accessToken ||
            !authStore.getState().user.id
        ) {
            log.error('User is unauthorized. Skipping to start Watcher.');
            return;
        }

        log.debug('Watcher is booting');
        setWatcherStatus(WatcherStatus.BOOTING);

        if (!this.id) {
            this.id = uuid();
            log.info(`Watcher is starting`);
        } else {
            log.info(`Watcher is resuming`);
        }

        log.info(`Loading data for ${getAllStreamers().length} streamers...`);
        await loadChannelPointsContext();
        await updateStreamersToWatch();
        startListeningForChannelPoints();

        setWatcherStatus(WatcherStatus.RUNNING);
        log.debug('Watcher is running');

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
        setWatcherStatus(WatcherStatus.STOPPING);

        abortAllSleepingTasks();
        stopListeningForChannelPoints();
        resetOnlineStatusOfStreamers();

        setWatcherStatus(WatcherStatus.STOPPED);

        log.info(`Watcher is paused`);
        log.debug('Watcher is stopped');
    }

    public canPlay(): boolean {
        return canStartWatcher();
    }

    public canPause(): boolean {
        return canStopWatcher();
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
}

export const watcher = new Watcher();

// IDK if I should compare with 60. This function exists to stop us from doing
// things that should have happened only once per minute.
function minutePassedSince(time: number): boolean {
    return rightNowInSecs() - time > 59;
}
