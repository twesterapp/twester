import {
    NewStreamerPayload,
    OnlineStatus,
    Streamer,
    StreamerId,
    StreamerLogin,
    StreamerPayload,
    UpdateStreamerPayload,
} from './streamer';

import { Core } from './core';
import { Storage } from '../utils/storage';
import { Store } from '../utils/store';
import { logging } from './logging';

const NAME = 'STREAMERS';

const log = logging.getLogger(NAME);

interface State {
    streamers: StreamerPayload[];
}

export class StreamerManager extends Store<State> {
    private streamers: Streamer[];

    private core: Core;

    constructor(core: Core) {
        super(NAME);
        this.core = core;
        this.initStore(() => this.getInitialState());
        this.streamers = this.store
            .getState()
            .streamers.map((streamer) => new Streamer(streamer));
    }

    public all(): Streamer[] {
        return this.streamers;
    }

    public online(): Streamer[] {
        return this.streamers.filter(
            (streamer) => streamer.onlineStatus === OnlineStatus.ONLINE
        );
    }

    public add(payload: NewStreamerPayload): void {
        for (const streamer of this.streamers) {
            if (streamer.id === payload.id) {
                log.warning(
                    `Skipping to add ${payload.displayName} because this streamer is already added.`
                );

                return;
            }
        }

        const streamerToAdd: StreamerPayload = {
            ...payload,
            minutesWatched: 0,
            pointsEarned: 0,
            lastMinuteWatchedEventTime: 0,
        };

        this.streamers.push(new Streamer(streamerToAdd));
        this.onStreamersUpdate();
    }

    public remove(id: StreamerId): void {
        this.streamers = this.streamers.filter(
            (streamer) => streamer.id !== id
        );
        this.onStreamersUpdate();
    }

    public update(id: StreamerId, payload: UpdateStreamerPayload): void {
        this.getById(id).update(payload);
        this.onStreamersUpdate();
    }

    public getById(id: StreamerId): Streamer {
        for (const streamer of this.streamers) {
            if (streamer.id === id) {
                return streamer;
            }
        }

        throw new Error(`StreamerManager: No streamer found wih id ${id}.`);
    }

    public getByLogin(login: StreamerLogin): Streamer {
        for (const streamer of this.streamers) {
            if (streamer.login === login) {
                return streamer;
            }
        }

        throw new Error(
            `StreamerManager: No streamer found wih login ${login}.`
        );
    }

    public setStreamerOnlineStatus(
        login: StreamerLogin,
        status: OnlineStatus
    ): void {
        this.getByLogin(login).setOnlineStatus(status, true);
        this.onStreamersUpdate();
    }

    public isStreamerOnline(login: StreamerLogin): boolean {
        return this.getByLogin(login).isOnline();
    }

    public resetOnlineStatusOfAllStreamers(): void {
        this.streamers.forEach((streamer) => {
            streamer.setOnlineStatus(OnlineStatus.OFFLINE, false);
        });

        this.onStreamersUpdate();
    }

    public findStreamerCard(id: StreamerId): {
        streamer: Streamer;
        index: number;
    } {
        const streamer = this.getById(id);

        return {
            streamer,
            index: this.streamers.indexOf(streamer),
        };
    }

    public moveStreamerCard(id: StreamerId, hoverIndex: number): void {
        const drag = this.findStreamerCard(id);

        if (drag) {
            const dragIndex = drag.index;
            const hover = this.streamers[hoverIndex];

            this.streamers[dragIndex] = hover;
            this.streamers[hoverIndex] = drag.streamer;

            this.onStreamersUpdate();
        }
    }

    private getStorageKey(): string {
        return `${this.core.auth.store.getState().user.id}.streamers`;
    }

    private getInitialState(): State {
        try {
            const streamers: StreamerPayload[] = JSON.parse(
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

    private syncStorageWithStore(): void {
        // We don't want to store some state of streamer to Storage.
        const updatedForPersisting: StreamerPayload[] = this.store
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

    private syncStoreWithStreamers(): void {
        const streamers: StreamerPayload[] = this.streamers;
        this.store.setState({ streamers });
    }

    private onStreamersUpdate(): void {
        this.syncStoreWithStreamers();
        this.syncStorageWithStore();
    }
}
