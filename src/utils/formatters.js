/**
 * Utilidades de formato, sanitización, portapapeles, CSV y WhatsApp.
 */

export function formatMoney(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Math.round(num));
}

export function formatARS(amount) {
    return `$${formatMoney(amount)}`;
}

export function formatARSFull(amount) {
    return `$${formatMoney(amount)} ARS`;
}

export function formatDateES(isoDate) {
    if (!isoDate) return '-';
    const parts = String(isoDate).split('-');
    if (parts.length !== 3) return isoDate;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (Number.isNaN(d.getTime())) return isoDate;
    return new Intl.DateTimeFormat('es-AR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(d);
}

export function escapeHTML(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function sanitizePhoneDigits(raw) {
    return String(raw || '').replace(/\D/g, '');
}

export function buildWhatsAppUrl(rawPhone, message = '') {
    const digits = sanitizePhoneDigits(rawPhone) || '5492664123456';
    if (!message) return `https://wa.me/${digits}`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Escapado RFC-4180 para CSV/Excel.
 * Dobla comillas internas y encierra el campo en comillas dobles.
 */
export function escapeCSVCell(value) {
    const str = String(value ?? '').replace(/\r?\n/g, ' ');
    return `"${str.replace(/"/g, '""')}"`;
}

export function generateBookingCode(existingCodes = new Set()) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 40; attempt++) {
        let suffix = '';
        for (let i = 0; i < 5; i++) {
            suffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const code = `MA-${suffix}`;
        if (!existingCodes.has(code)) return code;
    }
    return `MA-${Date.now().toString().slice(-5)}`;
}

export async function copyToClipboard(text) {
    const value = String(text ?? '');
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(value);
            return true;
        } catch {
            // fallback below
        }
    }
    try {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    } catch {
        return false;
    }
}

export function getStatusMeta(status) {
    switch (status) {
        case 'approved':
            return {
                label: 'Aprobada',
                badgeClass: 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60',
                icon: 'fa-solid fa-circle-check'
            };
        case 'cancelled':
            return {
                label: 'Cancelada',
                badgeClass: 'bg-rose-950/90 text-rose-300 border border-rose-800/70',
                icon: 'fa-solid fa-ban'
            };
        default:
            return {
                label: 'Pendiente',
                badgeClass: 'bg-amber-950/90 text-amber-300 border border-amber-700/60',
                icon: 'fa-solid fa-clock'
            };
    }
}
