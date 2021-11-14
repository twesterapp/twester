import { getChannelContextInfo, getUserProfilePicture } from './data';

import { Storage } from 'renderer/utils/storage';
import { Store } from 'renderer/utils/store';
import { logging } from 'renderer/core/logging';

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

export class Auth extends Store<State> {
    constructor() {
        super(NAME);
        this.initStore(() => this.getInitialState());
    }

    public async login(token: string, username: string) {
        this.setToken(token);
        const result = await getChannelContextInfo(username);

        // This should never happen but if somehow it did happen, we will logout
        // the user
        if (!result) {
            log.exception(
                'No channel context info found for the logged in user. This should have never happened.'
            );
            this.logout();
            return;
        }

        const profileImageUrl = await getUserProfilePicture(result.id);

        const user: User = {
            displayName: result.displayName,
            id: result.id,
            login: result.login,
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
