import React from 'react';
import { FallbackProps } from 'react-error-boundary';

// This is very basic fallback just to let the user at least reload the app
// if it breaks.
export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    console.log('FALLBACK?');
    return (
        <div
            role="alert"
            style={{
                width: '100vw',
                height: '100vh',
                background: '#00A8E8',
                color: '#F1F1F1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Poppins',
            }}
        >
            <h1>Something went wrong 😢</h1>
            <pre>{error.message}</pre>
            <button type="button" onClick={resetErrorBoundary}>
                Reload App
            </button>
        </div>
    );
}
