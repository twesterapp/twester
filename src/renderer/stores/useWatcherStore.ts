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

interface State {
    status: WatcherStatus;
    minutesWatched: number;
    pointsEarned: number;
}

type SavedState = Omit<State, 'status'>;

function getInitialState(): State {
    try {
        const savedState: SavedState = JSON.parse(
            localStorage.getItem('watcher-state') || ''
        );

        return {
            ...savedState,
            status: WatcherStatus.INIT,
        };
    } catch {
        return {
            status: WatcherStatus.INIT,
            minutesWatched: 0,
            pointsEarned: 0,
        };
    }
}

export const watcherStore = vanillaCreate(() => getInitialState());

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

// This is NOT same as `!canStopWatcher()`
export function canStartWatcher(): boolean {
    if (
        watcherStore.getState().status === WatcherStatus.INIT ||
        watcherStore.getState().status === WatcherStatus.STOPPED
    ) {
        return true;
    }

    return false;
}

// This is NOT same as `!canStartWatcher()`
export function canStopWatcher(): boolean {
    if (watcherStore.getState().status === WatcherStatus.RUNNING) {
        return true;
    }

    return false;
}

export function addPointsEarned(points: number) {
    const { getState, setState } = watcherStore;
    setState({ pointsEarned: getState().pointsEarned + points });
    syncStateWithStorage();
}

export function incrementMinutesWatched() {
    const { getState, setState } = watcherStore;
    setState({ minutesWatched: (getState().minutesWatched += 1) });
    syncStateWithStorage();
}

function syncStateWithStorage() {
    const state: SavedState = {
        minutesWatched: watcherStore.getState().minutesWatched,
        pointsEarned: watcherStore.getState().pointsEarned,
    };
    localStorage.setItem('watcher-state', JSON.stringify(state));
}
