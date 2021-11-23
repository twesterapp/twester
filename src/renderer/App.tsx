import 'typeface-poppins';
import 'typeface-karla';
import 'typeface-roboto-mono';

import { AuthPage, HomePage, StreamersPage } from './pages';
import { QueryClient, QueryClientProvider } from 'react-query';
import React, { useRef } from 'react';
import {
    Route,
    MemoryRouter as Router,
    Switch,
    useHistory,
} from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

import { DndProvider } from 'react-dnd';
import { GlobalStyle } from './ui';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Sidebar } from './components';
import { auth } from './core/auth';
import { getIpc } from './utils/ipc';
import { injectStyle } from 'react-toastify/dist/inject-style';
import styled from 'styled-components';

injectStyle();

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
        autoClose: 6900,
    });

const onUpdateFailedToast = () => {
    toast.error('There was a problem updating the app', {
        icon: '😞',
        autoClose: 5000,
    });
};

export function App() {
    const { user } = auth.useStore();
    const availableToastId = useRef<React.ReactText | null>(null);

    const ipc = getIpc();

    ipc.once('update_available', handleUpdateAvailable);
    ipc.once('update_downloaded', handleUpdateDownloaded);
    ipc.once('update_failed', handleUpdateFailed);

    function handleUpdateAvailable() {
        availableToastId.current = onUpdateAvailableToast();
    }

    function handleUpdateDownloaded() {
        if (availableToastId.current) {
            toast.dismiss(availableToastId.current);
        }

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
            <StyledToastContainer position="bottom-right" />
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

const StyledToastContainer = styled(ToastContainer).attrs({
    className: 'toast-container',
    toastClassName: 'toast',
})`
    /* .toast is passed to toastClassName */
    .toast {
        background-color: ${(props) => props.theme.color.background3};
        color: ${(props) => props.theme.color.textPrimary};
        font-family: Karla;
    }

    button[aria-label='close'] {
        color: ${(props) => props.theme.color.onPrimary};

        &:hover {
            color: ${(props) => props.theme.color.textPrimary};
        }
    }
`;
