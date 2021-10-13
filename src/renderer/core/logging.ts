import vanillaCreate from 'zustand/vanilla';
import create from 'zustand';
import { v4 as uuid } from 'uuid';

enum Level {
    EXCEPTION = 'EXCEPTION',
    ERROR = 'ERROR    ',
    WARNING = 'WARNING  ',
    INFO = 'INFO     ',
    DEBUG = 'DEBUG    ',
}

enum Hex {
    EXCEPTION = '#FF5C8A',
    ERROR = '#FF5252',
    WARNING = '#FFB703',
    INFO = '#8CD3FF',
    DEBUG = '#26ABFF',
}

interface Store {
    logs: Log[];
}

const loggerStore = vanillaCreate<Store>(() => ({
    logs: [],
}));

export const useLoggerStore = create(loggerStore);

function addLog(newLog: Log) {
    const { getState, setState } = loggerStore;
    setState({ logs: [...getState().logs, newLog] });
}

class Log {
    private loggerName: string;

    private id: string;

    private date: Date;

    private level: Level;

    private hex: Hex;

    private content: any[];

    constructor(
        loggerName: string,
        sendToMain: boolean,
        level: Level,
        ...args: any[]
    ) {
        this.id = uuid();
        this.date = new Date();
        this.loggerName = loggerName;
        this.level = level;
        this.hex = this.getHexBasedOnLevel(level);
        this.content = [...args];
        this.print();

        if (sendToMain && process.env.NODE_ENV !== 'test') {
            // @ts-ignore
            window.electron.ipcRenderer.sendLog(this);
        }
    }

    getId() {
        return this.id;
    }

    print() {
        // Example - [11-10-2021 04:19:10:394] [INFO] Starting Watcher
        const timestamp = this.formatDate(this.date);
        const str = `[${timestamp}] [${this.level}] ${this.content.join(' ')}`;

        // Trying to have better semantics
        switch (this.level) {
            case Level.EXCEPTION: {
                console.error(str);
                break;
            }

            case Level.ERROR: {
                console.error(str);
                break;
            }

            case Level.WARNING: {
                console.warn(str);
                break;
            }

            case Level.INFO: {
                console.info(str);
                break;
            }

            case Level.DEBUG: {
                console.info(str);
                break;
            }

            default: {
                console.log(str);
            }
        }
    }

    // TODO: This should be formatted based on `Settings` set for `Logging`.
    // It could be about if and not they want `timestamp`, `level` etc.
    formatForLogViewer(): string {
        return `${this.date.toLocaleDateString()} ${this.date.toLocaleTimeString()} - ${this.content.join(
            ' '
        )}`;
    }

    private formatDate(date: Date): string {
        return `${date.getDate()}-${
            // `month` value starts from 0 -> Jan
            date.getMonth() + 1
        }-${date.getFullYear()} ${date.toLocaleTimeString('en-us', {
            hour12: false,
        })},${date.getMilliseconds().toString().padStart(3, '0')}`;
    }

    private getHexBasedOnLevel(level: Level): Hex {
        switch (level) {
            case Level.EXCEPTION: {
                return Hex.EXCEPTION;
            }

            case Level.ERROR: {
                return Hex.ERROR;
            }

            case Level.WARNING: {
                return Hex.WARNING;
            }

            case Level.DEBUG: {
                return Hex.DEBUG;
            }

            case Level.INFO: {
                return Hex.INFO;
            }

            default: {
                return Hex.INFO;
            }
        }
    }
}

class Logger {
    private name: string;

    private logs = new Set<Log>();

    private sendToMain: boolean;

    constructor(name: string, sendToMain: boolean) {
        this.name = name;
        this.sendToMain = sendToMain;
    }

    exception(...args: any[]) {
        return this.newLog(Level.EXCEPTION, ...args);
    }

    error(...args: any[]) {
        return this.newLog(Level.ERROR, ...args);
    }

    warning(...args: any[]) {
        return this.newLog(Level.WARNING, ...args);
    }

    info(...args: any[]) {
        return this.newLog(Level.INFO, ...args);
    }

    debug(...args: any[]) {
        return this.newLog(Level.DEBUG, ...args);
    }

    private newLog(level: Level, ...args: any[]) {
        const log = new Log(this.name, this.sendToMain, level, ...args);
        this.logs.add(log);

        // TODO: This should be based on `Settings` for `Logging`.
        // Right now we will show only `info` logs to the user in `Logs Viewer`.
        if (level === Level.INFO) {
            addLog(log);
        }
    }
}

/**
 * Manages all the `Logger` instances.
 */
class Logging {
    private loggers = new Map<string, Logger>();

    constructor() {
        // `root` logger will only log to browser's console
        const rootLogger = new Logger('root', false);
        this.loggers.set('root', rootLogger);
    }

    getLogger(name = '', sendToMain = true): Logger {
        if (!name) {
            return this.loggers.get('root')!;
        }

        if (!this.loggers.has(name)) {
            this.loggers.set(name, new Logger(name, sendToMain));
        }

        return this.loggers.get(name)!;
    }
}

export const logging = new Logging();
