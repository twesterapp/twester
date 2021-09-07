import { nodeClient } from 'renderer/api';
import { authStore } from 'renderer/stores/useAuthStore';
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
  watcherStore,
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

  public async start() {
    if (!authStore.getState().accessToken || !authStore.getState().user.id) {
      console.error('User not authorized');
    }

    setWatcherStatus(WatcherStatus.BOOTING);
    console.log(`Loading data for ${getAllStreamers().length} streamers...`);

    listenForChannelPoints();
    await setStreamersToWatch();
    doForEachStreamer(loadChannelPointsContext);

    setWatcherStatus(WatcherStatus.RUNNING);

    while (watcherIsRunning()) {
      console.info(`Watched for ${this.minutesPassed} minutes`);
      const streamersToWatch = getOnlineStreamers().slice(0, 2);
      const numOfStreamersToWatch = streamersToWatch.length;
      console.info(
        `Watching ${numOfStreamersToWatch} streamer(s): `,
        streamersToWatch
      );

      if (numOfStreamersToWatch) {
        for (let i = 0; i < numOfStreamersToWatch; i += 1) {
          const streamer = streamersToWatch[i];
          const nextIteration = rightNowInSecs() + 60 / numOfStreamersToWatch;

          if (isOnline(streamer.login)) {
            try {
              const info = getMinuteWatchedRequestInfo(streamer.login);
              if (info) {
                console.info(
                  `Sending watch minute event for ${streamer.displayName}`
                );
                await nodeClient.post('/minute-watched-event', {
                  url: info.url,
                  payload: info.payload,
                });

                console.info(
                  `Successfully sent watch minute event for ${streamer.displayName}`
                );
              }
            } catch {
              console.info('Error while trying to watch a minute');
            }

            const max = Math.max(nextIteration - Date.now() / 1000, 0);
            console.log(`Sleeping for ${max}s`);
            await sleep(max);
          }
        }
      } else {
        console.log(`Sleeping for 60s`);
        await sleep(60);
      }

      this.minutesPassed += 1;
    }
  }

  public stop() {
    setWatcherStatus(WatcherStatus.STOPPING);

    resetOnlineStatusOfStreamers();
    stopListeningForChannelPoints();

    setWatcherStatus(WatcherStatus.STOPPED);
  }

  public canStart(): boolean {
    return canStartWatcher();
  }

  public canStop(): boolean {
    return canStopWatcher();
  }
}

export const watcher = new Watcher();
