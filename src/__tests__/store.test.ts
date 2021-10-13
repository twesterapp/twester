import { Store } from '../renderer/core/store';

interface StoreState {
    count: number;
}

function initializer(): StoreState {
    return { count: 0 };
}

const testStore = new Store('test');
testStore.initStore(initializer);

describe('tests Store class', () => {
    it('creates a Store instance', () => {
        const store = new Store('test');
        expect(store instanceof Store).toBeTruthy();
    });

    it('gets store name', () => {
        expect(testStore.storeName).toEqual('test-store');
    });

    it('gets state from store', () => {
        const count = testStore.store.getState().count;
        expect(count).toEqual(0);
    });

    it('updates state in store', () => {
        const newCount = testStore.store.getState().count + 1;
        testStore.store.setState({ count: newCount });
        expect(testStore.store.getState().count).toEqual(newCount);
    });

    it('should throw an error if Store.store() called before Store.init()', () => {
        const testStore = new Store('test');
        expect(() => testStore.store).toThrow(
            `Store is not initialized: Store.store() was called before calling Store.init()`
        );
    });

    it('should throw an error if Store.useStore() called before Store.init()', () => {
        const testStore = new Store('test');
        expect(() => testStore.useStore()).toThrow(
            `Store is not initialized: Store.useStore() was called before calling Store.init()`
        );
    });
});
