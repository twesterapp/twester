import { Streamer } from './streamer';
import { core } from './core';
import { logging } from './logging';

const log = logging.getLogger('BONUS');

export class ChannelPoints {
    public static async claimBonus(
        streamer: Streamer,
        claimId: string
    ): Promise<void> {
        const displayName = streamer.displayName;
        log.debug(`Claiming bonus for ${displayName}`);
        core.api.claimChannelPointsBonus(streamer.id, claimId);
    }

    public static async loadContext(): Promise<void> {
        for (const streamer of core.streamers.all()) {
            const response = await core.api.getChannelPointsContext(
                streamer.login
            );

            if (!response.data.community) {
                log.error(
                    `No streamer found with login: ${streamer.login}. This should only happen if the streamer changed their "login" since the last time you used Twester.`
                );
            }

            const communityPoints =
                response.data.community.channel.self.communityPoints;
            const initialBalance = communityPoints.balance;
            core.streamers.update(streamer.id, {
                currentBalance: initialBalance,
            });

            const availableClaim = communityPoints.availableClaim;
            if (availableClaim) {
                const claimId = availableClaim.id;
                this.claimBonus(streamer, claimId);
            }
        }
    }
}
