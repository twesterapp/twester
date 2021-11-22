import { Stream } from './stream';
import { StreamerIsOfflineError } from './errors';
import { logging } from './logging';
import { rightNowInSecs } from '../utils/rightNowInSecs';

const log = logging.getLogger('STREAMER');

export enum OnlineStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
}

export type StreamerLogin = string;
export type StreamerId = string;

export interface NewStreamerPayload {
    displayName: string;
    id: StreamerId;
    lastOfflineTime?: number;
    login: StreamerLogin;
    profileImageUrl: string;
    watching?: boolean;
}

export interface StreamerPayload extends NewStreamerPayload {
    currentBalance?: number;
    lastMinuteWatchedEventTime: number; // epoch in secs
    minutesWatched: number;
    onlineStatus?: OnlineStatus;
    pointsEarned: number;
}

// Can update anything in the `StreamerPayload` except `login` and `id`.
export interface UpdateStreamerPayload
    extends Partial<Omit<StreamerPayload, 'login' | 'id'>> {}

export class Streamer implements StreamerPayload {
    public login: string;

    public id: string;

    public displayName: string;

    public profileImageUrl: string;

    public onlineStatus: OnlineStatus;

    public lastOfflineTime: number;

    public currentBalance: number;

    public watching: boolean;

    public lastMinuteWatchedEventTime: number;

    public minutesWatched: number;

    public pointsEarned: number;

    public stream: Stream | null;

    constructor(payload: StreamerPayload) {
        this.login = payload.login;
        this.id = payload.id;
        this.displayName = payload.displayName;
        this.profileImageUrl = payload.profileImageUrl;
        this.onlineStatus = payload.onlineStatus || OnlineStatus.OFFLINE;
        this.lastOfflineTime = payload.lastOfflineTime || 0;
        this.currentBalance = payload.currentBalance || 0;
        this.watching = payload.watching || false;
        this.lastMinuteWatchedEventTime = payload.lastMinuteWatchedEventTime;
        this.minutesWatched = payload.minutesWatched;
        this.pointsEarned = payload.pointsEarned;
        this.stream = null;
    }

    public setOnlineStatus(status: OnlineStatus, printInfoLog: boolean): void {
        // We don't want to print the `is Offline` info log when we call
        // `StreamerManager.resetOnlineStatusOfAllStreamers()`, which sets the
        // `status` to `OnlineStatus.OFFLINE`.
        if (printInfoLog) {
            log.info(
                `${this.displayName} (${this.currentBalance}) is ${
                    status === OnlineStatus.ONLINE ? 'Online' : 'Offline'
                }`
            );
        }

        if (status === OnlineStatus.OFFLINE) {
            this.update({
                onlineStatus: status,
                lastOfflineTime: rightNowInSecs(),
                watching: false,
            });
        } else {
            this.update({
                onlineStatus: status,
            });
        }
    }

    public isOnline(): boolean {
        if (this.onlineStatus === OnlineStatus.ONLINE) {
            return true;
        }

        return false;
    }

    public update(payload: UpdateStreamerPayload): void {
        if (payload.displayName) {
            this.displayName = payload.displayName;
        }

        if (payload.profileImageUrl) {
            this.profileImageUrl = payload.profileImageUrl;
        }

        if (payload.onlineStatus) {
            this.onlineStatus = payload.onlineStatus;
        }

        if (typeof payload.lastOfflineTime === 'number') {
            this.lastOfflineTime = payload.lastOfflineTime;
        }

        if (typeof payload.currentBalance === 'number') {
            this.currentBalance = payload.currentBalance;
        }

        if (payload.minutesWatched) {
            this.minutesWatched = payload.minutesWatched;
        }

        if (payload.pointsEarned) {
            this.pointsEarned = payload.pointsEarned;
        }

        if (typeof payload.watching === 'boolean') {
            this.watching = payload.watching;
        }

        if (payload.lastMinuteWatchedEventTime) {
            this.lastMinuteWatchedEventTime =
                payload.lastMinuteWatchedEventTime;
        }
    }

    public async checkOnlineStatus(): Promise<void> {
        // Twitch API has a delay for querying channels. If a query is made
        // right after the streamer went offline, it will cause a false
        // "streamer is live" event.
        if (rightNowInSecs() < this.lastOfflineTime + 60) {
            return;
        }

        if (!this.isOnline()) {
            try {
                this.stream = await Stream.init(this);
                this.setOnlineStatus(OnlineStatus.ONLINE, true);
            } catch (err) {
                if (err instanceof StreamerIsOfflineError) {
                    this.stream = null;
                    this.setOnlineStatus(OnlineStatus.OFFLINE, true);
                }
            }
        }
    }
}
