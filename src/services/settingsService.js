/**
 * Servicio centralizado de configuración operativa (contacto, banco, Mercado Pago y acceso admin).
 * Migra claves legacy y notifica cambios reactivamente a toda la UI.
 */

import { SITE_CONFIG } from '../data/siteConfig.js';
import { storageService } from './storageService.js';
import { sanitizePhoneDigits } from '../utils/formatters.js';

const SETTINGS_KEY = 'ma_settings_v2';
const listeners = new Set();

function migrateLegacySettings() {
    const existing = storageService.getJSON(SETTINGS_KEY, null);
    if (existing) {
        return { ...SITE_CONFIG.defaults, ...existing };
    }

    const legacyWhatsapp = storageService.getItem('ma_whatsapp', '');
    const legacyAlias = storageService.getItem('ma_alias', '');
    const legacyCbu = storageService.getItem('ma_cbu', '');
    const legacyMp = storageService.getItem('ma_mp_token', '');

    const merged = {
        ...SITE_CONFIG.defaults,
        ...(legacyWhatsapp ? { whatsappRaw: sanitizePhoneDigits(legacyWhatsapp) } : {}),
        ...(legacyAlias ? { bankAlias: legacyAlias.trim() } : {}),
        ...(legacyCbu ? { bankCbu: legacyCbu.trim() } : {}),
        ...(legacyMp && legacyMp.startsWith('http')
            ? { mpCheckoutUrl: legacyMp.trim(), mpMode: 'link' }
            : {})
    };

    storageService.setJSON(SETTINGS_KEY, merged);
    return merged;
}

let currentSettings = migrateLegacySettings();

export const settingsService = {
    getSettings() {
        return { ...currentSettings };
    },

    updateSettings(partial) {
        const next = { ...currentSettings };

        if (typeof partial.whatsappRaw === 'string') {
            const cleaned = sanitizePhoneDigits(partial.whatsappRaw);
            if (cleaned.length >= 8) {
                next.whatsappRaw = cleaned;
            }
        }
        if (typeof partial.whatsappDisplay === 'string' && partial.whatsappDisplay.trim()) {
            next.whatsappDisplay = partial.whatsappDisplay.trim();
        }
        if (typeof partial.email === 'string' && partial.email.trim()) {
            next.email = partial.email.trim();
        }
        if (typeof partial.address === 'string' && partial.address.trim()) {
            next.address = partial.address.trim();
        }
        if (typeof partial.bankAlias === 'string' && partial.bankAlias.trim()) {
            next.bankAlias = partial.bankAlias.trim();
        }
        if (typeof partial.bankCbu === 'string' && partial.bankCbu.trim()) {
            next.bankCbu = partial.bankCbu.trim();
        }
        if (typeof partial.bankHolder === 'string' && partial.bankHolder.trim()) {
            next.bankHolder = partial.bankHolder.trim();
        }
        if (typeof partial.bankCuit === 'string' && partial.bankCuit.trim()) {
            next.bankCuit = partial.bankCuit.trim();
        }
        if (typeof partial.bankName === 'string' && partial.bankName.trim()) {
            next.bankName = partial.bankName.trim();
        }
        if (typeof partial.mpCheckoutUrl === 'string') {
            next.mpCheckoutUrl = partial.mpCheckoutUrl.trim();
        }
        if (partial.mpMode === 'link' || partial.mpMode === 'demo') {
            next.mpMode = partial.mpMode;
        } else {
            next.mpMode = next.mpCheckoutUrl.startsWith('http') ? 'link' : 'demo';
        }
        if (typeof partial.adminPin === 'string' && partial.adminPin.trim().length >= 4) {
            next.adminPin = partial.adminPin.trim();
        }

        currentSettings = next;
        storageService.setJSON(SETTINGS_KEY, currentSettings);

        listeners.forEach((cb) => {
            try {
                cb(this.getSettings());
            } catch (e) {
                console.error('[settingsService] Error en listener:', e);
            }
        });

        return this.getSettings();
    },

    verifyAdminPin(pinInput) {
        const expected = currentSettings.adminPin || SITE_CONFIG.defaults.adminPin;
        return String(pinInput || '').trim() === String(expected);
    },

    subscribe(callback) {
        listeners.add(callback);
        return () => listeners.delete(callback);
    }
};
