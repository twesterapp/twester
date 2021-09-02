import { oauthClient, fetchChannelInfo } from 'renderer/api';

function makeGqlRequest(
  data: Record<string, any>
): Record<string, any> | undefined {
  console.info('Making Twitch GraphQL request');

  return oauthClient({ method: 'POST', url: 'https://gql.twitch.tv/gql', data })
    .then((res) => {
      const data = res.data;
      console.info('Res from gql', data);
      return data;
    })
    .catch((e) => {
      console.error('Twitch GraphQL request error: \n', e);
    });
}

export async function claimChannelPointsBonus(
  streamerLogin: string,
  claimId: string
) {
  console.info(`Claming bonus for ${streamerLogin}`);
  const data = {
    operationName: 'ClaimCommunityPoints',
    variables: {
      input: { channelID: await getChannelId(streamerLogin), claimID: claimId },
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash:
          '46aaeebe02c99afdf4fc97c7c0cba964124bf6b0af229395f1f6d1feed05b3d0',
      },
    },
  };

  makeGqlRequest(data);
}

async function getChannelId(streamerLogin: string): Promise<string> {
  return fetchChannelInfo(streamerLogin)
    .then((res) => {
      const id = res.data.data[0].id;
      console.info(`Channel id for ${streamerLogin} is`, id);
      return id;
    })
    .catch((e) => console.error('Error: ', e));
}
