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

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { darkTheme, GlobalStyle } from './ui';
import { AuthPage, StreamersPage, HomePage, ErrorFallback } from './screens';
import { Sidebar } from './components';
import { useAuthStore } from './stores/useAuthStore';

const queryClient = new QueryClient();

const Dashboard = () => {
    const history = useHistory();

    return (
        <DndProvider backend={HTML5Backend}>
            <Layout>
                <SidebarContainer>
                    <Sidebar currentPage={history.location.pathname} />
                </SidebarContainer>
                <DashboardContainer>
                    <Route path="/" exact component={HomePage} />
                    <Route path="/streamers" component={StreamersPage} />
                </DashboardContainer>
            </Layout>
        </DndProvider>
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
`;

const Layout = styled.div`
    display: flex;
    max-width: 100vw;
`;
