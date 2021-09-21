import React, { useState } from 'react';
import styled, { useTheme } from 'styled-components';
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
import toast, { Toaster } from 'react-hot-toast';
import { GlobalStyle } from './ui';
import { AuthPage, StreamersPage, HomePage } from './pages';
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

const onUpdateAvailableToast = () =>
    toast.loading('Updating to the latest version');

const onUpdateDownloadedToast = () =>
    toast.success('Restart the app to use the latest version', {
        icon: '🎉',
        duration: 6900,
    });

const onUpdateFailedToast = () => {
    toast.error('There was a problem updating the app', {
        icon: '😞',
        duration: 5000,
    });
};

export function App() {
    const theme = useTheme();
    const { user } = useAuthStore();
    const [availableToastId, setAvailableToastId] = useState('');

    // @ts-ignore
    const ipc = window.electron.ipcRenderer;

    ipc.once('update_available', handleUpdateAvailable);
    ipc.once('update_downloaded', handleUpdateDownloaded);
    ipc.once('update_failed', handleUpdateFailed);

    function handleUpdateAvailable() {
        const id = onUpdateAvailableToast();
        setAvailableToastId(id);
    }

    function handleUpdateDownloaded() {
        toast.dismiss(availableToastId);
        onUpdateDownloadedToast();
    }

    function handleUpdateFailed() {
        onUpdateFailedToast();
    }

    return (
        <>
            <QueryClientProvider client={queryClient}>
                <GlobalStyle />
                <Router>
                    <Switch>{user.id ? <Dashboard /> : <AuthPage />}</Switch>
                </Router>
                <ReactQueryDevtools position="bottom-right" />
            </QueryClientProvider>
            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: theme.color.borderOnDisabled,
                        color: theme.color.textPrimary,
                        fontFamily: 'Karla',
                        fontSize: '14px',
                    },
                }}
            />
        </>
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
