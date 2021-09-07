import React from 'react';
import styled, { ThemeProvider } from 'styled-components';
import {
  MemoryRouter as Router,
  Switch,
  Route,
  useHistory,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import 'typeface-poppins';
import 'typeface-karla';
import 'typeface-roboto-mono';

import { darkTheme, GlobalStyle } from './ui';
import { AuthPage, HomePage, WatchPage } from './pages';
import { Sidebar } from './components';
import { useAuthStore } from './stores/useAuthStore';

const queryClient = new QueryClient();

const Dashboard = () => {
  const history = useHistory();

  return (
    <Layout>
      <SidebarContainer>
        <Sidebar currentPage={history.location.pathname} />
      </SidebarContainer>
      <DashboardContainer>
        <Route path="/" exact component={HomePage} />
        <Route path="/watch" component={WatchPage} />
      </DashboardContainer>
    </Layout>
  );
};

export function App() {
  const { user } = useAuthStore();

  return (
    <ThemeProvider theme={darkTheme}>
      <QueryClientProvider client={queryClient}>
        <GlobalStyle />
        <Router>
          <Switch>{user.id ? <Dashboard /> : <AuthPage />}</Switch>
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
  padding: 0 1em;
`;

const Layout = styled.div`
  display: flex;
  max-width: 100vw;
  min-width: fit-content;
`;
