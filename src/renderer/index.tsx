import { App } from './App';
import { ChannelPoints } from 'renderer/core/channel-points';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './pages';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { api } from 'renderer/core/api';
import { auth } from 'renderer/core/auth';
import { darkTheme } from './ui';
import { logging } from 'renderer/core/logging';
import { render } from 'react-dom';
import { streamers } from 'renderer/core/streamer-manager';
import { watcher } from 'renderer/core/watcher';
import { settings } from 'renderer/core/settings';

render(
    <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => window.location.reload()}
    >
        <ThemeProvider theme={darkTheme}>
            <App />
        </ThemeProvider>
    </ErrorBoundary>,
    document.getElementById('root')
);

/**
 * Modules from `src/renderer/core` provide the core functionality of `Twester`.
 *
 * What I have done below is attach core modules to the `twester` obj so
 * that I can access every modules and their state from browser console.
 *
 * Example: In browser/electron window console -> `twester.streamers`
 * gives access to array of `Streamer` objects which have streamer state.
 *
 * This helps with debugging by providing what Twester's current state is.
 *
 * Watcher -> PubSub -> Topic & Raid
 * StreamerManager -> Streamer -> Stream
 * Auth
 * API
 * LoggerManager -> Logger -> Log
 * ChannelPoints
 */

interface Global {
    [key: string]: any; // Add index signature
}

const twester = {
    watcher,
    streamers,
    auth,
    api,
    logging,
    ChannelPoints,
    settings,
};

(globalThis as Global).twester = twester;
