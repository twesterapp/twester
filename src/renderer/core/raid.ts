import { Streamer, StreamerLogin } from './streamer';

import { Core } from './core';
import { logging } from './logging';

const log = logging.getLogger('RAID');

type RaidId = string;

// When a streamer raids another streamer, the Twitch PubSub
// recieves multiple messages for that given raid.
// In order to not make multiple instances of `Raid` for the
// same raid, we will make use of this map to store the `Raid`
// instances for a given `raidId` and return that `Raid` instance
// if it exists otherwise make a new `Raid` instance.
const raids: Map<RaidId, Raid> = new Map<string, Raid>();

export class Raid {
    readonly id: RaidId;

    readonly loginToRaid: StreamerLogin;

    readonly gettingRaidedBy: Streamer;

    private joinedRaid: boolean;

    private core: Core;

    constructor(
        core: Core,
        id: RaidId,
        loginToRaid: StreamerLogin,
        raidedBy: Streamer
    ) {
        this.core = core;
        this.id = id;
        this.loginToRaid = loginToRaid;
        this.gettingRaidedBy = raidedBy;
        this.joinedRaid = false;

        const raid = raids.get(id);

        if (raid) {
            return raid;
        }

        raids.set(id, this);
    }

    public joinRaid(): void {
        if (this.joinedRaid) {
            return;
        }

        this.joinedRaid = true;
        this.core.api.joinRaid(this.id);
        log.info(
            `Joining raid from ${this.gettingRaidedBy.displayName} to ${this.loginToRaid}!`
        );
    }
}
