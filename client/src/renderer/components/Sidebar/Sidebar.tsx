import React from 'react';
import { useHistory } from 'react-router-dom';
import { fetchChannelInfo } from 'renderer/api';
import { getUsername, logout, setUserId } from 'renderer/utils';
import styled, { useTheme } from 'styled-components';
import { IconEye, IconHome, IconSignOut, Avatar, Tooltip } from 'renderer/ui';
import { useQuery } from 'react-query';
import { SidebarIcon } from './SidebarIcon';

export function Sidebar() {
  const history = useHistory();
  const theme = useTheme();

  const onHomePage = history.location.pathname === '/';
  const onWatchPage = history.location.pathname === '/watch';

  const { data } = useQuery('meInfo', () => fetchChannelInfo());
  const userId = data?.data.data[0].id;

  if (userId) {
    setUserId(userId);
  }

  return (
    <Container>
      <Top>
        <Tooltip title="Home" placement="right" enterDelay={500}>
          {/* 
            Only a valid HTML Element can be the first child inside `Tooltip`
            that's why there is an <i> </i> wrapping <SidebarIcon>.
           */}
          <i>
            <SidebarIcon
              icon={IconHome}
              active={onHomePage}
              onClick={() => history.push('/')}
            />
          </i>
        </Tooltip>

        {/* For creating space */}
        <i style={{ height: '11px' }} />

        <Tooltip title="Streamers to watch" placement="right" enterDelay={500}>
          <i>
            <SidebarIcon
              icon={IconEye}
              active={onWatchPage}
              onClick={() => history.push('/watch')}
            />
          </i>
        </Tooltip>
      </Top>

      <Bottom>
        <Tooltip
          title="Sign out"
          placement="right"
          enterDelay={500}
          background={theme.color.error}
        >
          <i>
            <SidebarIcon
              icon={IconSignOut}
              color={theme.color.error}
              onClick={() => {
                logout();
                window.location.reload();
              }}
            />
          </i>
        </Tooltip>

        <i style={{ height: '11px' }} />

        <Tooltip title={getUsername() || ''} placement="right" enterDelay={500}>
          <i>
            <a
              href={`https://www.twitch.tv/${getUsername()}`}
              target="_blank"
              rel="noreferrer"
            >
              <Avatar src={data?.data.data[0].profile_image_url} size={48} />
            </a>
          </i>
        </Tooltip>
      </Bottom>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  padding: 28px 0;
  box-sizing: border-box;
  background: ${(props) => props.theme.color.background2};
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
