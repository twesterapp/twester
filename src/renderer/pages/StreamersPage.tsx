import { Button, IconPlus, InputText, Link } from 'renderer/ui';
import { ItemTypes, StreamerCard } from 'renderer/components';
import {
    getChannelContextInfo,
    getUserProfilePicture,
} from 'renderer/core/data';

import React from 'react';
import { logging } from 'renderer/core/logging';
import { px2rem } from 'renderer/utils/px2rem';
import styled from 'styled-components';
import { twester } from 'renderer/core';
import { useDrop } from 'react-dnd';
import { watcher } from 'renderer/core/watcher';

const log = logging.getLogger('STREAMERS_PAGE');

export function StreamersPage() {
    const [searchText, setSearchText] = React.useState('');
    const [fetchingStreamer, setFetchingStreamer] = React.useState(false);
    twester.streamers.useStore();
    const streamers = twester.streamers.getAllStreamers();

    async function handleAddStreamer(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            setFetchingStreamer(true);

            const result = await getChannelContextInfo(searchText.trim());
            if (!result) {
                log.error(`No streamer found with search query: ${searchText}`);
                return;
            }
            const profileImageUrl = await getUserProfilePicture(result.id);

            twester.streamers.addStreamer({
                id: result.id,
                login: result.login,
                displayName: result.displayName,
                profileImageUrl,
            });
        } catch {
            // What am I trying to catch here? No function above throws error.
            log.error('Failed to fetch channel info');
        }

        setSearchText('');
        setFetchingStreamer(false);
    }

    const [, drop] = useDrop(() => ({ accept: ItemTypes.CARD }));

    return (
        <PageWrapper>
            {!watcher.canPlay() && (
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
                    style={{ marginRight: `${px2rem(12)}`, width: '300px' }}
                    placeholder="Streamer to add"
                    value={searchText}
                    disabled={!watcher.canPlay() || fetchingStreamer}
                    onChange={(e) => setSearchText(e.target.value)}
                    hidePlaceholderOnFocus={false}
                />
                <Button
                    width="46px"
                    variant="submit"
                    loading={fetchingStreamer}
                    disabled={!watcher.canPlay() ?? !searchText.trim()}
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
    row-gap: ${px2rem(14)};
    margin: 0 24px 24px 24px;
`;

const HelpMessage = styled.p`
    font-family: 'Karla';
    text-align: center;
    background: ${(props) => props.theme.color.brightBlue};
    color: ${(props) => props.theme.color.textAlter};
    margin: 0;
    margin-bottom: 32px;
    padding: ${() => `${px2rem(10)} ${px2rem(24)}`};
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
    margin-bottom: ${px2rem(22)};
`;

const Info = styled.p`
    font-family: Karla;
    color: ${(props) => props.theme.color.textFaded};
    line-height: ${px2rem(18)};
    margin: 0;
    margin-bottom: ${px2rem(44)};
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
