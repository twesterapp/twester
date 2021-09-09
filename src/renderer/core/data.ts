import { fetchChannelInfo, makeGraphqlRequest, nodeClient } from 'renderer/api';
import { authStore } from 'renderer/stores/useAuthStore';
import {
  getAllStreamers,
  isOnline,
  setOnlineStatus,
  StreamerLogin,
} from 'renderer/stores/useStreamerStore';
import { rightNowInSecs } from 'renderer/utils';
import { StreamerIsOfflineError } from './errors';

interface MinuteWatchedRequest {
  url: string;
  payload: { data: string };
}

/**
 *  CACHING
 */
const channelIdByStreamerLogin: Map<string, string> = new Map();
const streamerLoginByChannelId: Map<string, string> = new Map();
const lastOfflineTime: Map<string, number> = new Map();
const minuteWatchedRequests: Map<string, MinuteWatchedRequest> = new Map();

export function getMinuteWatchedRequestInfo(
  login: StreamerLogin
): MinuteWatchedRequest {
  let info = { url: '', payload: { data: '' } };
  if (minuteWatchedRequests.has(login)) {
    info = minuteWatchedRequests.get(login)!;
  }

  return info;
}

async function getMinuteWatchedRequestUrl(
  streamerLogin: string
): Promise<string> {
  return nodeClient
    .get(`/minute-watched-request-url?streamerLogin=${streamerLogin}`)
    .then((res) => res.data.data.minute_watched_url)
    .catch((e) => console.error('Error: ', e));
}

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
  minuteWatchedRequests.set(streamerLogin, { url, payload });

  return undefined;
}

export async function getChannelId(streamerLogin: string): Promise<string> {
  if (channelIdByStreamerLogin.has(streamerLogin)) {
    return channelIdByStreamerLogin.get(streamerLogin)!;
  }

  return fetchChannelInfo(streamerLogin)
    .then((res) => {
      const id = res.data.data[0].id;
      channelIdByStreamerLogin.set(streamerLogin, id);
      streamerLoginByChannelId.set(id, streamerLogin);
      return id;
    })
    .catch((e) => console.error('Error: ', e));
}

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

export async function getBroadcastId(streamerLogin: string): Promise<string> {
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

  const response = await makeGraphqlRequest(data);
  const stream = response.data.user.stream;

  if (!stream) {
    throw new StreamerIsOfflineError(`${streamerLogin} is offline!`);
  }

  const id = stream.id;
  return id;
}

export async function updateStreamersToWatch() {
  for (const streamer of getAllStreamers()) {
    await checkOnline(streamer.login);
  }
}

export async function checkOnline(login: StreamerLogin) {
  // Twitch API has a delay for querying channels. If a query is made right after
  //  the streamer went offline, it will cause a false "streamer is live" event.
  if (rightNowInSecs() < (lastOfflineTime.get(login) ?? 0) + 60) {
    return;
  }

  if (!isOnline(login)) {
    try {
      await updateMinuteWatchedEventRequestInfo(login);
      setOnlineStatus(login, true);
    } catch (err) {
      if (err instanceof StreamerIsOfflineError) {
        setOnlineStatus(login, false);
      }
    }
  }
}
