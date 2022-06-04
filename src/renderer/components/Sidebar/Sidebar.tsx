import {
    Avatar,
    IconButton,
    IconHome,
    IconSignOut,
    IconStreamers,
    IconSettings,
    Tooltip,
} from 'renderer/ui';
import styled, { useTheme } from 'styled-components';

import React from 'react';
import { api } from 'renderer/core/api';
import { auth } from 'renderer/core/auth';
import { useHistory } from 'react-router-dom';
import { useQuery } from 'react-query';
import { watcher } from 'renderer/core/watcher';

interface SidebarOptions {
    // This helps us fix the issue of active icon in the sidebar not updating
    // in the production build but works fine without this in development build.
    currentPage: string;
}

interface MeInfoQueryResponse {
    id: string;
    login: string;
    displayName: string;
    profileImageUrl: string;
}

export function Sidebar({ currentPage }: SidebarOptions) {
    const history = useHistory();
    const theme = useTheme();
    const { user } = auth.useStore();
    // So that we can conditionally re-render `IconPause` or `IconPlay`.
    watcher.useStore();

    const { data } = useQuery<MeInfoQueryResponse>('ME_INFO', async () => {
        const context = await api.getChannelContext(user.login);
        const imageUrl = await api.getUserProfilePicture(context.id);

        return {
            id: context.id,
            login: context.login,
            displayName: context.displayName,
            profileImageUrl: imageUrl,
        };
    });

    const onHomePage = currentPage === '/';
    const onStreamersPage = currentPage === '/streamers';
    const onSettingsPage = currentPage === '/settings';

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

                <i style={{ height: '11px' }} />

                <Tooltip
                    title="Settings"
                    placement="right"
                    enterDelay={1000}
                    disableHoverListener={onSettingsPage}
                >
                    <i>
                        <IconButton
                            icon={IconSettings}
                            active={onSettingsPage}
                            onClick={() => history.push('/settings')}
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
                                auth.logout();
                            }}
                        />
                    </i>
                </Tooltip>

                <i style={{ height: '11px' }} />

                <Tooltip
                    title={data?.displayName || ''}
                    placement="right"
                    enterDelay={1000}
                >
                    <i>
                        <a
                            href={`https://www.twitch.tv/${data?.login || ''}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Avatar
                                src={data?.profileImageUrl as string}
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
