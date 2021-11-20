import { StreamerLogin } from './streamer';
import { core } from './core';
import { logging } from './logging';
import { makeGraphqlRequest } from '../api';

const log = logging.getLogger('BONUS');

export class ChannelPoints {
    public static async claimBonus(
        login: StreamerLogin,
        claimId: string
    ): Promise<void> {
        const streamer = core.streamers.getByLogin(login);
        const displayName = streamer ? streamer.displayName : login;
        log.debug(`Claming bonus for ${displayName}`);

        const data = {
            operationName: 'ClaimCommunityPoints',
            variables: {
                input: {
                    channelID: streamer.id,
                    claimID: claimId,
                },
            },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash:
                        '46aaeebe02c99afdf4fc97c7c0cba964124bf6b0af229395f1f6d1feed05b3d0',
                },
            },
        };

        makeGraphqlRequest(data);
    }

    public static async loadContext(): Promise<void> {
        for (const streamer of core.streamers.all()) {
            const data = {
                operationName: 'ChannelPointsContext',
                variables: { channelLogin: streamer.login },
                extensions: {
                    persistedQuery: {
                        version: 1,
                        sha256Hash:
                            '9988086babc615a918a1e9a722ff41d98847acac822645209ac7379eecb27152',
                    },
                },
            };

            const response = await makeGraphqlRequest(data);

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
                this.claimBonus(streamer.login, claimId);
            }
        }
    }
}
