import React from 'react';
import { fetchChannelFollowers, fetchChannelInfo } from 'renderer/api';
import { useStreamerStore } from 'renderer/stores/useStreamerStore';
import { Button, IconPlus, InputText } from 'renderer/ui';
import { px2em } from 'renderer/utils';
import styled from 'styled-components';

export function WatchPage() {
  const [searchText, setSearchText] = React.useState('');
  const [fetchingStreamer, setFetchingStreamer] = React.useState(false);
  const { add } = useStreamerStore();

  async function handleAddStreamer() {
    try {
      setFetchingStreamer(true);

      const result = await fetchChannelInfo(searchText.trim());
      if (!result.data.data.length) {
        console.error(`No streamer found with ${searchText}`);
      }
      const info = result.data.data[0];
      const followersResult = await fetchChannelFollowers(info.id);
      console.log(followersResult);

      add({
        id: info.id,
        login: info.login,
        displayName: info.display_name,
        profileImageUrl: info.profile_image_url,
        followersCount: followersResult.data.total,
      });
      setFetchingStreamer(false);
      setSearchText('');
    } catch (e) {
      console.log(e);
      console.error('Failed to fetch channel info');
      setFetchingStreamer(false);
    }
  }

  return (
    <PageWrapper>
      <Search>
        <InputText
          style={{ marginRight: `${px2em(12)}`, width: '300px' }}
          placeholder="Streamer to add"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button
          width="46px"
          onClick={handleAddStreamer}
          loading={fetchingStreamer}
          disabled={!searchText.trim()}
        >
          <IconPlus />
        </Button>
      </Search>
    </PageWrapper>
  );
}

const Search = styled.div`
  margin-top: ${px2em(44)};
  height: 46px;
  display: flex;
`;

const PageWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
