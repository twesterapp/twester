import React from 'react';
import {
    Streamer,
    removeStreamer,
    updateStreamer,
} from 'renderer/stores/useStreamerStore';
import { Avatar, IconCross, IconEye } from 'renderer/ui';
import { px2rem } from 'renderer/utils';
import styled, { useTheme } from 'styled-components';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import humanFormat from 'human-format';
import { canStartWatcher } from 'renderer/stores/useWatcherStore';
import { fetchChannelFollowers, fetchChannelInfo } from 'renderer/api';
import { useQuery } from 'react-query';

interface StreamerCardProps {
    streamer: Streamer;
}

// TODO: For grabbing state UI/Cursor we would probably use some state
// provided by `react-dnd` (drag-n-drop).
export function StreamerCard({ streamer }: StreamerCardProps) {
    const theme = useTheme();

    const { data } = useQuery(`STREAMER_CARD_INFO.${streamer.login}`, () =>
        fetchChannelInfo(streamer.login)
    );

    React.useEffect(() => {
        const info = data?.data.data[0];

        const run = async () => {
            const followersResult = await fetchChannelFollowers(info.id);

            updateStreamer(streamer.id, {
                displayName: info.display_name,
                profileImageUrl: info.profile_image_url,
                followersCount: followersResult.data.total,
            });
        };

        if (info) {
            run();
        }
    }, [data, streamer.id]);

    return (
        <Card>
            <Content>
                <TopRight>
                    {canStartWatcher() ? (
                        <button
                            id="remove-button"
                            onClick={() => removeStreamer(streamer.id)}
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
                                <IconEye
                                    size={24}
                                    color={theme.color.success}
                                />
                            )}
                        </>
                    )}
                </TopRight>

                <Avatar
                    src={streamer.profileImageUrl}
                    size={64}
                    alt={`${streamer.displayName} profile`}
                    border={streamer.online || false}
                    margin="14px"
                    showLiveStatus={streamer.online}
                />

                <div>
                    <h1>{streamer.displayName}</h1>
                    <p>
                        {humanFormat(streamer.followersCount, {
                            decimals: 1,
                            separator: '',
                        }).toUpperCase()}{' '}
                        followers
                    </p>
                </div>
            </Content>

            <p id="streamer-priority-rank">#{streamer.priorityRank}</p>
        </Card>
    );
}

const Card = styled.div`
    width: 405px;
    height: 92px;
    background: ${(props) => props.theme.color.background2};
    color: ${(props) => props.theme.color.textPrimary};
    border-radius: 14px;
    position: relative;
    margin-bottom: ${px2rem(16)};

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
