import { Streamer } from './streamer';
import { api } from './api';
import { logging } from './logging';
import { streamers } from './streamer-manager';

const log = logging.getLogger('BONUS');

export class ChannelPoints {
    public static async claimBonus(
        streamer: Streamer,
        claimId: string
    ): Promise<void> {
        const displayName = streamer.displayName;
        log.debug(`Claiming bonus for ${displayName}`);
        api.claimChannelPointsBonus(streamer.id, claimId);
    }

    public static async loadContext(): Promise<void> {
        for (const streamer of streamers.all()) {
            const response = await api.getChannelPointsContext(streamer.login);

            if (!response.data.community) {
                log.error(
                    `No streamer found with login: ${streamer.login}. This should only happen if the streamer changed their "login" since the last time you used Twester.`
                );
            }

            const communityPoints =
                response.data.community.channel.self.communityPoints;
            const initialBalance = communityPoints.balance;
            streamers.update(streamer.id, {
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
