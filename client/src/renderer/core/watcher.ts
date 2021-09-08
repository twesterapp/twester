import { nodeClient } from 'renderer/api';
import { authStore } from 'renderer/stores/useAuthStore';
import { Logger } from 'renderer/stores/useLoggerStore';
import {
  getAllStreamers,
  getOnlineStreamers,
  isOnline,
  resetOnlineStatusOfStreamers,
} from 'renderer/stores/useStreamerStore';
import {
  setWatcherStatus,
  watcherIsRunning,
  WatcherStatus,
  canStopWatcher,
  canStartWatcher,
} from 'renderer/stores/useWatcherStore';
import { rightNowInSecs, sleep } from 'renderer/utils';
import { loadChannelPointsContext } from './bonus';
import {
  doForEachStreamer,
  getMinuteWatchedRequestInfo,
  setStreamersToWatch,
} from './data';
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

  public async start() {
    if (!authStore.getState().accessToken || !authStore.getState().user.id) {
      console.error('User not authorized');
    }

    this.logger.debug('Booting');
    setWatcherStatus(WatcherStatus.BOOTING);
    this.logger.info(
      `Loading data for ${getAllStreamers().length} streamers...`
    );

    listenForChannelPoints();
    await setStreamersToWatch();
    doForEachStreamer(loadChannelPointsContext);

    setWatcherStatus(WatcherStatus.RUNNING);
    this.logger.debug('Running');

    while (watcherIsRunning()) {
      this.logger.debug(`Watched for ${this.minutesPassed} minutes`);
      const streamersToWatch = getOnlineStreamers().slice(0, 2);
      const numOfStreamersToWatch = streamersToWatch.length;
      this.logger.debug(`Watching ${numOfStreamersToWatch} streamer(s)`);

      if (numOfStreamersToWatch) {
        for (let i = 0; i < numOfStreamersToWatch; i += 1) {
          const streamer = streamersToWatch[i];
          const nextIteration = rightNowInSecs() + 60 / numOfStreamersToWatch;

          if (isOnline(streamer.login)) {
            try {
              const info = getMinuteWatchedRequestInfo(streamer.login);
              if (info) {
                this.logger.debug(
                  `Sending watch minute event for ${streamer.displayName}`
                );
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

            const max = Math.max(nextIteration - Date.now() / 1000, 0);
            this.logger.debug(`Sleeping for ${max}s`);
            await sleep(max);
          }
        }
      } else {
        this.logger.debug(`Sleeping for 60s`);
        await sleep(60);
      }

      this.minutesPassed += 1;
    }
  }

  public stop() {
    this.logger.debug('Stopping');
    setWatcherStatus(WatcherStatus.STOPPING);

    resetOnlineStatusOfStreamers();
    stopListeningForChannelPoints();

    setWatcherStatus(WatcherStatus.STOPPED);
    this.logger.debug('Stopped');
  }

  public canStart(): boolean {
    return canStartWatcher();
  }

  public canStop(): boolean {
    return canStopWatcher();
  }
}

export const watcher = new Watcher();
