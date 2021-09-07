import { fetchChannelInfo, makeGraphqlRequest } from 'renderer/api';
import {
  getAllStreamers,
  isOnline,
  setOnlineStatus,
  Streamer,
  StreamerLogin,
} from 'renderer/stores/useStreamerStore';
import { rightNowInSecs } from 'renderer/utils';
import { StreamerIsOfflineError } from './errors';
// eslint-disable-next-line import/no-cycle
import { updateMinuteWatchedEventRequestInfo } from './graphql';

/**
 *  CACHING
 */
const channelIdByStreamerLogin: Map<string, string> = new Map();
const streamerLoginByChannelId: Map<string, string> = new Map();
const lastOfflineTime: Map<string, number> = new Map();

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

export async function setStreamersToWatch() {
  for (const streamer of getAllStreamers()) {
    // eslint-disable-next-line no-await-in-loop
    await checkOnline(streamer.login);
  }
}

export function doForEachStreamer(
  callback: (...args: any) => void,
  ...args: any
) {
  for (const streamer of getAllStreamers()) {
    callback(streamer, ...args);
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
        setOffline(login);
      }
    }
  }
}

export function setOffline(login: StreamerLogin) {
  setOnlineStatus(login, false);
}
