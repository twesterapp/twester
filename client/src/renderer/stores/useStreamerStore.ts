import vanillaCreate from 'zustand/vanilla';
import create from 'zustand';
import { rightNowInSecs } from 'renderer/utils';
import { authStore } from './useAuthStore';

export type StreamerLogin = string;
type StreamerId = string;

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
    (streamer) => streamer.online !== false
  );

  console.log({ onlineStreamers });
  return onlineStreamers;
}

export function addStreamer(streamer: Omit<Streamer, 'priorityRank'>) {
  console.log('Adding streamer', streamer);
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
  console.log('Removing streamer with id: ', id);
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

export function setOnlineStatus(_streamer: Streamer, status: boolean) {
  console.log(`${_streamer.displayName} is ${status ? 'online' : 'offline'}!`);

  const { getState, setState } = streamerStore;

  const updated: Streamer[] = getState().streamers.map((streamer): Streamer => {
    if (streamer.id === _streamer.id) {
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

export function isOnline(_streamer: Streamer): boolean {
  for (const streamer of streamerStore.getState().streamers) {
    if (streamer.id === _streamer.id) {
      if (streamer.online) {
        return true;
      }
    }
  }

  return false;
}
