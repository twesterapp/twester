import React from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
import 'typeface-poppins';
import 'typeface-karla';

import { darkTheme, GlobalStyle } from './ui';

import { Auth, Home, Watch } from './pages';

import { isAuth, fakeLogin } from './utils';
import { Sidebar } from './components/Sidebar/Sidebar';

export function App() {
  // fakeLogin();
  const ProtectedRoutes = () => (
    <Layout>
      <SidebarContainer>
        <Sidebar />
      </SidebarContainer>
      <DashboardContainer>
        <Route path="/" exact component={Home} />
        <Route path="/watch" exact component={Watch} />
      </DashboardContainer>
    </Layout>
  );

  const PublicRoutes = () => (
    <>
      <Route path="/" component={Auth} />
    </>
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyle />
      <Router>
        <Switch>{isAuth() ? <ProtectedRoutes /> : <PublicRoutes />}</Switch>
      </Router>
    </ThemeProvider>
  );
}

const SidebarContainer = styled.div`
  width: 86px;
`;

const DashboardContainer = styled.div`
  width: 100%;
`;

const Layout = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
`;
