import { makeGraphqlRequest } from 'renderer/api';

async function loadChannelPointsContext(streamerLogin: string) {
  const data = {
    operationName: 'ChannelPointsContext',
    variables: { channelLogin: streamerLogin },
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
}
