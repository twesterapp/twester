import React from 'react';
import { fetchChannelFollowers, fetchChannelInfo } from 'renderer/api';
import { StreamerCard } from 'renderer/components';
import {
  useStreamerStore,
  addStreamer,
} from 'renderer/stores/useStreamerStore';
import { Button, IconPlus, InputText } from 'renderer/ui';
import { px2em } from 'renderer/utils';
import styled from 'styled-components';

export function WatchPage() {
  const [searchText, setSearchText] = React.useState('');
  const [fetchingStreamer, setFetchingStreamer] = React.useState(false);
  const { streamers } = useStreamerStore();

  async function handleAddStreamer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setFetchingStreamer(true);

      const result = await fetchChannelInfo(searchText.trim());
      if (!result.data.data.length) {
        console.error(`No streamer found with ${searchText}`);
      }
      const info = result.data.data[0];
      const followersResult = await fetchChannelFollowers(info.id);

      addStreamer({
        id: info.id,
        login: info.login,
        displayName: info.display_name,
        profileImageUrl: info.profile_image_url,
        followersCount: followersResult.data.total,
      });
      setFetchingStreamer(false);
      setSearchText('');
    } catch {
      console.error('Failed to fetch channel info');
      setFetchingStreamer(false);
    }
  }

  return (
    <PageWrapper>
      <Search onSubmit={handleAddStreamer}>
        <InputText
          style={{ marginRight: `${px2em(12)}`, width: '300px' }}
          placeholder="Streamer to add"
          value={searchText}
          disabled={fetchingStreamer}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button
          width="46px"
          variant="submit"
          loading={fetchingStreamer}
          disabled={!searchText.trim()}
        >
          <IconPlus />
        </Button>
      </Search>
      <Info>
        Streamers will be prioritized top to bottom.
        <br />
        You can re-order them by drag and drop.
      </Info>

      {streamers.length > 0 &&
        streamers.map((streamer) => {
          return <StreamerCard key={streamer.id} streamer={streamer} />;
        })}
    </PageWrapper>
  );
}

const Search = styled.form`
  margin-top: ${px2em(44)};
  height: 46px;
  display: flex;
  margin-bottom: ${px2em(22)};
`;

const Info = styled.p`
  font-family: Karla;
  color: ${(props) => props.theme.color.textPrimary};
  line-height: ${px2em(18)};
  margin: 0;
  margin-bottom: ${px2em(44)};
  max-width: 430px;
  text-align: center;
`;

const PageWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
