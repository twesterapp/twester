import { Store } from '../renderer/core/store';

interface StoreState {
    count: number;
}

function getInitialState(): StoreState {
    return { count: 0 };
}

const testStore = new Store('test', getInitialState);

describe('tests Store class', () => {
    it('creates a Store instance', () => {
        const store = new Store('test', getInitialState);
        expect(store instanceof Store).toBeTruthy();
    });

    it('gets store name', () => {
        expect(testStore.name).toEqual('test-store');
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
});
