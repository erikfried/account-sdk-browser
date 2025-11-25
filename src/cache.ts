/* Copyright 2024 Schibsted Products & Technology AS. Licensed under the terms of the MIT license.
 * See LICENSE.md in the project root.
 */

import SDKError from './SDKError';

/**
 * Check whether we are able to use web storage
 * @param {Storage} storeProvider - A function to return a WebStorage instance (either
 * `sessionStorage` or `localStorage` from a `Window` object)
 * @private
 * @returns {boolean}
 */
function webStorageWorks(storeProvider: (() => Storage | null) | undefined): boolean {
    if (!storeProvider) {
        return false;
    }
    try {
        const store = storeProvider();
        if (!store) {
            return false;
        }
        const randomKey = 'x-x-x-x'.replace(/x/g, () => String(Math.random()));
        const testValue = 'TEST-VALUE';
        store.setItem(randomKey, testValue);
        const val = store.getItem(randomKey);
        store.removeItem(randomKey);
        return (val === testValue);
    } catch (e) {
        return false;
    }
}

/**
 * Will be used if web storage is available
 * @private
 */
class WebStorageCache {
    store: Storage;
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
    delete: (key: string) => void;

    /**
     * Create web storage cache object
     * @param {Storage} store - A reference to either `sessionStorage` or `localStorage` from a
     * `Window` object
     */
    constructor(store: Storage) {
        this.store = store;
        this.get = (key) => this.store.getItem(key);
        this.set = (key, value) => this.store.setItem(key, value);
        this.delete = (key) => this.store.removeItem(key);
    }
}

/**
 * Will be used if session storage is not available
 * @private
 */
class LiteralCache {
    store: { [key: string]: any };
    get: (key: string) => any;
    set: (key: string, value: any) => any;
    delete: (key: string) => boolean;

    /**
     * Create JS object literal cache object
     */
    constructor() {
        this.store = {};
        this.get = (key) => this.store[key];
        this.set = (key, value) => this.store[key] = value;
        this.delete = (key) => delete this.store[key];
    }
}

const maxExpiresIn = Math.pow(2, 31) - 1;

/**
 * Cache class that attempts WebStorage (session/local storage), and falls back to JS object literal
 * @private
 */
export default class Cache {
    cache: WebStorageCache | LiteralCache;
    type: string;

    /**
     * @param {Storage} [storeProvider] - A function to return a WebStorage instance (either
     * `sessionStorage` or `localStorage` from a `Window` object)
     * @throws {SDKError} - If sessionStorage or localStorage are not accessible
     */
    constructor(storeProvider?: () => Storage | null) {
        if (webStorageWorks(storeProvider)) {
            const store = storeProvider!();
            // At this point webStorageWorks has verified store is not null
            this.cache = new WebStorageCache(store!);
            this.type = 'WebStorage';
        } else {
            this.cache = new LiteralCache();
            this.type = 'ObjectLiteralStorage';
        }
    }

    /**
     * Get a value from cache (checks that the object has not expired)
     * @param {string} key
     * @private
     * @returns {*} - The value if it exists, otherwise null
     */
    get(key: string): any {
        /**
         * JSON.parse safe wrapper
         * @param {string} raw
         * @returns {*} parsed value or null if failed to parse
         */
        function getObj(raw: string | null): any {
            try {
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        }

        try {
            const raw = this.cache.get(key);
            let obj = getObj(raw);
            if (obj && Number.isInteger(obj.expiresOn) && obj.expiresOn > Date.now()) {
                return obj.value;
            }
            this.delete(key);
            return null;
        } catch (e) {
            throw new SDKError(String(e));
        }
    }

    /**
     * Set a cache entry
     * @param {string} key
     * @param {*} value
     * @param {Number} expiresIn - Value in milliseconds until the entry expires
     * @private
     * @returns {void}
     */
    set(key: string, value: any, expiresIn: number = 0): void {
        if (expiresIn <= 0) {
            return;
        }
        expiresIn = Math.min(maxExpiresIn, expiresIn);

        try {
            const expiresOn = Math.floor(Date.now() + expiresIn);
            this.cache.set(key, JSON.stringify({ expiresOn, value }));
            setTimeout(() => this.delete(key), expiresIn);
        } catch (e) {
            throw new SDKError(String(e));
        }
    }

    /**
     * Delete a cache entry
     * @param {string} key
     * @private
     * @returns {void}
     */
    delete(key: string): void {
        try {
            this.cache.delete(key);
        } catch (e) {
            throw new SDKError(String(e));
        }
    }
}
