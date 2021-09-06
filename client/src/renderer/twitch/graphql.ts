/* eslint-disable import/no-cycle */
/* eslint-disable no-await-in-loop */
/* eslint-disable guard-for-in */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { nodeClient } from 'renderer/api';
import { authStore } from 'renderer/stores/useAuthStore';
import {
  getAllStreamers,
  getOnlineStreamers,
  isOnline,
  resetOnlineStatusOfStreamers,
} from 'renderer/stores/useStreamerStore';
import { setWatching, watcherStore } from 'renderer/stores/useWatcherStore';
import { rightNowInSecs, sleep } from 'renderer/utils';
import { loadChannelPointsContext } from './claimBonus';
import {
  getBroadcastId,
  getChannelId,
  setStreamersToWatch,
  doForEachStreamer,
} from './data';

async function getMinuteWatchedRequestUrl(
  streamerLogin: string
): Promise<string> {
  return nodeClient
    .get(`/minute-watched-request-url?streamerLogin=${streamerLogin}`)
    .then((res) => res.data.data.minute_watched_url)
    .catch((e) => console.error('Error: ', e));
}

interface MinuteWatchedRequest {
  url: string;
  payload: { data: string };
}

// For caching purposes so that we don't keep making the HTTP request if we
// have already once fetched the details.
const _minuteWatchedRequests: Map<string, MinuteWatchedRequest> = new Map();

export async function updateMinuteWatchedEventRequestInfo(
  streamerLogin: string
): Promise<undefined> {
  const eventProperties = {
    channel_id: await getChannelId(streamerLogin),
    broadcast_id: await getBroadcastId(streamerLogin),
    player: 'site',
    // eslint-disable-next-line radix
    user_id: parseInt(authStore.getState().user.id),
  };

  const minuteWatched = {
    event: 'minute-watched',
    properties: eventProperties,
  };

  let afterBase64: string;
  try {
    afterBase64 = btoa(JSON.stringify([minuteWatched]));
  } catch (e) {
    console.error('Failed Base64 encoding');
    return undefined;
  }

  const url = await getMinuteWatchedRequestUrl(streamerLogin);
  const payload = {
    data: afterBase64,
  };

  // Caching
  _minuteWatchedRequests.set(streamerLogin, { url, payload });

  return undefined;
}

let minutesPassed = 0;

export function stopWatching() {
  setWatching(false);
  resetOnlineStatusOfStreamers();
}

export async function startWatching() {
  console.log(`Loading data for ${getAllStreamers().length} streamers...`);

  setWatching(true);
  await setStreamersToWatch();
  doForEachStreamer(loadChannelPointsContext);

  while (watcherStore.getState().isWatching) {
    console.info(`Watched for ${minutesPassed} minutes`);
    const streamersToWatch = getOnlineStreamers().slice(0, 2);
    const numOfStreamersToWatch = streamersToWatch.length;
    console.info(
      `Watching ${numOfStreamersToWatch} streamer(s): `,
      streamersToWatch
    );

    for (let i = 0; i < numOfStreamersToWatch; i += 1) {
      const streamer = streamersToWatch[i];
      const nextIteration = rightNowInSecs() + 60 / numOfStreamersToWatch;

      if (isOnline(streamer)) {
        try {
          const info = _minuteWatchedRequests.get(streamer.login);
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

    if (!streamersToWatch) {
      console.log(`Sleeping for 60s`);
      await sleep(60);
    }

    minutesPassed += 1;
  }
}
