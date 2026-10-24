"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCached = getCached;
exports.setCached = setCached;
exports.invalidateCachePrefix = invalidateCachePrefix;
exports.clearCache = clearCache;
const cache = new Map();
function getCached(key) {
    const entry = cache.get(key);
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}
function setCached(key, data, ttlMs = 5000) {
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
function invalidateCachePrefix(prefix) {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}
function clearCache() {
    cache.clear();
}
