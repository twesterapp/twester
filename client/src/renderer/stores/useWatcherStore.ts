import vanillaCreate from 'zustand/vanilla';
import create from 'zustand';

export const watcherStore = vanillaCreate(() => ({
  isWatching: false,
}));

export function setWatching(v: boolean) {
  watcherStore.setState({ isWatching: v });
}

export const useWatcherStore = create(watcherStore);
