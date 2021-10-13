import create, { StoreApi, UseStore } from 'zustand';
import vanillaCreate from 'zustand/vanilla';

export class Store<T extends Record<string, any>> {
    readonly _name: string;

    private _store: StoreApi<T> | null = null;

    private _useStore: UseStore<T> | null = null;

    constructor(name: string) {
        this._name = `${name}-store`;
    }

    get storeName(): string {
        return this._name;
    }

    get store(): StoreApi<T> {
        if (!this._store) {
            throw new Error(
                `Store is not initialized: Store.store() was called before calling Store.init()`
            );
        }

        return this._store;
    }

    get useStore(): UseStore<T> {
        if (!this._useStore) {
            throw new Error(
                `Store is not initialized: Store.useStore() was called before calling Store.init()`
            );
        }

        return this._useStore;
    }

    public initStore(initializer: () => T) {
        const store = vanillaCreate(() => {
            return initializer();
        });
        this._store = store;
        this._useStore = create(store);
    }
}
