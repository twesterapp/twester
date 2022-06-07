import { auth } from './auth';
import { getIpc } from 'renderer/utils/ipc';
import { logging } from './logging';
import { Storage } from '../utils/storage';
import { Store } from 'renderer/utils/store';

const ipc = getIpc();

interface State {
    closeToTray: boolean;
    developerMode: boolean;
}

const NAME = 'SETTINGS';
const log = logging.getLogger(NAME);

export class Settings extends Store<State> {
    constructor() {
        super(NAME);
        this.initStore(() => this.getInitialState());
    }

    public toggleCloseToTry() {
        this.store.setState({
            closeToTray: !this.store.getState().closeToTray,
        });
        ipc.sendSettings(this.store.getState());
        this.syncStorageWithStore();
    }

    public toggleDeveloperMode() {
        this.store.setState({
            developerMode: !this.store.getState().developerMode,
        });
        ipc.sendSettings(this.store.getState());
        this.syncStorageWithStore();
    }

    private syncStorageWithStore() {
        Storage.set(
            this.getStorageKey(),
            JSON.stringify(this.store.getState())
        );
    }

    private getStorageKey() {
        return `${auth.store.getState().user.id}.settings`;
    }

    private getInitialState(): State {
        try {
            const savedState: State = JSON.parse(
                Storage.get(this.getStorageKey()) || ''
            );

            log.debug(`Loaded ${this.storeName} state from storage`);

            return savedState;
        } catch (err: any) {
            log.error(
                `Failed to load ${this.storeName} state from storage:`,
                err.message
            );
            log.warning(`Setting ${this.storeName} state to default`);

            return {
                closeToTray: false,
                developerMode: false,
            };
        }
    }
}

export const settings = new Settings();
