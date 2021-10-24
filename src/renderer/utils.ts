import { logging } from 'renderer/core/logging';
import {
    getChannelContextInfo,
    getUserProfilePicture,
} from 'renderer/core/data';
import { auth, User } from 'renderer/core/auth';

const log = logging.getLogger('UTILS');

export async function login(token: string, username: string) {
    auth.setToken(token);
    const result = await getChannelContextInfo(username);

    // This should never happen but if somehow it did happen, we will logout
    // the user
    if (!result) {
        log.exception(
            'No channel context info found for the logged in user. This should have never happened.'
        );
        auth.signout();
        return;
    }

    const profileImageUrl = await getUserProfilePicture(result.id);

    const user: User = {
        displayName: result.displayName,
        id: result.id,
        login: result.login,
        profileImageUrl,
    };
    auth.setUser(user);
    window.location.reload();
}

export function px2em(valInPx: number): string {
    const valInEm = valInPx / 16;
    return `${valInEm}em`;
}

export function px2rem(valInPx: number): string {
    const valInEm = valInPx / 16;
    return `${valInEm}rem`;
}
