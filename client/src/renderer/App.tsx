import React from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import 'typeface-poppins';
import 'typeface-karla';

import { darkTheme, GlobalStyle } from './ui';

import { AuthPage, HomePage, WatchPage } from './pages';

import { isAuth, fakeLogin } from './utils';
import { Sidebar } from './components';

const queryClient = new QueryClient();

export function App() {
  // fakeLogin();
  const Dashboard = () => (
    <Layout>
      <SidebarContainer>
        <Sidebar />
      </SidebarContainer>
      <DashboardContainer>
        <Route path="/" exact component={HomePage} />
        <Route path="/watch" exact component={WatchPage} />
      </DashboardContainer>
    </Layout>
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <QueryClientProvider client={queryClient}>
        <GlobalStyle />
        <Router>
          <Switch>{isAuth() ? <Dashboard /> : <AuthPage />}</Switch>
        </Router>
        <ReactQueryDevtools position="bottom-right" />
      </QueryClientProvider>
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
