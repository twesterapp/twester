import React from 'react';
import { useStreamerStore } from 'renderer/stores/useStreamerStore';
import { IconPlay, Link } from 'renderer/ui';
import { px2rem } from 'renderer/utils';
import styled, { useTheme } from 'styled-components';

export function HomePage() {
  const theme = useTheme();
  const { streamers } = useStreamerStore();
  const noStreamers = streamers.length === 0;

  return (
    <PageWrapper>
      <Content>
        <IconPlay
          style={{ cursor: noStreamers ? 'not-allowed' : 'pointer' }}
          size={64}
          color={noStreamers ? theme.color.disabled : theme.color.success}
        />
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
