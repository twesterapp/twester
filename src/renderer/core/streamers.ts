import { Store } from 'renderer/utils/store';
import { Storage } from 'renderer/utils/storage';
import { logging } from 'renderer/core/logging';
import { rightNowInSecs } from 'renderer/utils/rightNowInSecs';
import { auth } from 'renderer/core/auth';

const NAME = 'STREAMERS';

const log = logging.getLogger(NAME);

export type StreamerLogin = string;
export type StreamerId = string;

// TODO: Clean these messy interfaces/type regarding Streamer
export interface Streamer {
    login: StreamerLogin;
    id: StreamerId;
    displayName: string;
    profileImageUrl: string;
    online?: boolean;
    lastOfflineTime?: number;
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
    | 'currentBalance'
    | 'minutesWatched'
    | 'pointsEarned'
    | 'lastMinuteWatchedEventTime'
>;

interface UpdateStreamer {
    displayName?: string;
    profileImageUrl?: string;
    online?: boolean;
    lastOfflineTime?: number;
    currentBalance?: number;
    minutesWatched?: number;
    pointsEarned?: number;
    watching?: boolean;
    lastMinuteWatchedEventTime?: number;
}

class Streamers extends Store<State> {
    constructor() {
        super(NAME);
        this.initStore(() => this.getInitialState());
    }

    public getAllStreamers(): Streamer[] {
        return this.store.getState().streamers;
    }

    public getOnlineStreamers(): Streamer[] {
        const onlineStreamers: Streamer[] = this.getAllStreamers().filter(
            (streamer) => streamer.online === true
        );

        return onlineStreamers;
    }

    public addStreamer(streamer: NewStreamer) {
        const { getState, setState } = this.store;

        for (let i = 0; i < getState().streamers.length; i += 1) {
            if (getState().streamers[i].id === streamer.id) {
                log.warning(
                    `Skipping to add ${streamer.displayName} because it's already added`
                );

                return setState({
                    streamers: getState().streamers,
                });
            }
        }

        const streamerToAdd: Streamer = {
            ...streamer,
            minutesWatched: 0,
            pointsEarned: 0,
            lastMinuteWatchedEventTime: 0,
        };

        const updated = [...getState().streamers, streamerToAdd];

        setState({ streamers: updated });
        this.syncStateWithStorage();
    }

    public removeStreamer(id: StreamerId) {
        const { getState, setState } = this.store;

        const updated = getState()
            .streamers.filter((streamer) => streamer.id !== id)
            .map((streamer) => {
                return { ...streamer };
            });

        setState({ streamers: updated });
        this.syncStateWithStorage();
    }

    public updateStreamer(id: StreamerId, newValue: UpdateStreamer) {
        const updated = this.store.getState().streamers.map((streamer) => {
            if (streamer.id === id) {
                return {
                    ...streamer,
                    ...newValue,
                };
            }

            return { ...streamer };
        });

        this.store.setState({ streamers: updated });
        this.syncStateWithStorage();
    }

    public getStreamerById(id: StreamerId): Streamer | void {
        for (const streamer of this.store.getState().streamers) {
            if (streamer.id === id) {
                return streamer;
            }
        }
    }

    public getStreamerByLogin(login: StreamerLogin): Streamer | void {
        for (const streamer of this.store.getState().streamers) {
            if (streamer.login === login) {
                return streamer;
            }
        }
    }

    public setOnlineStatus(login: StreamerLogin, online: boolean) {
        const { getState, setState } = this.store;

        const updated: Streamer[] = getState().streamers.map(
            (streamer): Streamer => {
                if (streamer.login === login) {
                    log.info(
                        `${streamer.displayName} (${
                            streamer.currentBalance
                        }) is ${online ? 'Online' : 'Offline'}`
                    );

                    // Setting streamer to `Offline`
                    if (!online) {
                        return {
                            ...streamer,
                            online,
                            lastOfflineTime: rightNowInSecs(),
                            watching: false,
                        };
                    }

                    // Setting streamer to `Online`
                    return {
                        ...streamer,
                        online,
                    };
                }

                return streamer;
            }
        );

        return setState({
            streamers: updated,
        });
    }

    public isOnline(login: StreamerLogin): boolean {
        for (const streamer of this.getAllStreamers()) {
            if (streamer.login === login) {
                if (streamer.online) {
                    return true;
                }
            }
        }

        return false;
    }

    public resetOnlineStatusOfStreamers() {
        const { getState, setState } = this.store;
        const updated = getState().streamers.map((streamer) => ({
            ...streamer,
            online: undefined,
            watching: undefined,
        }));
        setState({ streamers: updated });
    }

    public findStreamerCard(id: StreamerId) {
        const streamer = this.store
            .getState()
            .streamers.filter((streamer) => streamer.id === id)[0];

        return {
            streamer,
            index: this.store.getState().streamers.indexOf(streamer),
        };
    }

    public moveStreamerCard(id: StreamerId, hoverIndex: number) {
        const drag = this.findStreamerCard(id);
        const dragIndex = drag.index;
        const hover = this.store.getState().streamers[hoverIndex];

        const updated = [...this.store.getState().streamers];
        updated[dragIndex] = hover;
        updated[hoverIndex] = drag.streamer;

        this.store.setState({ streamers: updated });
        this.syncStateWithStorage();
    }

    private getStorageKey() {
        return `${auth.store.getState().user.id}.streamers`;
    }

    private getInitialState(): State {
        try {
            const streamers: Streamer[] = JSON.parse(
                Storage.get(this.getStorageKey()) || ''
            );

            log.debug(`Loaded ${this.storeName} state from storage`);
            return { streamers };
        } catch (err) {
            log.error(
                `Failed to load ${this.storeName} state from storage:`,
                err.message
            );
            log.warning(`Setting ${this.storeName} state to default`);

            return { streamers: [] };
        }
    }

    private syncStateWithStorage() {
        // We don't want to store these properties of streamer to Storage.
        // for app state. This one is for persisting to Storage.
        const updatedForPersisting = this.store
            .getState()
            .streamers.map((streamer) => ({
                ...streamer,
                online: undefined,
                lastOfflineTime: undefined,
                currentBalance: undefined,
                watching: undefined,
            }));

        Storage.set(this.getStorageKey(), JSON.stringify(updatedForPersisting));
    }
}

export const streamers = new Streamers();
