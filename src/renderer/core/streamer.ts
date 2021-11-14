import { logging } from './logging';
import { rightNowInSecs } from '../utils/rightNowInSecs';

const NAME = 'STREAMER';

const log = logging.getLogger(NAME);

export enum OnlineStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
}

export type StreamerLogin = string;
export type StreamerId = string;

// TODO: Clean these messy interfaces/type regarding Streamer
export interface StreamerData {
    login: StreamerLogin;
    id: StreamerId;
    displayName: string;
    profileImageUrl: string;
    onlineStatus?: OnlineStatus;
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

export type NewStreamerPayload = Omit<
    StreamerData,
    | 'onlineStatus'
    | 'lastOfflineTime'
    | 'currentBalance'
    | 'minutesWatched'
    | 'pointsEarned'
    | 'lastMinuteWatchedEventTime'
>;

export interface UpdateStreamerPayload {
    displayName?: string;
    profileImageUrl?: string;
    onlineStatus?: OnlineStatus;
    lastOfflineTime?: number;
    currentBalance?: number;
    minutesWatched?: number;
    pointsEarned?: number;
    watching?: boolean;
    lastMinuteWatchedEventTime?: number;
}

export class Streamer implements StreamerData {
    login: string;

    id: string;

    displayName: string;

    profileImageUrl: string;

    onlineStatus: OnlineStatus;

    lastOfflineTime: number;

    currentBalance: number;

    watching: boolean;

    lastMinuteWatchedEventTime: number;

    minutesWatched: number;

    pointsEarned: number;

    constructor(payload: StreamerData) {
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
    }

    public setOnlineStatus(status: OnlineStatus): void {
        log.info(
            `${this.displayName} (${this.currentBalance}) is ${
                status === OnlineStatus.ONLINE ? 'Online' : 'Offline'
            }`
        );

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
}
