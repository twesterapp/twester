import React from 'react';
import { render } from 'react-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { ThemeProvider } from 'styled-components';
import { App } from './App';
import { ErrorFallback } from './screens';
import { darkTheme } from './ui';

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
