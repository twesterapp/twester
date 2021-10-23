import { v4 as uuid } from 'uuid';
import { Store } from 'renderer/utils/store';
import { getIpc } from 'renderer/utils/ipc';

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

interface State {
    logs: Log[];
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
            getIpc().sendLog(this);
        }
    }

    public getId() {
        return this.id;
    }

    public print() {
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
    public formatForLogViewer(): string {
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

    private shouldSendToMain: boolean;

    private loggerManager: LoggerManager;

    constructor(
        loggerManger: LoggerManager,
        name: string,
        shouldSendToMain: boolean
    ) {
        this.loggerManager = loggerManger;
        this.name = name;
        this.shouldSendToMain = shouldSendToMain;
    }

    public exception(...args: any[]) {
        return this.newLog(Level.EXCEPTION, ...args);
    }

    public error(...args: any[]) {
        return this.newLog(Level.ERROR, ...args);
    }

    public warning(...args: any[]) {
        return this.newLog(Level.WARNING, ...args);
    }

    public info(...args: any[]) {
        return this.newLog(Level.INFO, ...args);
    }

    public debug(...args: any[]) {
        return this.newLog(Level.DEBUG, ...args);
    }

    private newLog(level: Level, ...args: any[]) {
        const log = new Log(this.name, this.shouldSendToMain, level, ...args);
        this.logs.add(log);

        // TODO: This should be based on `Settings` for `Logging`.
        // Right now we will show only `info` logs to the user in `Logs Viewer`.
        if (level === Level.INFO) {
            this.loggerManager.addLogToStore(log);
        }
    }
}

/**
 * Manages all the `Logger` instances.
 */
class LoggerManager extends Store<State> {
    private loggers = new Map<string, Logger>();

    constructor() {
        super('LOGGING');
        this.initStore(() => this.getInitialState());

        // `root` logger will only log to browser's console
        const rootLogger = new Logger(this, 'root', false);
        this.loggers.set('root', rootLogger);
    }

    public getLogger(name = '', sendToMain = true): Logger {
        if (!name) {
            return this.loggers.get('root')!;
        }

        if (!this.loggers.has(name)) {
            this.loggers.set(name, new Logger(this, name, sendToMain));
        }

        return this.loggers.get(name)!;
    }

    public addLogToStore(newLog: Log): void {
        this.store.setState({ logs: [...this.store.getState().logs, newLog] });
    }

    private getInitialState(): State {
        return { logs: [] };
    }
}

export const logging = new LoggerManager();
