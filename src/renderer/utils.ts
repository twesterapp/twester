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

export function formatMinutesToString(_mins: number): string {
    const hours = Math.floor(_mins / 60);
    const days = Math.floor(hours / 24);
    const mins = hours ? _mins % 60 : _mins;

    // 3d 21h 43m
    // `0m` only for `m`. If it's `0h 42m`, we ignore `0h`. Same for `0d`
    let formattedString = '';

    if (days) formattedString += `${days}d`;
    if (hours || (!hours && days)) formattedString += ` ${hours}h`;
    formattedString += ` ${mins}m`;

    return formattedString;
}
