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

// Converts minutes to `Ad Bh Cm` format where A = days, B = hours, C = mins
export function formatMinutesToString(mins: number): string {
    const days = Math.floor(mins / 24 / 60);
    const hours = Math.floor((mins / 60) % 24);
    const _mins = Math.floor(mins % 60);

    // 3d 21h 43m
    // `0m` only for `m`. If it's `0h 42m`, we ignore `0h`. Same for `0d`
    let formattedString = '';

    if (days) formattedString += `${days}d`;
    if (hours || (!hours && days)) formattedString += ` ${hours}h`;
    formattedString += ` ${_mins}m`;

    return formattedString;
}
