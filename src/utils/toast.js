/**
 * Sistema de notificaciones Toast no bloqueantes y accesibles.
 */

const VARIANT_STYLES = {
    success: 'bg-emerald-950/95 border-emerald-600/60 text-emerald-100',
    error: 'bg-rose-950/95 border-rose-600/60 text-rose-100',
    warning: 'bg-amber-950/95 border-amber-500/60 text-amber-100',
    info: 'bg-stone-900/95 border-stone-700 text-stone-100'
};

const VARIANT_ICONS = {
    success: 'fa-solid fa-circle-check text-emerald-400',
    error: 'fa-solid fa-circle-exclamation text-rose-400',
    warning: 'fa-solid fa-triangle-exclamation text-amber-400',
    info: 'fa-solid fa-circle-info text-sky-400'
};

function ensureContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        container.className =
            'fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] sm:w-96 pointer-events-none no-print';
        document.body.appendChild(container);
    }
    return container;
}

export function showToast(message, variant = 'info', duration = 3800) {
    const container = ensureContainer();
    const el = document.createElement('div');
    const style = VARIANT_STYLES[variant] || VARIANT_STYLES.info;
    const icon = VARIANT_ICONS[variant] || VARIANT_ICONS.info;

    el.role = 'status';
    el.className = `pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs sm:text-sm font-medium transition-all duration-300 opacity-0 translate-y-2 ${style}`;
    el.innerHTML = `
        <i class="${icon} mt-0.5 shrink-0 text-base" aria-hidden="true"></i>
        <span class="flex-1 leading-snug"></span>
        <button type="button" class="text-stone-400 hover:text-white transition-colors p-0.5" aria-label="Cerrar notificación">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    el.querySelector('span').textContent = message;

    const removeToast = () => {
        el.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => el.remove(), 220);
    };

    el.querySelector('button').addEventListener('click', removeToast);

    // Mantener como máximo 2 toasts simultáneos para no tapar modales
    while (container.children.length >= 2) {
        container.firstElementChild?.remove();
    }
    container.appendChild(el);

    requestAnimationFrame(() => {
        el.classList.remove('opacity-0', 'translate-y-2');
    });

    if (duration > 0) {
        setTimeout(removeToast, duration);
    }
}
