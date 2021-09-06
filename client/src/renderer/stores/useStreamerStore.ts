import { getUser } from 'renderer/utils';
import vanillaCreate from 'zustand/vanilla';
import create from 'zustand';

type StreamerLogin = string;
type StreamerId = string;

export interface Streamer {
  login: StreamerLogin;
  priorityRank: number;
  id: StreamerId;
  displayName: string;
  profileImageUrl: string;
  followersCount: string;
}

interface State {
  streamers: Streamer[];
}

const getStorageKey = () => `${getUser().id}.streamers`;

export function getStreamersFromStorage(): Streamer[] {
  try {
    const streamers: Streamer[] = JSON.parse(
      localStorage.getItem(getStorageKey()) || ''
    );

    return streamers;
  } catch {
    return [];
  }
}

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

export const useStreamerStore = create(streamerStore);
