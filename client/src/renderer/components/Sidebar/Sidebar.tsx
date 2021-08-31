import React from 'react';
import { useHistory } from 'react-router-dom';
import { client } from 'renderer/api';
import { getUsername, logout } from 'renderer/utils';
import styled from 'styled-components';
import { IconEye, IconHome, IconSignOut, Avatar, Tooltip } from 'renderer/ui';
import { useQuery } from 'react-query';
import { SidebarIcon } from './SidebarIcon';

const fetchMeInfo = () => {
  return client.get(`/me?username=${getUsername()}`);
};

export function Sidebar() {
  const history = useHistory();

  const onHomePage = history.location.pathname === '/';
  const onWatchPage = history.location.pathname === '/watch';

  const { data } = useQuery('meInfo', fetchMeInfo);

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
              style={{ marginBottom: '11px' }}
              onClick={() => history.push('/')}
            />
          </i>
        </Tooltip>

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
        <Tooltip title="Sign out" placement="right" enterDelay={500}>
          <i>
            <SidebarIcon
              icon={IconSignOut}
              style={{ marginBottom: '11px' }}
              onClick={() => {
                logout();
                window.location.reload();
              }}
            />
          </i>
        </Tooltip>

        <Tooltip title={getUsername() || ''} placement="right" enterDelay={500}>
          <i>
            <a
              href={`https://www.twitch.tv/${getUsername()}`}
              target="_blank"
              rel="noreferrer"
            >
              <Avatar src={data?.data.profile_image_url} size={48} />
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
