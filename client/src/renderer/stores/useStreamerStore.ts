import { getUser } from 'renderer/utils';
import create from 'zustand';
import { combine } from 'zustand/middleware';

type StreamerLogin = string;

export interface Streamer {
  login: StreamerLogin;
  priorityRank: number;
  id: string;
  displayName: string;
  profileImageUrl: string;
  followersCount: string;
}

interface State {
  streamers: Streamer[];
}

const getStorageKey = () => `${getUser().id}.streamers`;

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

export const useStreamerStore = create(
  combine(getInitialState(), (set, get) => ({
    addStreamer: (streamer: Omit<Streamer, 'priorityRank'>) => {
      set((state) => {
        console.log('Adding streamer', streamer);

        for (let i = 0; i < get().streamers.length; i += 1) {
          if (get().streamers[i].id === streamer.id) {
            console.error('Streamer already exists');
            return state;
          }
        }

        const streamerToAdd = {
          ...streamer,
          priorityRank: get().streamers.length + 1,
        };

        const updated = [...get().streamers, streamerToAdd];

        try {
          localStorage.setItem(getStorageKey(), JSON.stringify(updated));
        } catch {}

        return { streamers: updated };
      });
    },

    removeStreamer: (id: string) =>
      set(() => {
        console.log('Removing streamer with id: ', id);
        const updated = get()
          .streamers.filter((streamer) => streamer.id !== id)
          .map((streamer, idx) => {
            return { ...streamer, priorityRank: idx + 1 };
          });

        try {
          localStorage.setItem(getStorageKey(), JSON.stringify(updated));
        } catch {}

        return { streamers: updated };
      }),
  }))
);
