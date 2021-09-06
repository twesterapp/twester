import React from 'react';
import { useStreamerStore } from 'renderer/stores/useStreamerStore';
import { useWatcherStore, setWatching } from 'renderer/stores/useWatcherStore';
import { startWatching, stopWatching } from 'renderer/twitch/graphql';
import { IconPlay, IconStop, Link } from 'renderer/ui';
import { px2rem } from 'renderer/utils';
import styled, { useTheme } from 'styled-components';

export function HomePage() {
  const theme = useTheme();
  const { streamers } = useStreamerStore();
  const { isWatching } = useWatcherStore();

  // FIXME: After logging in we should not do `window.location.reload()`
  // because of that the react state is not loaded correctly. Example, HomePage
  // thinks there are no streamers in `Streamers to watch` list and hence
  // `noStreamers` comes out to be `true` which is wrong. Athough a second
  // manual refresh fixes it.
  const noStreamers = streamers.length === 0;

  React.useEffect(() => {
    console.log({ isWatching });
  }, [isWatching]);

  return (
    <PageWrapper>
      <Content>
        {isWatching ? (
          <IconStop
            style={{ cursor: 'pointer' }}
            size={64}
            color={theme.color.error}
            onClick={() => stopWatching()}
          />
        ) : (
          <IconPlay
            style={{ cursor: noStreamers ? 'not-allowed' : 'pointer' }}
            size={64}
            color={noStreamers ? theme.color.disabled : theme.color.success}
            onClick={() => startWatching()}
          />
        )}
        {noStreamers && (
          <p>
            Add at least one streamer to{' '}
            <Link to="/watch">“Streamers to watch”</Link> list and hit the play
            button above to start harvesting channel points for you 😎
          </p>
        )}
      </Content>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 480px;
  font-family: 'Karla';
  font-size: ${px2rem(16)};
  text-align: center;
`;
