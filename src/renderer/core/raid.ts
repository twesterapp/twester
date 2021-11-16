import { Streamer, StreamerLogin } from './streamer';

import { logging } from './logging';
import { makeGraphqlRequest } from '../api';

const NAME = 'RAID';
const log = logging.getLogger(NAME);

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

    constructor(id: RaidId, loginToRaid: StreamerLogin, raidedBy: Streamer) {
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

        const data = {
            operationName: 'JoinRaid',
            variables: { input: { raidID: this.id } },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash:
                        'c6a332a86d1087fbbb1a8623aa01bd1313d2386e7c63be60fdb2d1901f01a4ae',
                },
            },
        };

        makeGraphqlRequest(data);
        log.info(
            `Joining raid from ${this.gettingRaidedBy.displayName} to ${this.loginToRaid}!`
        );
    }
}
