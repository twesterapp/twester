import React from 'react';
import { render } from 'react-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { App } from './App';
import { ErrorFallback } from './screens';

render(
    <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => window.location.reload()}
    >
        <App />
    </ErrorBoundary>,
    document.getElementById('root')
);
