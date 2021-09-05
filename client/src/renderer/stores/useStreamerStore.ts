import { getUserId } from 'renderer/utils';
import create from 'zustand';
import { combine } from 'zustand/middleware';

interface Streamer {
  priorityRank: number;
  displayName: string;
  displayImage: string;
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
    add: (streamer: Streamer) => {
      set((state) => {
        console.log('Adding streamer', streamer);
        const updated = [...state.streamers, streamer];
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {}

        return { streamers: updated };
      });
    },
  }))
);
