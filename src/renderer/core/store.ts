import create, { StoreApi, UseStore } from 'zustand';
import vanillaCreate from 'zustand/vanilla';

export class Store<T extends Record<string, any>> {
    readonly _name: string;

    private _store: StoreApi<T>;

    constructor(name: string, initialize: () => T) {
        this._name = `${name}-store`;
        this._store = vanillaCreate(() => initialize());
    }

    get name() {
        return this._name;
    }

    get store(): StoreApi<T> {
        return this._store;
    }

    public useStore(): UseStore<T> {
        return create(this._store);
    }
}
