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
import { useLoggerStore } from 'renderer/stores/useLoggerStore';

export function HomePage() {
  const theme = useTheme();
  const { streamers } = useStreamerStore();
  const { status } = useWatcherStore();
  const { logs } = useLoggerStore();
  const logsEndRef = React.useRef<HTMLDivElement>(null);

  // For the initial mounting we don't want to animate(`smooth`) the scroll.
  // It will be annoying to see the scroll animation whenever user comes on
  // HomePage.
  React.useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  // After the initial mounting we want to animate(`smooth`) the scroll whenever
  // logs change(new logs are added).
  React.useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const noStreamersToWatch = streamers.length === 0;

  function isPlayButtonActive(): boolean {
    if (watcher.canStart() && !noStreamersToWatch) {
      return true;
    }

    return false;
  }

  function isStopButtonActive(): boolean {
    if (watcher.canStop()) {
      return true;
    }

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
            {logs.length > 0 &&
              logs.map((log) => {
                return (
                  <LogText key={log.id}>
                    {log.timestamp.toLocaleDateString()}{' '}
                    {log.timestamp.toLocaleTimeString()} - {log.text}
                  </LogText>
                );
              })}
            <div ref={logsEndRef} />
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
    max-height: calc(100vh - 100px);
    max-width: calc(100% - 100px);
  }
`;

const LogContainer = styled.div`
  background: ${(props) => props.theme.color.background2};
  border: 1px solid ${(props) => props.theme.color.primary};
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
  box-sizing: border-box;
  padding: ${() => `${px2em(6)} ${px2em(12)}`};
  margin-right: ${px2em(24)};
  height: calc(100vh - 100px);
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: scroll;

  &::-webkit-scrollbar {
    width: 0.69rem;
    height: 0.69em;
  }

  &::-webkit-scrollbar-track {
    background: ${(props) => props.theme.color.background};
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.color.background4};
  }
`;

const LogText = styled.p`
  font-family: 'Roboto Mono';
  font-size: ${px2rem(14)};
  color: ${(props) => props.theme.color.textPrimary};
  margin: 2px;
`;

const PageWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const HelpMessage = styled.p`
  font-family: 'Karla';
  font-size: ${px2rem(16)};
  text-align: center;
  max-width: 480px;
`;
