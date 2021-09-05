import { getUserId } from 'renderer/utils';
import create from 'zustand';
import { combine } from 'zustand/middleware';

type StreamerLogin = string;

interface Streamer {
  login: StreamerLogin;
  priorityRank: number;
  id: string;
  displayName: string;
  profileImageUrl: string;
  followersCount: string;
}

const storageKey = `${getUserId()}.streamers`;

function getInitialState(): { streamers: Streamer[] } {
  try {
    const streamers: Streamer[] = JSON.parse(
      localStorage.getItem(storageKey) || ''
    );

    return { streamers };
  } catch {
    return { streamers: [] };
  }
}

export const useStreamerStore = create(
  combine(getInitialState(), (set) => ({
    add: (streamer: Omit<Streamer, 'priorityRank'>) => {
      set((state) => {
        console.log('Adding streamer', streamer);

        for (let i = 0; i < state.streamers.length; i = +1) {
          if (state.streamers[i].id === streamer.id) {
            console.error('Streamer already exists');
            return state;
          }
        }
        const streamerToAdd = {
          ...streamer,
          priorityRank: state.streamers.length + 1,
        };
        const updated = [...state.streamers, streamerToAdd];

        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {}

        return { streamers: updated };
      });
    },
  }))
);
