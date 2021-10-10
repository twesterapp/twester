import React from 'react';
import { useStreamerStore } from 'renderer/stores/useStreamerStore';
import {
    canStartWatcher,
    useWatcherStore,
} from 'renderer/stores/useWatcherStore';
import { watcher } from 'renderer/core';
import { IconPlay, IconPause, Link, IconClock, IconStar } from 'renderer/ui';
import { formatMinutesToString, px2em, px2rem } from 'renderer/utils';
import styled, { useTheme } from 'styled-components';
import { useLoggerStore } from 'renderer/stores/useLoggerStore';
import { useAppVersion } from 'renderer/hooks';

export function HomePage() {
    const version = useAppVersion();
    const logsEndRef = React.useRef<HTMLDivElement>(null);
    const [isScrollAtBottom, setScrollAtBottom] = React.useState(true);

    const { streamers } = useStreamerStore();
    const { minutesWatched, pointsEarned } = useWatcherStore();
    const { logs } = useLoggerStore();
    const theme = useTheme();

    const hasStreamersToWatch = streamers.length > 0;

    const isPlayButtonActive = (): boolean => {
        if (watcher.canPlay() && hasStreamersToWatch) {
            return true;
        }

        return false;
    };

    const isPauseButtonActive = (): boolean => {
        if (watcher.canPause()) {
            return true;
        }

        return false;
    };

    const handleScroll = (e: any) => {
        // Copied from https://stackoverflow.com/a/49573628/13904394
        const bottom =
            e.target.scrollHeight - e.target.scrollTop ===
            e.target.clientHeight;

        if (bottom) {
            setScrollAtBottom(true);
        } else {
            setScrollAtBottom(false);
        }
    };

    const RenderPlayButton = () => (
        <IconPlay
            style={{
                cursor: isPlayButtonActive() ? 'pointer' : 'not-allowed',
                filter: 'drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.25))',
            }}
            size={64}
            color={
                isPlayButtonActive()
                    ? theme.color.brightBlue
                    : theme.color.disabled
            }
            onClick={() => isPlayButtonActive() && watcher.play()}
        />
    );

    const RenderPauseButton = () => (
        <IconPause
            style={{
                cursor: isPauseButtonActive() ? 'pointer' : 'not-allowed',
                textShadow: '0px 3px 6px rgba(0, 0, 0, 0.25)',
                filter: 'drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.25))',
            }}
            size={64}
            color={
                isPauseButtonActive()
                    ? theme.color.brightBlue
                    : theme.color.disabled
            }
            onClick={() => isPauseButtonActive() && watcher.pause()}
        />
    );

    // For the initial mounting we don't want to animate(`smooth`) the scroll.
    // It will be annoying to see the scroll animation whenever user comes on
    // HomePage. We will start with scroll at bottom.
    React.useEffect(() => {
        logsEndRef.current?.scrollIntoView();
    }, []);

    // After the initial mounting we want to animate(`smooth`) the scroll
    // whenever logs change(new logs are added) and the scroll is at bottom.
    // If the scroll is not at the bottom, that probably means the user is
    // looking at some log and it would annoy the user if we scroll to bottom.
    React.useEffect(() => {
        if (isScrollAtBottom) {
            logsEndRef.current?.scrollIntoView();
        }
    }, [isScrollAtBottom, logs]);

    return (
        <PageWrapper>
            {version && (
                <p
                    style={{
                        fontSize: '14px',
                        fontFamily: 'Roboto Mono',
                        color: theme.color.borderOnDisabled,
                        position: 'absolute',
                        bottom: '4px',
                        left: '12px',
                    }}
                >
                    v{version}
                </p>
            )}
            <Content>
                <StatsContainer>
                    <StatInfo>
                        <IconClock size={32} color={theme.color.brightBlue} />
                        <p>{formatMinutesToString(minutesWatched)}</p>
                    </StatInfo>

                    <StatInfo>
                        <IconStar size={32} color={theme.color.brightBlue} />
                        <p>{pointsEarned}</p>
                    </StatInfo>

                    {!canStartWatcher()
                        ? RenderPauseButton()
                        : RenderPlayButton()}
                </StatsContainer>

                <LogContainer onScroll={handleScroll}>
                    {!hasStreamersToWatch ? (
                        <InfoBox>
                            <InfoText>
                                Go to <Link to="/streamers">Streamers</Link> tab
                                and add at least one streamer to the list and
                                hit the play button above to start harvesting
                                channel points 🎉
                            </InfoText>
                        </InfoBox>
                    ) : (
                        <>
                            {logs.length > 0 &&
                                logs.map((log) => {
                                    return (
                                        <LogText key={log.id}>
                                            {log.timestamp.toLocaleDateString()}{' '}
                                            {log.timestamp.toLocaleTimeString()}{' '}
                                            - {log.text}
                                        </LogText>
                                    );
                                })}
                            <div ref={logsEndRef} />
                        </>
                    )}
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
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: ${px2em(16)} ${px2em(32)};
`;

const StatInfo = styled.div`
    display: flex;
    align-items: center;

    p {
        font-size: ${px2rem(36)};
        font-family: 'Poppins';
        font-weight: bold;
        margin: 0;
        margin-left: 8px;
    }
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${px2em(30)} 0;
    width: 100%;
    height: 100%;
    padding: ${px2em(16)} ${px2em(24)};
    box-sizing: border-box;

    @media screen and (min-width: 1080px) {
        padding: ${px2em(24)} ${px2em(56)};
    }
`;

const LogContainer = styled.div`
    background: ${(props) => props.theme.color.background2};
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    box-sizing: border-box;
    width: 100%;
    padding: ${() => `${px2em(6)} ${px2em(12)}`};
    height: 70%;
    max-height: 70vh;
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
        background: ${(props) => props.theme.color.background3};
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
    position: relative;
`;

const InfoText = styled.p`
    font-family: 'Karla';
    font-size: ${px2rem(16)};
    color: ${(props) => props.theme.color.textAlter};
    text-align: center;
    margin: 0;
`;

const InfoBox = styled.div`
    background: ${(props) => props.theme.color.brightBlue};
    padding: ${px2em(24)};
    box-sizing: border-box;
    max-width: 535px;
    margin: auto auto;
    border-radius: 14px;

    a {
        color: ${(props) => props.theme.color.textAlter};
        font-weight: bold;
        text-decoration: underline;

        &:hover {
            text-decoration: none;
        }
    }
`;
