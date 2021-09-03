/* eslint-disable no-await-in-loop */
/* eslint-disable guard-for-in */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { oauthClient, fetchChannelInfo, nodeClient } from 'renderer/api';
import { getUserId, sleep } from 'renderer/utils';

// TODO: Load the top two online from "Streamers to watch" list which can be
// fetched from file-storage or backend or localStorage.
function getStreamersToWatch(): string[] {
  return ['hiko'];
}

async function makeGqlRequest(
  data: Record<string, any>
): Promise<Record<string, any>> {
  console.info('Making Twitch GraphQL request');

  return oauthClient({ method: 'POST', url: 'https://gql.twitch.tv/gql', data })
    .then((res) => {
      const data = res.data;
      console.info('Res from Twitch GraphQL \n', data);
      return data;
    })
    .catch((e) => {
      console.error('Twitch GraphQL request error: \n', e);
    });
}

export async function claimChannelPointsBonus(
  streamerLogin: string,
  claimId: string
) {
  console.info(`Claming bonus for ${streamerLogin}`);

  const data = {
    operationName: 'ClaimCommunityPoints',
    variables: {
      input: { channelID: await getChannelId(streamerLogin), claimID: claimId },
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash:
          '46aaeebe02c99afdf4fc97c7c0cba964124bf6b0af229395f1f6d1feed05b3d0',
      },
    },
  };

  makeGqlRequest(data);
}

// CACHING
const channelIdByStreamerLogin: Map<string, string> = new Map();
const streamerLoginByChannelId: Map<string, string> = new Map();
const broadcastIdByStreamerLogin: Map<string, string> = new Map();

export function channelIdExistsInCache(id: string): boolean {
  return streamerLoginByChannelId.has(id);
}

export function getStreamerLoginByChannelIdFromCache(id: string): string {
  let login = '';

  if (streamerLoginByChannelId.has(id)) {
    login = streamerLoginByChannelId.get(id)!;
  }

  return login;
}

export async function getChannelId(streamerLogin: string): Promise<string> {
  console.info(`Getting channel id for ${streamerLogin}`);

  if (channelIdByStreamerLogin.has(streamerLogin)) {
    return channelIdByStreamerLogin.get(streamerLogin)!;
  }

  return fetchChannelInfo(streamerLogin)
    .then((res) => {
      const id = res.data.data[0].id;
      console.info(`Channel id for ${streamerLogin} is`, id);
      channelIdByStreamerLogin.set(streamerLogin, id);
      streamerLoginByChannelId.set(id, streamerLogin);
      return id;
    })
    .catch((e) => console.error('Error: ', e));
}

async function getBroadcastId(streamerLogin: string): Promise<string> {
  console.info(`Getting broadcast ID for ${streamerLogin}`);

  if (broadcastIdByStreamerLogin.has(streamerLogin)) {
    return broadcastIdByStreamerLogin.get(streamerLogin)!;
  }

  const data = {
    operationName: 'WithIsStreamLiveQuery',
    variables: { id: await getChannelId(streamerLogin) },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash:
          '04e46329a6786ff3a81c01c50bfa5d725902507a0deb83b0edbf7abe7a3716ea',
      },
    },
  };

  const response = await makeGqlRequest(data);
  const stream = response.data.user.stream;

  if (!stream) {
    console.error('Streamer is offline');
  }

  const id = stream.id;
  broadcastIdByStreamerLogin.set(streamerLogin, id);

  return id;
}

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

async function getMinuteWatchedEventRequestInfo(
  streamerLogin: string
): Promise<MinuteWatchedRequest | undefined> {
  // if (_minuteWatchedRequests.get(streamerLogin)) {
  //   return _minuteWatchedRequests.get(streamerLogin);
  // }

  const eventProperties = {
    channel_id: await getChannelId(streamerLogin),
    broadcast_id: await getBroadcastId(streamerLogin),
    player: 'site',
    // eslint-disable-next-line radix
    user_id: parseInt(getUserId()),
  };

  const minuteWatched = {
    event: 'minute-watched',
    properties: eventProperties,
  };

  let afterBase64: string;
  try {
    afterBase64 = btoa(JSON.stringify([minuteWatched]));
    console.log({ afterBase64 });
  } catch (e) {
    console.error('Failed Base64 encoding');
    return undefined;
  }

  const url = await getMinuteWatchedRequestUrl(streamerLogin);
  const payload = {
    data: afterBase64,
  };

  // Caching
  // _minuteWatchedRequests.set(streamerLogin, { url, payload });

  return {
    url,
    payload,
  };
}

let minutesPassed = 0;

export async function startWatching() {
  while (true) {
    console.info(`Watched for ${minutesPassed} minutes`);
    const streamersToWatch = getStreamersToWatch().slice(0, 2);
    console.log({ streamersToWatch });
    const numOfStreamersToWatch = streamersToWatch.length;
    console.info(`Watching ${numOfStreamersToWatch} streamer(s)`);

    // eslint-disable-next-line no-restricted-syntax
    for (let i = 0; i < numOfStreamersToWatch; i += 1) {
      const streamer = streamersToWatch[i];
      const nextIteration =
        Math.floor(Date.now() / 1000) + 60 / numOfStreamersToWatch;

      try {
        const info = await getMinuteWatchedEventRequestInfo(streamer);
        console.log(info);
        if (info) {
          console.info(`Sending watch minute event for ${streamer}`);
          await nodeClient.post('/minute-watched-event', {
            url: info.url,
            payload: info.payload,
          });

          console.info(`Successfully sent watch minute event for ${streamer}`);
        }
      } catch (e) {
        console.info('Error while trying to watch a minute: ', e);
        console.error(e.response);
      }

      const max = Math.max(nextIteration - Date.now() / 1000, 0);
      console.log(`Sleeping for ${max}s`);
      await sleep(max);
    }

    if (!streamersToWatch) {
      console.log(`Sleeping for 60s`);
      await sleep(60);
    }

    minutesPassed += 1;
  }
}
