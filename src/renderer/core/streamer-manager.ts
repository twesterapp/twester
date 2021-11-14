import {
    IStreamer,
    NewStreamerPayload,
    OnlineStatus,
    Streamer,
    StreamerId,
    StreamerLogin,
    UpdateStreamerPayload,
} from './streamer';

import { Storage } from '../utils/storage';
import { Store } from '../utils/store';
import { auth } from './auth';
import { logging } from './logging';

const NAME = 'STREAMERS';

const log = logging.getLogger(NAME);

interface State {
    streamers: IStreamer[];
}

export class StreamerManager extends Store<State> {
    private streamers: Streamer[];

    constructor() {
        super(NAME);
        this.initStore(() => this.getInitialState());
        this.streamers = this.store
            .getState()
            .streamers.map((streamer) => new Streamer(streamer));
    }

    public getAllStreamers(): Streamer[] {
        return this.streamers;
    }

    public getAllStreamersOnline(): Streamer[] {
        return this.getAllStreamers().filter(
            (streamer) => streamer.onlineStatus === OnlineStatus.ONLINE
        );
    }

    public addStreamer(payload: NewStreamerPayload) {
        for (const streamer of this.streamers) {
            if (streamer.id === payload.id) {
                log.warning(
                    `Skipping to add ${payload.displayName} because this streamer is already added.`
                );

                return;
            }
        }

        const streamerToAdd: IStreamer = {
            ...payload,
            minutesWatched: 0,
            pointsEarned: 0,
            lastMinuteWatchedEventTime: 0,
        };

        this.streamers.push(new Streamer(streamerToAdd));
        this.onStreamersUpdate();
    }

    public removeStreamer(id: StreamerId) {
        this.streamers = this.streamers.filter(
            (streamer) => streamer.id !== id
        );
        this.onStreamersUpdate();
    }

    public updateStreamer(id: StreamerId, payload: UpdateStreamerPayload) {
        const streamer = this.getStreamerById(id);

        if (streamer) {
            streamer.update(payload);
            this.onStreamersUpdate();
        }
    }

    public getStreamerById(id: StreamerId): Streamer | void {
        for (const streamer of this.streamers) {
            if (streamer.id === id) {
                return streamer;
            }
        }
    }

    public getStreamerByLogin(login: StreamerLogin): Streamer | void {
        for (const streamer of this.streamers) {
            if (streamer.login === login) {
                return streamer;
            }
        }
    }

    public setStreamerOnlineStatus(login: StreamerLogin, status: OnlineStatus) {
        const streamer = this.getStreamerByLogin(login);

        if (streamer) {
            streamer.setOnlineStatus(status);
            this.onStreamersUpdate();
        }
    }

    public isStreamerOnline(login: StreamerLogin): boolean {
        const streamer = this.getStreamerByLogin(login);

        if (streamer) {
            return streamer.isOnline();
        }

        throw new Error(`No streamer found wih login: ${login}`);
    }

    public resetOnlineStatusOfAllStreamers() {
        this.streamers.forEach((streamer) => {
            streamer.setOnlineStatus(OnlineStatus.OFFLINE);
        });

        this.onStreamersUpdate();
    }

    public findStreamerCard(
        id: StreamerId
    ): { streamer: Streamer; index: number } | void {
        const streamer = this.getStreamerById(id);

        if (streamer) {
            return {
                streamer,
                index: this.streamers.indexOf(streamer),
            };
        }

        log.exception(`No streamer card found with streamer id: ${id}.`);
    }

    public moveStreamerCard(id: StreamerId, hoverIndex: number) {
        const drag = this.findStreamerCard(id);

        if (drag) {
            const dragIndex = drag.index;
            const hover = this.streamers[hoverIndex];

            this.streamers[dragIndex] = hover;
            this.streamers[hoverIndex] = drag.streamer;

            this.onStreamersUpdate();
        }
    }

    private getStorageKey() {
        return `${auth.store.getState().user.id}.streamers`;
    }

    private getInitialState(): State {
        try {
            const streamers: IStreamer[] = JSON.parse(
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

    private syncStorageWithStore() {
        // We don't want to store these properties of streamer to Storage.
        // for app state. This one is for persisting to Storage.
        const updatedForPersisting = this.store
            .getState()
            .streamers.map((streamer) => ({
                ...streamer,
                onlineStatus: OnlineStatus.OFFLINE,
                lastOfflineTime: 0,
                currentBalance: 0,
                watching: false,
            }));

        Storage.set(this.getStorageKey(), JSON.stringify(updatedForPersisting));
    }

    private syncStoreWithStreamers() {
        const streamers: IStreamer[] = this.streamers;
        this.store.setState({ streamers });
    }

    private onStreamersUpdate() {
        this.syncStoreWithStreamers();
        this.syncStorageWithStore();
    }
}
