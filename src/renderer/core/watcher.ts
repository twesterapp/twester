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
} from 'renderer/stores/useWatcherStore';
import { abortAllSleepingTasks, rightNowInSecs, sleep } from 'renderer/utils';
import { loadChannelPointsContext } from './bonus';
import { getMinuteWatchedRequestInfo, updateStreamersToWatch } from './data';
import {
  listenForChannelPoints,
  stopListeningForChannelPoints,
} from './pubsub';

class Watcher {
  private minutesPassed = 0;

  private logger: Logger;

  constructor() {
    this.logger = new Logger({ prefix: 'WATCHER' });
  }

  public async play() {
    if (!authStore.getState().accessToken || !authStore.getState().user.id) {
      console.error('User not authorized');
    }

    this.logger.debug('Booting');
    setWatcherStatus(WatcherStatus.BOOTING);
    this.logger.info(
      `Loading data for ${getAllStreamers().length} streamers...`
    );

    // PERF: These both awaits loop over streamers and await in the loop, which
    // is very slow, as it's not asynchronus anymore. Should probable fix by
    // all promises -> promises array -> await promises array -> results array
    // and then use the results array to make the necessary state updates.
    await loadChannelPointsContext();
    await updateStreamersToWatch();
    listenForChannelPoints();

    setWatcherStatus(WatcherStatus.RUNNING);
    this.logger.debug('Running');

    while (isWatcherRunning()) {
      this.logger.debug(`Watched for ${this.minutesPassed} minutes`);
      const streamersToWatch = getOnlineStreamers().slice(0, 2);
      const numOfStreamersToWatch = streamersToWatch.length;
      this.logger.debug(`Watching ${numOfStreamersToWatch} streamer(s)`);

      if (numOfStreamersToWatch) {
        for (let i = 0; i < numOfStreamersToWatch; i += 1) {
          const streamer = streamersToWatch[i];
          const nextIteration = rightNowInSecs() + 60 / numOfStreamersToWatch;

          // FIXME: If the client's internet DC while the app is running and
          // the internet comes back after any of these(streamersToWatch)
          // streamer(s) went offline, the watcher will still keep watching that
          // streamer because this `isOnline` check is made with cached value
          // instead of actual recently fetched data from the Twitch server.
          if (isOnline(streamer.login)) {
            try {
              const info = getMinuteWatchedRequestInfo(streamer.login);
              if (info) {
                this.logger.debug(
                  `Sending watch minute event for ${streamer.displayName}`
                );

                if (!streamer.watching) {
                  updateStreamer(streamer.id, { watching: true });
                  this.logger.info(
                    `Started watching ${streamer.displayName}'s livestream!`
                  );
                }

                await nodeClient.post('/minute-watched-event', {
                  url: info.url,
                  payload: info.payload,
                });

                this.logger.debug(
                  `Successfully sent watch minute event for ${streamer.displayName}`
                );
              }
            } catch {
              console.info('Error while trying to watch a minute');
            }

            const duration = nextIteration - rightNowInSecs();
            this.logger.debug(`Sleeping for ${duration}s`);
            await sleep(duration);
          }
        }
      } else {
        this.logger.debug(`Sleeping for 60s`);
        await sleep(60);
      }

      this.minutesPassed += 1;
    }
  }

  public pause() {
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
