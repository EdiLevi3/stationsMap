import '@testing-library/jest-dom';

// Ensure localStorage is available in jsdom test environment
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
    const store = {};
    globalThis.localStorage = {
        getItem: (key) => store[key] ?? null,
        setItem: (key, value) => { store[key] = String(value); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach((key) => delete store[key]); },
        get length() { return Object.keys(store).length; },
        key: (i) => Object.keys(store)[i] ?? null,
    };
}
