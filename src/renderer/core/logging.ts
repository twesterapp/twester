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
    EXCEPTION = '#FF5252',
    ERROR = '#FF5C8A',
    WARNING = '#FFB703',
    INFO = '#0AD48B',
    DEBUG = '#8ECAE6',
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

    private _id: string;

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
        this._id = uuid();
        this.date = new Date();
        this.loggerName = loggerName;
        this.level = level;
        this.hex = this.getHexBasedOnLevel(level);
        this.content = [...args];
        this.print();

        if (sendToMain) {
            // @ts-ignore
            window.electron.ipcRenderer.sendLog(this);
        }
    }

    get id() {
        return this._id;
    }

    print() {
        // [11-10-2021 04:19:10:394] [INFO] Starting Watcher
        const timestamp = this.formatDateForLogging(this.date);
        console.log(`[${timestamp}] [${this.level}] ${this.content.join(' ')}`);
    }

    // TODO: This should be formatted based on `Settings` set for `Logging`.
    // It could be about if and not they want `timestamp`, `level` etc.
    asString(): string {
        return `${this.date.toLocaleDateString()} ${this.date.toLocaleTimeString()} - ${this.content.join(
            ' '
        )}`;
    }

    private formatDateForLogging(date: Date): string {
        return `${date.getDate()}-${
            date.getMonth() + 1
        }-${date.getFullYear()} ${date.toLocaleTimeString('en-us', {
            hour12: false,
        })}:${date.getMilliseconds().toString().padStart(3, '0')}`;
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

    constructor(name: string, sendToMain = true) {
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

        if (level !== Level.DEBUG) {
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
        const rootLogger = new Logger('root');
        this.loggers.set('root', rootLogger);
    }

    getLogger(name?: string): Logger {
        if (!name) {
            return this.loggers.get('root')!;
        }

        if (!this.loggers.has(name)) {
            this.loggers.set(name, new Logger(name));
        }

        return this.loggers.get(name)!;
    }
}

export const logging = new Logging();
export type LoggerType = InstanceType<typeof Logger>;
