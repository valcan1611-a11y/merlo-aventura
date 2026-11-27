/**
 * Capa de persistencia segura en localStorage con fallback en memoria.
 * Evita errores fatales en modo incógnito, cuotas llenas o JSON corrupto.
 */

const memoryFallback = new Map();

function isLocalStorageAvailable() {
    try {
        const testKey = '__ma_storage_test__';
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
}

const hasLocalStorage = isLocalStorageAvailable();

export const storageService = {
    isPersistent: hasLocalStorage,

    getItem(key, fallback = null) {
        try {
            if (hasLocalStorage) {
                const val = window.localStorage.getItem(key);
                return val !== null ? val : fallback;
            }
            return memoryFallback.has(key) ? memoryFallback.get(key) : fallback;
        } catch {
            return fallback;
        }
    },

    setItem(key, value) {
        try {
            if (hasLocalStorage) {
                window.localStorage.setItem(key, value);
                return true;
            }
            memoryFallback.set(key, value);
            return true;
        } catch (err) {
            console.warn('[storageService] Error guardando clave:', key, err);
            memoryFallback.set(key, value);
            return false;
        }
    },

    getJSON(key, fallback) {
        const raw = this.getItem(key, null);
        if (raw === null) return fallback;
        try {
            return JSON.parse(raw);
        } catch (err) {
            console.warn('[storageService] JSON corrupto en clave:', key, err);
            return fallback;
        }
    },

    setJSON(key, value) {
        try {
            return this.setItem(key, JSON.stringify(value));
        } catch (err) {
            console.warn('[storageService] Error serializando clave:', key, err);
            return false;
        }
    },

    removeItem(key) {
        try {
            if (hasLocalStorage) {
                window.localStorage.removeItem(key);
            }
            memoryFallback.delete(key);
        } catch {
            // ignore
        }
    }
};
