import React from 'react';
import { useDrop } from 'react-dnd';
import { fetchChannelFollowers, fetchChannelInfo } from 'renderer/api';
import { ItemTypes, StreamerCard } from 'renderer/components';
import {
    useStreamerStore,
    addStreamer,
} from 'renderer/stores/useStreamerStore';
import { canStartWatcher } from 'renderer/stores/useWatcherStore';
import { Button, IconPlus, InputText, Link } from 'renderer/ui';
import { px2em } from 'renderer/utils';
import styled from 'styled-components';

export function StreamersPage() {
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
        } catch {
            console.error('Failed to fetch channel info');
        }

        setSearchText('');
        setFetchingStreamer(false);
    }

    const [, drop] = useDrop(() => ({ accept: ItemTypes.CARD }));

    return (
        <PageWrapper>
            {!canStartWatcher() && (
                <HelpMessage>
                    Go to <Link to="/">Home</Link> tab and{' '}
                    <em>
                        <b>pause</b>
                    </em>{' '}
                    the watcher to update streamers 🎉
                </HelpMessage>
            )}
            <Search onSubmit={handleAddStreamer}>
                <InputText
                    style={{ marginRight: `${px2em(12)}`, width: '300px' }}
                    placeholder="Streamer to add"
                    value={searchText}
                    disabled={!canStartWatcher() || fetchingStreamer}
                    onChange={(e) => setSearchText(e.target.value)}
                />
                <Button
                    width="46px"
                    variant="submit"
                    loading={fetchingStreamer}
                    disabled={!canStartWatcher() ?? !searchText.trim()}
                >
                    <IconPlus />
                </Button>
            </Search>
            <Info>
                Streamers will be prioritized top to bottom.
                <br />
                You can re-order them by drag and drop.
            </Info>

            <Streamers ref={drop}>
                {streamers.length > 0 &&
                    streamers.map((streamer) => {
                        return (
                            <StreamerCard
                                key={streamer.id}
                                streamer={streamer}
                            />
                        );
                    })}
            </Streamers>
        </PageWrapper>
    );
}

const Streamers = styled.div`
    display: flex;
    flex-direction: column;
    row-gap: ${px2em(14)};
    margin: 0 24px 24px 24px;
`;

const HelpMessage = styled.p`
    font-family: 'Karla';
    text-align: center;
    background: ${(props) => props.theme.color.brightBlue};
    color: ${(props) => props.theme.color.textAlter};
    margin: 0;
    margin-bottom: 32px;
    padding: ${() => `${px2em(10)} ${px2em(24)}`};
    border-radius: 0px 0px 50px 50px;

    a {
        color: ${(props) => props.theme.color.textAlter};
        font-weight: bold;
        text-decoration: underline;

        &:hover {
            text-decoration: none;
        }
    }
`;

const Search = styled.form`
    margin-top: 44px;
    height: 46px;
    display: flex;
    margin-bottom: ${px2em(22)};
`;

const Info = styled.p`
    font-family: Karla;
    color: ${(props) => props.theme.color.textFaded};
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
    position: relative;
`;
