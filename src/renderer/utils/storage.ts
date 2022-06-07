import { logging } from 'renderer/core/logging';

const NAME = 'STORAGE';

const log = logging.getLogger(NAME);

export class Storage {
    public static set(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch (err: any) {
            log.error(`Failed to save "${key}" to storage:`, err.message);
        }
    }

    public static get(key: string): string | null {
        try {
            const val = localStorage.getItem(key);
            return val;
        } catch (err: any) {
            log.error(`Failed to fetch "${key}" from storage:`, err.message);
            throw err;
        }
    }

    public static remove(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (err: any) {
            log.error(`Failed to remove "${key}" from storage:`, err.message);
        }
    }
}
