import vanillaCreate from 'zustand/vanilla';
import create from 'zustand';

export enum WatcherStatus {
    // Instance is created and has not been run for even once.
    INIT = 'INIT',
    BOOTING = 'BOOTING',
    RUNNING = 'RUNNING',
    STOPPING = 'STOPPING',
    STOPPED = 'STOPPED',
}

export const watcherStore = vanillaCreate(() => ({
    status: WatcherStatus.INIT,
}));

export const useWatcherStore = create(watcherStore);

export function setWatcherStatus(status: WatcherStatus) {
    watcherStore.setState({ status });
}

export function isWatcherRunning(): boolean {
    if (watcherStore.getState().status === WatcherStatus.RUNNING) {
        return true;
    }

    return false;
}

export function isWatcherStopped(): boolean {
    if (watcherStore.getState().status === WatcherStatus.STOPPED) {
        return true;
    }

    return false;
}

export function canStartWatcher(): boolean {
    if (
        watcherStore.getState().status === WatcherStatus.INIT ||
        watcherStore.getState().status === WatcherStatus.STOPPED
    ) {
        return true;
    }

    return false;
}

export function canStopWatcher(): boolean {
    if (watcherStore.getState().status === WatcherStatus.RUNNING) {
        return true;
    }

    return false;
}
