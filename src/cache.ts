/* Copyright 2024 Schibsted Products & Technology AS. Licensed under the terms of the MIT license.
 * See LICENSE.md in the project root.
 */

import SDKError from './SDKError.js';

/**
 * Check whether we are able to use web storage
 * @param storeProvider - A function to return a WebStorage instance (either
 * `sessionStorage` or `localStorage` from a `Window` object)
 * @private
 */
function webStorageWorks(storeProvider?: () => Storage): boolean {
    if (!storeProvider) {
        return false;
    }
    try {
        const store = storeProvider();
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

interface CacheInterface {
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
    delete: (key: string) => void;
}

interface CachedObject<T> {
    expiresOn: number;
    value: T;
}

/**
 * Will be used if web storage is available
 * @private
 */
class WebStorageCache implements CacheInterface {
    store: Storage;
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
    delete: (key: string) => void;

    /**
     * Create web storage cache object
     * @param store - A reference to either `sessionStorage` or `localStorage` from a
     * `Window` object
     */
    constructor(store: Storage) {
        this.store = store;
        this.get = (key: string) => this.store.getItem(key);
        this.set = (key: string, value: string) => this.store.setItem(key, value);
        this.delete = (key: string) => this.store.removeItem(key);
    }
}

/**
 * Will be used if session storage is not available
 * @private
 */
class LiteralCache implements CacheInterface {
    store: Record<string, string>;
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
    delete: (key: string) => void;

    /**
     * Create JS object literal cache object
     */
    constructor() {
        this.store = {};
        this.get = (key: string) => this.store[key];
        this.set = (key: string, value: string) => this.store[key] = value;
        this.delete = (key: string) => delete this.store[key];
    }
}

const maxExpiresIn = Math.pow(2, 31) - 1;

/**
 * Cache class that attempts WebStorage (session/local storage), and falls back to JS object literal
 * @private
 */
export default class Cache<T = unknown> {
    cache: CacheInterface;
    type: string;

    /**
     * @param storeProvider - A function to return a WebStorage instance (either
     * `sessionStorage` or `localStorage` from a `Window` object)
     * @throws {SDKError} If sessionStorage or localStorage are not accessible
     */
    constructor(storeProvider?: () => Storage) {
        if (webStorageWorks(storeProvider)) {
            this.cache = new WebStorageCache(storeProvider!());
            this.type = 'WebStorage';
        } else {
            this.cache = new LiteralCache();
            this.type = 'ObjectLiteralStorage';
        }
    }

    /**
     * Get a value from cache (checks that the object has not expired)
     * @param key - The cache key
     * @private
     */
    get(key: string): T | null {
        /**
         * JSON.parse safe wrapper
         * @param raw - The raw string from storage
         * @returns Parsed value or null if failed to parse
         */
        function getObj(raw: string | null): CachedObject<T> | null {
            try {
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        }

        try {
            const raw = this.cache.get(key);
            const obj = getObj(raw);
            if (obj && Number.isInteger(obj.expiresOn) && obj.expiresOn > Date.now()) {
                return obj.value;
            }
            this.delete(key);
            return null;
        } catch (e) {
            throw new SDKError(e as string);
        }
    }

    /**
     * Set a cache entry
     * @param key - The cache key
     * @param value - The value to cache
     * @param expiresIn - Value in milliseconds until the entry expires
     * @private
     */
    set(key: string, value: T, expiresIn = 0): void {
        if (expiresIn <= 0) {
            return;
        }
        expiresIn = Math.min(maxExpiresIn, expiresIn);

        try {
            const expiresOn = Math.floor(Date.now() + expiresIn);
            this.cache.set(key, JSON.stringify({ expiresOn, value }));
            setTimeout(() => this.delete(key), expiresIn);
        } catch (e) {
            throw new SDKError(e as string);
        }
    }

    /**
     * Delete a cache entry
     * @param key - The cache key
     * @private
     */
    delete(key: string): void {
        try {
            this.cache.delete(key);
        } catch (e) {
            throw new SDKError(e as string);
        }
    }
}
