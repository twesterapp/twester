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

/**
 * Hex, print() and formatDate() are copied here from `renderer/core/logging`.
 * I can't seem to share code between `main` and `renderer`, hence the
 * duplication. I am doing this because of the logging is done in `renderer`
 * and a little bit logging is done by the server running in `main` process
 * for Twitch auth and other stuff. This provides us a consitent logging
 * behavior and look as the logging done in `renderer`.
 */

export enum Level {
    EXCEPTION = 'EXCEPTION',
    ERROR = 'ERROR    ',
    WARNING = 'WARNING  ',
    INFO = 'INFO     ',
    DEBUG = 'DEBUG    ',
}

export enum Hex {
    EXCEPTION = '#FF5252',
    ERROR = '#FF5C8A',
    WARNING = '#FFB703',
    INFO = '#8CD3FF',
    DEBUG = '#26ABFF',
}

export function print(
    date: Date,
    level: string,
    hex: string,
    ...content: any[]
) {
    const timestamp = formatDate(date);
    const prefix = `[${timestamp}] [${chalk.hex(hex)(level)}]`;
    // [11-10-2021 04:19:10:394] [INFO] Starting Watcher
    console.log(prefix, ...content);
}

function formatDate(date: Date): string {
    return `${date.getDate()}-${
        date.getMonth() + 1
    }-${date.getFullYear()} ${date.toLocaleTimeString('en-us', {
        hour12: false,
    })},${date.getMilliseconds().toString().padStart(3, '0')}`;
}
