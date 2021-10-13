import { logging } from 'renderer/core/logging';

const NAME = 'STORAGE';

const log = logging.getLogger(NAME);

export class Storage {
    public static set(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
            log.debug(`"${key}" saved to storage`);
        } catch (err) {
            log.error(`Failed to save "${key}" to storage:`, err.message);
        }
    }

    public static get(key: string): string | null {
        try {
            const val = localStorage.getItem(key);
            log.debug(`"${key}" fetched from storage`);
            return val;
        } catch (err) {
            log.error(`Failed to fetch "${key}" from storage:`, err.message);
            throw err;
        }
    }

    public static remove(key: string): void {
        try {
            localStorage.removeItem(key);
            log.debug(`"${key}" removed from storage`);
        } catch (err) {
            log.error(`Failed to remove "${key}" from storage:`, err.message);
        }
    }
}
