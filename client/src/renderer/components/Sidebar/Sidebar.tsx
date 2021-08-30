import React from 'react';
import { useHistory } from 'react-router-dom';
import { IconEye, IconHome, IconSignOut } from 'renderer/ui/Icons';
import { logout } from 'renderer/utils';
import styled from 'styled-components';
import { SidebarIcon } from './SidebarIcon';

export function Sidebar() {
  const history = useHistory();

  const onHomePage = history.location.pathname === '/';
  const onWatchPage = history.location.pathname === '/watch';

  return (
    <Container>
      <Top>
        <SidebarIcon
          icon={IconHome}
          active={onHomePage}
          tooltip="Home"
          style={{ marginBottom: '11px' }}
          onClick={() => history.push('/')}
        />
        <SidebarIcon
          icon={IconEye}
          active={onWatchPage}
          tooltip="Streamers to watch"
          onClick={() => history.push('/watch')}
        />
      </Top>
      <Bottom>
        <SidebarIcon
          icon={IconSignOut}
          tooltip="Sign out"
          onClick={() => {
            logout();
            window.location.reload();
          }}
        />
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

const Top = styled.div``;
const Bottom = styled.div``;
