import { fetchChannelInfo } from './api';
import { User, setUser, setToken } from './stores/useAuthStore';

export const isProd = process.env.NODE_ENV === 'PRODUCTION';

export function fakeLogin() {
    const user: User = {
        id: '670111413',
        displayName: 'ceoshikhar',
        login: 'ceoshikhar',
        profileImageUrl:
            'https://static-cdn.jtvnw.net/jtv_user_pictures/40f633ca-8793-4eb7-bcd9-a225d5879537-profile_image-300x300.pn0',
    };

    setUser(user);
    setToken('ep0202p2qbm0pqx34edauumbuwerl2');
    window.location.reload();
}

export async function login(token: string, username: string) {
    setToken(token);
    const result = await fetchChannelInfo(username);
    const info = result.data.data[0];
    const user: User = {
        displayName: info.display_name,
        id: info.id,
        login: info.login,
        profileImageUrl: info.profile_image_url,
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

export function rightNowInSecs(): number {
    return Math.floor(Date.now() / 1000);
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
