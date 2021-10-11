/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import { URL } from 'url';
import path from 'path';
import chalk from 'chalk';

export const isDev = process.env.NODE_ENV === 'development';

export let resolveHtmlPath: (htmlFileName: string) => string;

if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    resolveHtmlPath = (htmlFileName: string) => {
        const url = new URL(`http://localhost:${port}`);
        url.pathname = htmlFileName;
        return url.href;
    };
} else {
    resolveHtmlPath = (htmlFileName: string) => {
        return `file://${path.resolve(
            __dirname,
            '../renderer/',
            htmlFileName
        )}`;
    };
}

export const Hex = {
    EXCEPTION: '#FF5252',
    ERROR: '#FF5C8A',
    WARNING: '#FFB703',
    INFO: '#0AD48B',
    DEBUG: '#8ECAE6',
};

export function print(
    date: Date,
    level: string,
    hex: string,
    ...content: any[]
) {
    const timestamp = formatDateForLogging(date);
    // [11-10-2021 04:19:10:394] [INFO] Starting Watcher
    console.log(
        `[${timestamp}] [${chalk.hex(hex)(level)}] ${content.join(' ')}`
    );
}

function formatDateForLogging(date: Date): string {
    return `${date.getDate()}-${
        date.getMonth() + 1
    }-${date.getFullYear()} ${date.toLocaleTimeString('en-us', {
        hour12: false,
    })}:${date.getMilliseconds().toString().padStart(3, '0')}`;
}
