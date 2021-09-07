import React from 'react';
import { useStreamerStore } from 'renderer/stores/useStreamerStore';
import {
  useWatcherStore,
  WatcherStatus,
} from 'renderer/stores/useWatcherStore';
import { watcher } from 'renderer/core/watcher';
import { IconPlay, IconStop, Link } from 'renderer/ui';
import { px2em, px2rem } from 'renderer/utils';
import styled, { useTheme } from 'styled-components';
import { Log } from 'renderer/stores/useLoggerStore';

const logs: Log[] = [
  {
    id: '1',
    timestamp: new Date(),
    text: '[TEST_LOG]: This is a test log lmao',
  },
  {
    id: '2',
    timestamp: new Date(),
    text: '[SOME_LOG]: This is a test log again 😂',
  },
];

export function HomePage() {
  const theme = useTheme();
  const { streamers } = useStreamerStore();
  const { status } = useWatcherStore();

  const noStreamersToWatch = streamers.length === 0;

  function isPlayButtonActive(): boolean {
    if (watcher.canStart() && !noStreamersToWatch) return true;
    return false;
  }

  function isStopButtonActive(): boolean {
    if (watcher.canStop()) return true;
    return false;
  }

  function showStopButton(): boolean {
    if (status === WatcherStatus.INIT || status === WatcherStatus.STOPPED) {
      return false;
    }

    return true;
  }

  const RenderPlayButton = () => (
    <IconPlay
      style={{
        cursor: isPlayButtonActive() ? 'pointer' : 'not-allowed',
      }}
      size={64}
      color={isPlayButtonActive() ? theme.color.success : theme.color.disabled}
      onClick={() => isPlayButtonActive() && watcher.start()}
    />
  );

  const RenderStopButton = () => (
    <IconStop
      style={{
        cursor: isStopButtonActive() ? 'pointer' : 'not-allowed',
      }}
      size={64}
      color={isStopButtonActive() ? theme.color.error : theme.color.disabled}
      onClick={() => isStopButtonActive() && watcher.stop()}
    />
  );

  return (
    <PageWrapper>
      {noStreamersToWatch ? (
        <>
          {RenderPlayButton()}
          <HelpMessage>
            Add at least one streamer to{' '}
            <Link to="/watch">“Streamers to watch”</Link> list and hit the play
            button above to start harvesting channel points for you 😎
          </HelpMessage>
        </>
      ) : (
        <Content>
          <LogContainer>
            {logs.map((log) => {
              return (
                <LogText key={log.id}>
                  {log.timestamp.toLocaleDateString()}{' '}
                  {log.timestamp.toLocaleTimeString()} - {log.text}
                </LogText>
              );
            })}
          </LogContainer>

          {showStopButton() ? RenderStopButton() : RenderPlayButton()}
        </Content>
      )}
    </PageWrapper>
  );
}

const Content = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
  margin: 24px 24px;

  @media screen and (min-width: 1080px) {
    max-height: calc(100% - 100px);
    max-width: calc(100% - 100px);
  }
`;

const LogContainer = styled.div`
  background: ${(props) => props.theme.color.background2};
  border: 2px solid ${(props) => props.theme.color.primary};
  box-sizing: border-box;
  padding: ${px2em(16)};
  margin-right: ${px2em(24)};
  border-radius: 12px;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const LogText = styled.p`
  margin: 3px;
`;

const PageWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 800px;
`;

const HelpMessage = styled.p`
  font-family: 'Karla';
  font-size: ${px2rem(16)};
  text-align: center;
  max-width: 480px;
`;
