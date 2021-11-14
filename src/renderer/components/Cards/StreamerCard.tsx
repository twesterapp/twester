import {
    Avatar,
    IconClock,
    IconCross,
    IconEyeOpen,
    IconStar,
} from 'renderer/ui';
import {
    ContextUser,
    getChannelContextInfo,
    getUserProfilePicture,
} from 'renderer/core/data';
import { StreamerClass, StreamerId } from 'renderer/core/streamer';
import styled, { useTheme } from 'styled-components';
import { useDrag, useDrop } from 'react-dnd';

import React from 'react';
import { formatMinutes } from 'renderer/utils/formatMinutes';
import { px2rem } from 'renderer/utils/px2rem';
import { twester } from 'renderer/core';
import { useQuery } from 'react-query';
import { watcher } from 'renderer/core/watcher';

// Blatantly copied from React DnD's example, check
// https://react-dnd.github.io/react-dnd/examples/sortable/cancel-on-drop-outside

interface StreamerCardProps {
    streamer: StreamerClass;
}

interface Item {
    streamerId: StreamerId;
    originalIndex: number;
}

export enum ItemTypes {
    CARD = 'card',
}

export function StreamerCard({ streamer }: StreamerCardProps) {
    const theme = useTheme();

    const { data } = useQuery(`STREAMER_CARD_INFO.${streamer.login}`, () =>
        getChannelContextInfo(streamer.login)
    );

    let originalIndex = -1;

    const streamerCard = twester.streamers.findStreamerCard(streamer.id);

    if (streamerCard) {
        originalIndex = streamerCard.index;
    }

    const [{ isDragging }, drag] = useDrag(
        () => ({
            type: ItemTypes.CARD,
            item: { streamerId: streamer.id, originalIndex },
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
            canDrag: () => !!watcher.canPlay(),
            end: (item, monitor) => {
                const { streamerId: droppedId, originalIndex } = item;
                const didDrop = monitor.didDrop();
                if (!didDrop) {
                    twester.streamers.moveStreamerCard(
                        droppedId,
                        originalIndex
                    );
                }
            },
        }),
        [streamer.id, originalIndex, twester.streamers.moveStreamerCard]
    );

    const [, drop] = useDrop(
        () => ({
            accept: ItemTypes.CARD,
            canDrop: () => false,
            hover({ streamerId: draggedId }: Item) {
                if (draggedId !== streamer.id) {
                    const streamerCard = twester.streamers.findStreamerCard(
                        streamer.id
                    );

                    if (streamerCard) {
                        twester.streamers.moveStreamerCard(
                            draggedId,
                            streamerCard.index
                        );
                    }
                }
            },
        }),
        [twester.streamers.findStreamerCard, twester.streamers.moveStreamerCard]
    );

    React.useEffect(() => {
        const run = async (data: ContextUser) => {
            const result = await getChannelContextInfo(data.login);
            const profileImageUrl = await getUserProfilePicture(data.id);

            twester.streamers.updateStreamer(streamer.id, {
                displayName: result?.displayName || data.displayName,
                profileImageUrl,
            });
        };

        if (data) {
            run(data);
        }
    }, [data, streamer.id]);

    return (
        <Card
            ref={(node) => drag(drop(node))}
            style={{
                opacity: isDragging ? 0 : 1,
            }}
        >
            <Content>
                <TopRight>
                    {watcher.canPlay() ? (
                        <button
                            id="remove-button"
                            onClick={() =>
                                twester.streamers.removeStreamer(streamer.id)
                            }
                            type="button"
                        >
                            <IconCross
                                size={12}
                                color={theme.color.onPrimary}
                            />
                        </button>
                    ) : (
                        <>
                            {streamer.watching && (
                                <IconEyeOpen
                                    size={24}
                                    color={theme.color.secondary}
                                />
                            )}
                        </>
                    )}
                </TopRight>

                <Avatar
                    src={streamer.profileImageUrl}
                    size={64}
                    alt={`${streamer.displayName} profile`}
                    borderColor={
                        streamer.isOnline()
                            ? theme.color.secondary
                            : theme.color.borderOnDisabled
                    }
                    margin="14px"
                    showLiveStatus={streamer.isOnline()}
                    liveStatusBgColor={theme.color.secondary}
                />

                <div>
                    <h1>{streamer.displayName}</h1>
                    <StatsContainer>
                        <StatInfo style={{ marginRight: px2rem(16) }}>
                            <IconClock
                                size={16}
                                color={theme.color.brightBlue}
                            />
                            <p>{formatMinutes(streamer.minutesWatched)}</p>
                        </StatInfo>
                        <StatInfo>
                            <IconStar
                                size={16}
                                color={theme.color.brightBlue}
                            />
                            <p>{streamer.pointsEarned}</p>
                        </StatInfo>
                    </StatsContainer>
                </div>
            </Content>

            <p id="streamer-priority-rank">#{originalIndex + 1}</p>
        </Card>
    );
}

const StatsContainer = styled.div`
    display: flex;
    align-items: center;
    margin-top: ${px2rem(8)};
`;

const StatInfo = styled.div`
    display: flex;

    p {
        font-family: Poppins;
        font-size: ${px2rem(16)};
        margin: 0 !important;
        margin-left: ${px2rem(4)} !important;
    }
`;

const Card = styled.div`
    width: 405px;
    height: 92px;
    background: ${(props) => props.theme.color.background2};
    color: ${(props) => props.theme.color.textPrimary};
    border-radius: 14px;
    position: relative;

    transition: background-color 200ms ease-out;

    &:hover {
        background: ${(props) => props.theme.color.background3};

        #remove-button {
            display: flex;
        }
    }

    #remove-button {
        border: none;
        height: 28px;
        width: 28px;
        border-radius: 50%;
        align-items: center;
        justify-content: center;
        display: none;
        cursor: pointer;
        background: ${(props) => props.theme.color.background2};

        transition: background-color 100ms ease-out;

        &:hover {
            background: ${(props) => props.theme.color.error};
        }
    }

    #streamer-priority-rank {
        user-select: none;
        position: absolute;
        margin: 0;
        bottom: 10px;
        right: 10px;
    }
`;

const TopRight = styled.div`
    position: absolute;
    top: 10px;
    right: 10px;
`;

const Content = styled.div`
    width: 90%;
    height: 100%;
    display: flex;
    align-items: center;

    h1 {
        font-size: ${px2rem(24)};
        margin: 0;
        color: ${(props) => props.theme.color.textPrimary};
    }

    p {
        user-select: none;
        font-size: ${px2rem(16)};
        margin: 0;
        margin-top: ${px2rem(4)};
        color: ${(props) => props.theme.color.textPrimary};
    }
`;
