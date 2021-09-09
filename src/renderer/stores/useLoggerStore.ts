import vanillaCreate from 'zustand/vanilla';
import create from 'zustand';
import { isProd } from 'renderer/utils';

enum LoggingLevel {
    INFO = 0,
    DEBUG = 1,
}

export interface Log {
    id: string;
    timestamp: Date;
    text: string;
}

interface State {
    logs: Log[];
    level: LoggingLevel;
}

const loggerStore = vanillaCreate<State>(() => ({
    logs: [],
    // TODO: This should be fetched from the settings if user has set one.
    level: LoggingLevel.INFO,
}));

export const useLoggerStore = create(loggerStore);

function addLog(newLog: Log) {
    const { getState, setState } = loggerStore;
    const logs = getState().logs;
    setState({ logs: [...logs, newLog] });
}

function getLoggingLevel(): LoggingLevel {
    return loggerStore.getState().level;
}

export class Logger {
    // This will be added to the beginning of the log text if
    // `level` is >= `DEBUG`.
    // Example - `WATCHER`.
    private prefix: string;

    private level: LoggingLevel;

    private logToConsole: boolean;

    constructor({
        prefix = '',
        level = getLoggingLevel(),
        logToConsole = !isProd,
    } = {}) {
        this.prefix = prefix;
        this.level = level;
        this.logToConsole = logToConsole;
    }

    info(text: string) {
        return this.log(text, LoggingLevel.INFO);
    }

    debug(text: string) {
        return this.log(text, LoggingLevel.DEBUG);
    }

    private log(text: string, level: LoggingLevel) {
        const _text =
            level >= LoggingLevel.DEBUG ? `[${this.prefix}]: ${text}` : text;
        const timestamp = new Date();
        const id = loggerStore.getState().logs.length;

        if (this.logToConsole) {
            console.log(
                `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}\n ${_text} `
            );
        }

        if (this.level >= level) {
            addLog({
                id: id.toString(),
                timestamp,
                text: _text,
            });
        }
    }
}
