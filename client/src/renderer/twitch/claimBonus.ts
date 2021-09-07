import { makeGraphqlRequest } from 'renderer/api';
import { Streamer, StreamerLogin } from 'renderer/stores/useStreamerStore';
// eslint-disable-next-line import/no-cycle
import { getChannelId } from './data';

export async function claimChannelPointsBonus(
  login: StreamerLogin,
  claimId: string
) {
  console.info(`Claming bonus for ${login}`);

  const data = {
    operationName: 'ClaimCommunityPoints',
    variables: {
      input: { channelID: await getChannelId(login), claimID: claimId },
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

export async function loadChannelPointsContext(streamer: Streamer) {
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
    console.error('Streamer does not exist');
  }

  const communityPoints = response.data.community.channel.self.communityPoints;
  const initialBalance = communityPoints.balance;
  console.info(`${initialBalance} channel points for ${streamer.displayName}!`);

  const availableClaim = communityPoints.availableClaim;
  if (availableClaim) {
    const claimId = availableClaim.id;
    claimChannelPointsBonus(streamer.login, claimId);
  }
}
