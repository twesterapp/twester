import vanillaCreate from 'zustand/vanilla';
import create from 'zustand';
import { rightNowInSecs } from 'renderer/utils';
import { authStore } from './useAuthStore';
import { Logger } from './useLoggerStore';

const logger = new Logger({ prefix: 'STREAMER' });

export type StreamerLogin = string;
export type StreamerId = string;

// TODO: Clean these messy interfaces/type regarding Streamer
export interface Streamer {
    login: StreamerLogin;
    priorityRank: number;
    id: StreamerId;
    displayName: string;
    profileImageUrl: string;
    /**
     * @deprecated We no longer show this on the Streamer Card.
     */
    followersCount: string;
    online?: boolean;
    lastOfflineTime?: number;
    // Channel points for the streamer when the watcher session was started.
    startingBalance?: number;
    // Channel points for the streamer at the current time of the watcher session.
    currentBalance?: number;
    // Is this streamer being watched by the `watcher`.
    watching?: boolean;
    // This helps us from incrementing `minutesWatched` if the user keeps
    // pausing and playing the Watcher. This can lead to minuteWatched value to
    // be wrong. Check it's usage in `watcher.ts`.
    lastMinuteWatchedEventTime: number; // epoch in secs
    minutesWatched: number;
    pointsEarned: number;
}

interface State {
    streamers: Streamer[];
}

type NewStreamer = Omit<
    Streamer,
    | 'online'
    | 'lastOfflineTime'
    | 'priorityRank'
    | 'startingBalance'
    | 'currentBalance'
    | 'minutesWatched'
    | 'pointsEarned'
    | 'lastMinuteWatchedEventTime'
>;

interface UpdateStreamer {
    displayName?: string;
    profileImageUrl?: string;
    followersCount?: string;
    online?: boolean;
    lastOfflineTime?: number;
    startingBalance?: number;
    currentBalance?: number;
    minutesWatched?: number;
    pointsEarned?: number;
    watching?: boolean;
    lastMinuteWatchedEventTime?: number;
}

const getStorageKey = () => `${authStore.getState().user.id}.streamers`;

console.log({ key: getStorageKey() });

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

export function clearStreamers() {
    streamerStore.setState({ streamers: [] });
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

    const streamerToAdd: Streamer = {
        ...streamer,
        priorityRank: getState().streamers.length + 1,
        minutesWatched: 0,
        pointsEarned: 0,
        lastMinuteWatchedEventTime: 0,
    };

    const updated = [...getState().streamers, streamerToAdd];

    try {
        localStorage.setItem(getStorageKey(), JSON.stringify(updated));
    } catch {}

    return setState({
        streamers: updated,
    });
}

export function getStreamerById(id: StreamerId): Streamer | void {
    for (const streamer of streamerStore.getState().streamers) {
        if (streamer.id === id) {
            return streamer;
        }
    }
}

export function getStreamerByLogin(login: StreamerLogin): Streamer | void {
    for (const streamer of streamerStore.getState().streamers) {
        if (streamer.login === login) {
            return streamer;
        }
    }
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
                ...newValue,
            };
        }

        return { ...streamer };
    });

    // We don't want to store these keys to storage. The `updated` array is for
    // app state. This one is for persisting to localStorage.
    const updatedForPersisting = updated.map((streamer) => ({
        ...streamer,
        online: undefined,
        lastOfflineTime: undefined,
        startingBalance: undefined,
        currentBalance: undefined,
        watching: undefined,
    }));

    try {
        localStorage.setItem(
            getStorageKey(),
            JSON.stringify(updatedForPersisting)
        );
    } catch {}

    return setState({
        streamers: updated,
    });
}

export function setOnlineStatus(login: StreamerLogin, status: boolean) {
    const { getState, setState } = streamerStore;

    const updated: Streamer[] = getState().streamers.map(
        (streamer): Streamer => {
            if (streamer.login === login) {
                logger.info(
                    `${streamer.displayName} (${streamer.startingBalance}) is ${
                        status ? 'Online' : 'Offline'
                    }!`
                );

                // Setting streamer to `Offline`
                if (!status) {
                    return {
                        ...streamer,
                        online: status,
                        lastOfflineTime: rightNowInSecs(),
                        watching: false,
                    };
                }

                // Setting streamer to `Online`
                return {
                    ...streamer,
                    online: status,
                };
            }

            return streamer;
        }
    );

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
    const { getState, setState } = streamerStore;
    const updated = getState().streamers.map((streamer) => ({
        ...streamer,
        online: undefined,
        watching: undefined,
    }));
    setState({ streamers: updated });
}
