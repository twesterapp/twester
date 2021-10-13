import { logging } from 'renderer/core/logging';
import { Store } from 'renderer/core/store';
import { Storage } from 'renderer/core/storage';

const NAME = 'AUTH';

const log = logging.getLogger(NAME);

export interface User {
    displayName: string;
    id: string;
    login: string;
    profileImageUrl: string;
}

interface State {
    user: User;
    accessToken: string;
}

class Auth extends Store<State> {
    constructor() {
        super(NAME);
        this.initStore(() => this.getInitialState());
    }

    public setUser(user: User) {
        log.debug('Setting user');
        Storage.set('user', JSON.stringify(user));
        return this.store.setState({ user });
    }

    public delUser() {
        log.debug('Deleting user');
        Storage.remove('user');
        return this.store.setState({
            user: {
                displayName: '',
                id: '',
                login: '',
                profileImageUrl: '',
            },
        });
    }

    public setToken(accessToken: string) {
        Storage.set('access-token', accessToken);
        return this.store.setState({ accessToken });
    }

    public delToken() {
        Storage.remove('access-token');
        return this.store.setState({
            accessToken: '',
        });
    }

    private getInitialState(): State {
        try {
            const user: User = JSON.parse(Storage.get('user') || '');
            const accessToken = Storage.get('access-token') || '';

            log.debug(`Loaded ${this.storeName} state from storage`);
            return { user, accessToken };
        } catch (err) {
            log.error(
                `Failed to load ${this.storeName} state from storage:`,
                err.message
            );
            log.warning(`Setting ${this.storeName} state to default`);

            return {
                user: {
                    displayName: '',
                    id: '',
                    login: '',
                    profileImageUrl: '',
                },
                accessToken: '',
            };
        }
    }
}

export const auth = new Auth();
