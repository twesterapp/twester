import { signout } from 'renderer/utils/auth';
import { getChannelContextInfo, getUserProfilePicture } from './core/data';
import { setToken, setUser, User } from './stores/useAuthStore';

export async function login(token: string, username: string) {
    setToken(token);
    const result = await getChannelContextInfo(username);

    // This should never happen but if somehow it did happen, we will logout
    // the user
    if (!result) {
        return signout();
    }

    const profileImageUrl = await getUserProfilePicture(result.id);

    const user: User = {
        displayName: result.displayName,
        id: result.id,
        login: result.login,
        profileImageUrl,
    };
    setUser(user);
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

export function noop() {}

let abortController: AbortController | null = null;

export async function sleep(sec: number) {
    if (!abortController) {
        abortController = new AbortController();
    }

    try {
        await innerSleep(sec, abortController.signal);
    } catch (e) {
        if (abortController) {
            abortController = null;
        }
    }
}

function innerSleep(sec: number, signal: AbortSignal) {
    return new Promise((resolve, reject) => {
        const error = new DOMException('Sleeping aborted', 'AbortError');

        if (signal.aborted) {
            return reject(error);
        }

        const timeout = setTimeout(() => {
            return resolve(1);
        }, sec * 1000);

        signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(error);
        });
    });
}

export function abortAllSleepingTasks() {
    if (abortController) {
        console.log('Aborting all sleeping tasks currently in progress');
        abortController.abort();
    }
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
