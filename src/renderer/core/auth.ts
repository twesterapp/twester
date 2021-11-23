import { Storage } from '../utils/storage';
import { Store } from '../utils/store';
import { api } from './api';
import { logging } from './logging';

const NAME = 'AUTH';

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

const log = logging.getLogger('AUTH');

export class Auth extends Store<State> {
    constructor() {
        super(NAME);
        this.initStore(() => this.getInitialState());
    }

    public async login(token: string, username: string) {
        this.setToken(token);
        const channel = await api.getChannelContext(username);

        // This should never happen!
        if (!channel) {
            log.exception(
                'No channel context info found for the logged in user. This should have never happened.'
            );
            return this.logout();
        }

        const profileImageUrl = await api.getUserProfilePicture(channel.id);
        const user: User = {
            displayName: channel.displayName,
            id: channel.id,
            login: channel.login,
            profileImageUrl,
        };

        this.setUser(user);
        window.location.reload();
    }

    public logout() {
        this.delToken();
        this.delUser();
        window.location.reload();
    }

    private setUser(user: User) {
        log.debug('Setting user');
        Storage.set('user', JSON.stringify(user));
        return this.store.setState({ user });
    }

    private delUser() {
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

    private setToken(accessToken: string) {
        Storage.set('access-token', accessToken);
        return this.store.setState({ accessToken });
    }

    private delToken() {
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
