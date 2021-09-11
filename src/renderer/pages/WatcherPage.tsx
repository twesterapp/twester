import React from 'react';
import { useStreamerStore } from 'renderer/stores/useStreamerStore';
import {
    canStartWatcher,
    useWatcherStore,
} from 'renderer/stores/useWatcherStore';
import { watcher } from 'renderer/core/watcher';
import { IconPlay, IconPause, Link } from 'renderer/ui';
import { px2em, px2rem } from 'renderer/utils';
import styled, { useTheme } from 'styled-components';
import { useLoggerStore } from 'renderer/stores/useLoggerStore';

export function WatcherPage() {
    const theme = useTheme();
    const { streamers } = useStreamerStore();
    useWatcherStore();
    const { logs } = useLoggerStore();
    const logsEndRef = React.useRef<HTMLDivElement>(null);

    const hasStreamersToWatch = streamers.length > 0;

    function isPlayButtonActive(): boolean {
        if (watcher.canPlay() && hasStreamersToWatch) {
            return true;
        }

        return false;
    }

    function isPauseButtonActive(): boolean {
        if (watcher.canPause()) {
            return true;
        }

        return false;
    }

    const RenderPlayButton = () => (
        <IconPlay
            style={{
                cursor: isPlayButtonActive() ? 'pointer' : 'not-allowed',
            }}
            size={64}
            color={
                isPlayButtonActive()
                    ? theme.color.success
                    : theme.color.disabled
            }
            onClick={() => isPlayButtonActive() && watcher.play()}
        />
    );

    const RenderPauseButton = () => (
        <IconPause
            style={{
                cursor: isPauseButtonActive() ? 'pointer' : 'not-allowed',
            }}
            size={64}
            color={
                isPauseButtonActive() ? theme.color.error : theme.color.disabled
            }
            onClick={() => isPauseButtonActive() && watcher.pause()}
        />
    );

    // For the initial mounting we don't want to animate(`smooth`) the scroll.
    // It will be annoying to see the scroll animation whenever user comes on
    // HomePage.
    React.useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, []);

    // After the initial mounting we want to animate(`smooth`) the scroll
    // whenever logs change(new logs are added).
    React.useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <PageWrapper>
            <Content>
                <StatsContainer>
                    <StatInfo>0m</StatInfo>
                    <StatInfo style={{ color: theme.color.success }}>
                        +0
                    </StatInfo>
                    {!canStartWatcher()
                        ? RenderPauseButton()
                        : RenderPlayButton()}
                </StatsContainer>
                <LogContainer>
                    {logs.length > 0 &&
                        logs.map((log) => {
                            return (
                                <LogText key={log.id}>
                                    {log.timestamp.toLocaleDateString()}{' '}
                                    {log.timestamp.toLocaleTimeString()} -{' '}
                                    {log.text}
                                </LogText>
                            );
                        })}
                    <div ref={logsEndRef} />
                </LogContainer>
            </Content>
        </PageWrapper>
    );
}

const StatsContainer = styled.div`
    display: flex;
    background: ${(props) => props.theme.color.background2};
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    box-sizing: border-box;
    width: 100%;
    padding: ${px2em(16)} ${px2em(32)};
    justify-content: space-between;
    align-items: center;

    p {
        margin: 0;
    }
`;

const StatInfo = styled.p`
    font-size: ${px2rem(36)};
    font-family: 'Poppins';
    font-weight: bold;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${px2em(30)} 0;
    width: 100%;
    height: 100%;
    padding: 0 ${px2em(24)};
    box-sizing: border-box;

    @media screen and (min-width: 1080px) {
        padding: 0 ${px2em(56)};
    }
`;

const LogContainer = styled.div`
    background: ${(props) => props.theme.color.background2};
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    box-sizing: border-box;
    width: 100%;
    padding: ${() => `${px2em(6)} ${px2em(12)}`};
    height: 70%;
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
    min-width: calc(640px - 86px);
    height: 100%;
    min-height: 480px;
`;

const HelpMessage = styled.p`
    font-family: 'Karla';
    font-size: ${px2rem(16)};
    text-align: center;
    max-width: 480px;
`;
