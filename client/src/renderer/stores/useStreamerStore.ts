import vanillaCreate from 'zustand/vanilla';
import create from 'zustand';
import { rightNowInSecs } from 'renderer/utils';
import { authStore } from './useAuthStore';

export type StreamerLogin = string;
export type StreamerId = string;

export interface Streamer {
  login: StreamerLogin;
  priorityRank: number;
  id: StreamerId;
  displayName: string;
  profileImageUrl: string;
  followersCount: string;
  online: boolean;
  lastOfflineTime: number;
}

interface State {
  streamers: Streamer[];
}

type NewStreamer = Omit<
  Streamer,
  'online' | 'lastOfflineTime' | 'priorityRank'
>;

type UpdateStreamer = Omit<NewStreamer, 'id' | 'login'>;

const getStorageKey = () => `${authStore.getState().user.id}.streamers`;

function getInitialState(): State {
  try {
    const streamers: Streamer[] = JSON.parse(
      localStorage.getItem(getStorageKey()) || ''
    );

    return { streamers };
  } catch {
    return { streamers: [] };
  }
}

export const streamerStore = vanillaCreate(() => getInitialState());
export const useStreamerStore = create(streamerStore);

export function getAllStreamers(): Streamer[] {
  return streamerStore.getState().streamers;
}

export function getOnlineStreamers(): Streamer[] {
  // Streamers were already ordered based on `priorityRank` which is their
  // index from first to last (top to bottom), therefore just filtering the
  // online streamers will have correct `priority`.
  const onlineStreamers: Streamer[] = getAllStreamers().filter(
    (streamer) => streamer.online === true
  );

  return onlineStreamers;
}

export function addStreamer(streamer: NewStreamer) {
  const { getState, setState } = streamerStore;

  for (let i = 0; i < getState().streamers.length; i += 1) {
    if (getState().streamers[i].id === streamer.id) {
      console.error('Streamer already exists');

      return setState({
        streamers: getState().streamers,
      });
    }
  }

  const streamerToAdd = {
    ...streamer,
    priorityRank: getState().streamers.length + 1,
    online: false,
    lastOfflineTime: 0,
  };

  const updated = [...getState().streamers, streamerToAdd];

  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(updated));
  } catch {}

  return setState({
    streamers: updated,
  });
}

export function removeStreamer(id: StreamerId) {
  const { getState, setState } = streamerStore;

  const updated = getState()
    .streamers.filter((streamer) => streamer.id !== id)
    .map((streamer, idx) => {
      return { ...streamer, priorityRank: idx + 1 };
    });

  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(updated));
  } catch {}

  return setState({
    streamers: updated,
  });
}

export function updateStreamer(id: StreamerId, newValue: UpdateStreamer) {
  const { getState, setState } = streamerStore;

  const updated = getState().streamers.map((streamer) => {
    if (streamer.id === id) {
      return {
        ...streamer,
        displayName: newValue.displayName,
        profileImageUrl: newValue.profileImageUrl,
        followersCount: newValue.followersCount,
      };
    }

    return { ...streamer };
  });

  // We don't want to store these keys to storage.
  // Only the above info is to be persisted.
  const updatedForPersisting = updated.map((streamer) => ({
    ...streamer,
    online: false,
    lastOfflineTime: 0,
  }));

  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(updatedForPersisting));
  } catch {}

  return setState({
    streamers: updated,
  });
}

export function setOnlineStatus(login: StreamerLogin, status: boolean) {
  const { getState, setState } = streamerStore;

  const updated: Streamer[] = getState().streamers.map((streamer): Streamer => {
    if (streamer.login === login) {
      console.log(
        `${streamer.displayName} is ${status ? 'online' : 'offline'}!`
      );

      if (!status) {
        return {
          ...streamer,
          online: status,
          lastOfflineTime: rightNowInSecs(),
        };
      }

      return {
        ...streamer,
        online: status,
      };
    }

    return streamer;
  });

  return setState({
    streamers: updated,
  });
}

export function isOnline(login: StreamerLogin): boolean {
  for (const streamer of getAllStreamers()) {
    if (streamer.login === login) {
      if (streamer.online) {
        return true;
      }
    }
  }

  return false;
}

export function resetOnlineStatusOfStreamers() {
  const streamers = getInitialState().streamers;
  streamerStore.setState({ streamers });
}
