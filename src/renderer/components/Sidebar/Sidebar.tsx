import React from 'react';
import { useHistory } from 'react-router-dom';
import { fetchChannelId, getUserProfilePicture } from 'renderer/core/data';
import styled, { useTheme } from 'styled-components';
import {
    IconSignOut,
    Avatar,
    Tooltip,
    IconStreamers,
    IconHome,
    IconButton,
} from 'renderer/ui';
import { useQuery } from 'react-query';
import { watcher } from 'renderer/core/watcher';
import { signout } from 'renderer/utils/auth';
import { auth } from 'renderer/core/auth';

interface SidebarOptions {
    // This helps us fix the issue of active icon in the sidebar not updating
    // in the production build but works fine without this in development build.
    currentPage: string;
}

export function Sidebar({ currentPage }: SidebarOptions) {
    const history = useHistory();
    const theme = useTheme();
    const { user } = auth.useStore();
    // So that we can conditionally re-render `IconPause` or `IconPlay`.
    watcher.useStore();

    const { data: profileImageUrl } = useQuery('ME_INFO', async () => {
        const id = await fetchChannelId(user.login);
        return getUserProfilePicture(id);
    });

    const onHomePage = currentPage === '/';
    const onStreamersPage = currentPage === '/streamers';

    return (
        <Container>
            <Top>
                <Tooltip
                    title="Home"
                    placement="right"
                    enterDelay={1000}
                    disableHoverListener={onHomePage}
                >
                    <i>
                        <IconButton
                            icon={IconHome}
                            active={onHomePage}
                            onClick={() => history.push('/')}
                        />
                    </i>
                </Tooltip>

                <i style={{ height: '11px' }} />

                <Tooltip
                    title="Streamers"
                    placement="right"
                    enterDelay={1000}
                    disableHoverListener={onStreamersPage}
                >
                    <i>
                        <IconButton
                            icon={IconStreamers}
                            active={onStreamersPage}
                            onClick={() => history.push('/streamers')}
                        />
                    </i>
                </Tooltip>
            </Top>

            <Bottom>
                <Tooltip
                    title="Sign out"
                    placement="right"
                    enterDelay={100}
                    background={theme.color.error}
                >
                    <i>
                        <IconButton
                            icon={IconSignOut}
                            iconColor={theme.color.error}
                            bgColorOnHover={theme.color.textPrimary}
                            onClick={() => {
                                signout();
                            }}
                        />
                    </i>
                </Tooltip>

                <i style={{ height: '11px' }} />

                <Tooltip
                    title={auth.store.getState().user.login || ''}
                    placement="right"
                    enterDelay={1000}
                >
                    <i>
                        <a
                            href={`https://www.twitch.tv/${
                                auth.store.getState().user.login
                            }`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Avatar src={profileImageUrl} size={48} />
                        </a>
                    </i>
                </Tooltip>
            </Bottom>
        </Container>
    );
}

const Container = styled.div`
    width: 86px;
    height: 100vh;
    padding: 28px 0;
    position: sticky;
    top: 0px;
    left: 0px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
`;

const Top = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
`;

const Bottom = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
`;
