import { logging } from 'renderer/core/logging';

const log = logging.getLogger('SLEEP');

class Sleep {
    private abortController: AbortController | null;

    constructor() {
        this.abortController = null;
    }

    public async forSecs(durationInSecs: number): Promise<void> {
        if (!this.abortController) {
            this.abortController = new AbortController();
        }

        try {
            await this.innerSleep(durationInSecs, this.abortController.signal);
        } catch (e) {
            if (this.abortController) {
                this.abortController = null;
            }
        }
    }

    public abort(): void {
        if (this.abortController) {
            log.debug('Aborting all sleeping tasks currently in progress');
            this.abortController.abort();
        }
    }

    private async innerSleep(
        durationInSecs: number,
        abortSignal: AbortSignal
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const error = new DOMException('Sleeping aborted', 'AbortError');

            if (abortSignal.aborted) {
                return reject(error);
            }

            const timeout = setTimeout(() => {
                return resolve();
            }, durationInSecs * 1000);

            abortSignal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
}

export const sleep = new Sleep();
