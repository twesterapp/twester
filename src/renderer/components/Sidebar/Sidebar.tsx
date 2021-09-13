import React from 'react';
import { useHistory } from 'react-router-dom';
import { fetchChannelInfo } from 'renderer/api';
import styled, { useTheme } from 'styled-components';
import {
    IconSignOut,
    Avatar,
    Tooltip,
    IconStreamers,
    IconHome,
} from 'renderer/ui';
import { useQuery } from 'react-query';
import { delToken, delUser, authStore } from 'renderer/stores/useAuthStore';
import { useWatcherStore } from 'renderer/stores/useWatcherStore';
import { SidebarIcon } from './SidebarIcon';

interface SidebarOptions {
    // This helps us fix the issue of active icon in the sidebar not updating
    // in the production build but works fine without this in development build.
    currentPage: string;
}

export function Sidebar({ currentPage }: SidebarOptions) {
    const history = useHistory();
    const theme = useTheme();
    // So that we can conditionally re-render `IconPause` or `IconPlay`.
    useWatcherStore();

    const { data } = useQuery('ME_INFO', () => fetchChannelInfo());

    const onHomePage = currentPage === '/';
    const onStreamersPage = currentPage === '/streamers';

    return (
        <Container>
            <Top>
                <Tooltip title="Home" placement="right" enterDelay={1000}>
                    <i>
                        <SidebarIcon
                            icon={IconHome}
                            active={onHomePage}
                            onClick={() => history.push('/')}
                        />
                    </i>
                </Tooltip>

                <i style={{ height: '11px' }} />

                <Tooltip title="Streamers" placement="right" enterDelay={1000}>
                    <i>
                        <SidebarIcon
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
                    enterDelay={1000}
                    background={theme.color.error}
                >
                    <i>
                        <SidebarIcon
                            icon={IconSignOut}
                            onClick={() => {
                                delToken();
                                delUser();
                                window.location.reload();
                            }}
                        />
                    </i>
                </Tooltip>

                <i style={{ height: '11px' }} />

                <Tooltip
                    title={authStore.getState().user.login || ''}
                    placement="right"
                    enterDelay={1000}
                >
                    <i>
                        <a
                            href={`https://www.twitch.tv/${
                                authStore.getState().user.login
                            }`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Avatar
                                src={data?.data.data[0].profile_image_url}
                                size={48}
                            />
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
