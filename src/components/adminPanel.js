/**
 * Panel de Administración protegido con modal de PIN configurable,
 * gestión de estados (Pendiente, Aprobada, Cancelada), búsqueda/filtros,
 * exportación CSV/Excel (UTF-8 BOM + RFC-4180) y edición de ajustes en vivo.
 */

import { bookingService } from '../services/bookingService.js';
import { settingsService } from '../services/settingsService.js';
import {
    buildWhatsAppUrl,
    escapeHTML,
    formatARS,
    formatDateES,
    getStatusMeta
} from '../utils/formatters.js';
import { showToast } from '../utils/toast.js';

const SESSION_AUTH_KEY = 'ma_admin_unlocked_session';

const adminState = {
    activeTab: 'reservations', // 'reservations' | 'settings'
    searchQuery: '',
    statusFilter: 'all'
};

let onOpenVoucherCallback = () => {};

export function initAdminPanel({ onOpenVoucher }) {
    onOpenVoucherCallback = onOpenVoucher;
    bindAuthModal();
    bindDashboardEvents();

    bookingService.subscribe(() => {
        if (isAdminDashboardOpen()) renderDashboard();
    });
}

function isSessionUnlocked() {
    try {
        return window.sessionStorage.getItem(SESSION_AUTH_KEY) === '1';
    } catch {
        return false;
    }
}

function setSessionUnlocked(unlocked) {
    try {
        if (unlocked) window.sessionStorage.setItem(SESSION_AUTH_KEY, '1');
        else window.sessionStorage.removeItem(SESSION_AUTH_KEY);
    } catch {
        // ignore
    }
}

export function openAdminEntry() {
    if (isSessionUnlocked()) {
        openAdminDashboard();
    } else {
        openAdminAuthModal();
    }
}

function openAdminAuthModal() {
    const modal = document.getElementById('adminAuthModal');
    const pinInput = document.getElementById('adminPinInput');
    const errorEl = document.getElementById('adminPinError');
    if (!modal) return;

    if (pinInput) pinInput.value = '';
    if (errorEl) errorEl.classList.add('hidden');
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    setTimeout(() => pinInput?.focus(), 60);
}

export function closeAdminAuthModal() {
    document.getElementById('adminAuthModal')?.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

function openAdminDashboard() {
    populateSettingsForm(settingsService.getSettings());
    switchAdminTab('reservations');
    renderDashboard();

    document.getElementById('adminModal')?.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

export function closeAdminDashboard() {
    document.getElementById('adminModal')?.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

export function isAdminOpen() {
    const auth = document.getElementById('adminAuthModal');
    const dash = document.getElementById('adminModal');
    return Boolean(
        (auth && !auth.classList.contains('hidden')) || (dash && !dash.classList.contains('hidden'))
    );
}

function isAdminDashboardOpen() {
    const dash = document.getElementById('adminModal');
    return Boolean(dash && !dash.classList.contains('hidden'));
}

export function closeAllAdminModals() {
    closeAdminAuthModal();
    closeAdminDashboard();
}

function bindAuthModal() {
    document.getElementById('adminAuthBackdrop')?.addEventListener('click', closeAdminAuthModal);
    document.getElementById('adminAuthCloseBtn')?.addEventListener('click', closeAdminAuthModal);

    const toggleVisBtn = document.getElementById('adminPinToggleVisBtn');
    const pinInput = document.getElementById('adminPinInput');
    toggleVisBtn?.addEventListener('click', () => {
        if (!pinInput) return;
        const isPassword = pinInput.type === 'password';
        pinInput.type = isPassword ? 'text' : 'password';
        const icon = toggleVisBtn.querySelector('i');
        if (icon) icon.className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    });

    document.getElementById('adminAuthForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = pinInput?.value || '';
        const errorEl = document.getElementById('adminPinError');

        if (settingsService.verifyAdminPin(val)) {
            setSessionUnlocked(true);
            closeAdminAuthModal();
            openAdminDashboard();
            showToast('Sesión de administrador iniciada.', 'success');
        } else {
            if (errorEl) {
                errorEl.textContent = 'Clave incorrecta. Intentá nuevamente.';
                errorEl.classList.remove('hidden');
            }
            pinInput?.focus();
            pinInput?.select();
        }
    });
}

function bindDashboardEvents() {
    document.getElementById('adminBackdrop')?.addEventListener('click', closeAdminDashboard);
    document.getElementById('adminCloseBtn')?.addEventListener('click', closeAdminDashboard);

    document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
        setSessionUnlocked(false);
        closeAdminDashboard();
        showToast('Sesión de administración cerrada.', 'info');
    });

    document.getElementById('adminTabReservationsBtn')?.addEventListener('click', () =>
        switchAdminTab('reservations')
    );
    document.getElementById('adminTabSettingsBtn')?.addEventListener('click', () =>
        switchAdminTab('settings')
    );

    document.getElementById('adminSearchInput')?.addEventListener('input', (e) => {
        adminState.searchQuery = e.target.value;
        renderReservationsTable();
    });

    document.querySelectorAll('[data-admin-status-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
            adminState.statusFilter = btn.getAttribute('data-admin-status-filter');
            updateStatusFilterPills();
            renderReservationsTable();
        });
    });

    document.getElementById('adminExportCsvBtn')?.addEventListener('click', exportFilteredCSV);
    document.getElementById('adminSettingsForm')?.addEventListener('submit', handleSaveSettings);
}

function switchAdminTab(tab) {
    adminState.activeTab = tab;
    const resPanel = document.getElementById('adminPanelReservations');
    const setPanel = document.getElementById('adminPanelSettings');
    const resBtn = document.getElementById('adminTabReservationsBtn');
    const setBtn = document.getElementById('adminTabSettingsBtn');

    if (resPanel) resPanel.classList.toggle('hidden', tab !== 'reservations');
    if (setPanel) setPanel.classList.toggle('hidden', tab !== 'settings');

    const activeCls = 'bg-amber-500 text-stone-950 font-black shadow';
    const inactiveCls = 'bg-stone-950 text-stone-300 hover:text-white border border-stone-800 font-semibold';

    if (resBtn) resBtn.className = `px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${tab === 'reservations' ? activeCls : inactiveCls}`;
    if (setBtn) setBtn.className = `px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${tab === 'settings' ? activeCls : inactiveCls}`;
}

function updateStatusFilterPills() {
    document.querySelectorAll('[data-admin-status-filter]').forEach((btn) => {
        const val = btn.getAttribute('data-admin-status-filter');
        const active = val === adminState.statusFilter;
        btn.className = `px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
            active
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-900 text-stone-300 hover:text-white border border-stone-800'
        }`;
    });
}

function renderDashboard() {
    const all = bookingService.list();
    const metrics = bookingService.getMetrics(all);

    setText('admTotalCount', String(metrics.total));
    setText('admApprovedCount', String(metrics.approved));
    setText('admPendingCount', String(metrics.pending));
    setText('admCancelledCount', String(metrics.cancelled));
    setText('admTotalRevenue', formatARS(metrics.revenueApproved));

    updateStatusFilterPills();
    renderReservationsTable();
}

function renderReservationsTable() {
    const tbody = document.getElementById('admReservationsTable');
    const counter = document.getElementById('admFilteredCount');
    if (!tbody) return;

    const filtered = bookingService.filter({
        query: adminState.searchQuery,
        status: adminState.statusFilter
    });

    if (counter) {
        counter.textContent = `${filtered.length} reserva${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-stone-400">
                    No se encontraron reservas para el criterio seleccionado.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered
        .map((r) => {
            const meta = getStatusMeta(r.paymentStatus);
            const waHref = buildWhatsAppUrl(
                r.clientPhone,
                `¡Hola ${r.clientName}! Te escribimos desde Merlo Aventura por tu reserva #${r.code} (${r.tourName}, ${formatDateES(r.tourDate)}).`
            );
            const extrasNote =
                r.extrasSelected?.length > 0
                    ? `<div class="text-[10px] text-amber-400/90 mt-0.5">+ ${escapeHTML(r.extrasSelected.map((e) => e.name).join(', '))}</div>`
                    : '';

            return `
                <tr class="hover:bg-stone-900/70 transition-colors">
                    <td class="p-3 align-top whitespace-nowrap">
                        <span class="font-mono font-bold text-amber-400">${escapeHTML(r.code)}</span>
                        <div class="text-[10px] text-stone-400 mt-0.5">${escapeHTML(r.dateCreated)}</div>
                    </td>
                    <td class="p-3 align-top">
                        <div class="font-bold text-white leading-snug">${escapeHTML(r.tourName)}</div>
                        <div class="text-[11px] text-stone-400 mt-0.5">${escapeHTML(formatDateES(r.tourDate))} · ${escapeHTML(r.tourTime)} hs</div>
                        ${extrasNote}
                    </td>
                    <td class="p-3 align-top whitespace-nowrap">
                        <span class="font-bold text-white">${r.totalPax} pax</span>
                        <div class="text-[10px] text-stone-400">${r.adults}A / ${r.children}M</div>
                    </td>
                    <td class="p-3 align-top">
                        <div class="font-semibold text-white">${escapeHTML(r.clientName)}</div>
                        <a href="${waHref}" target="_blank" rel="noopener" class="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1 mt-0.5">
                            <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>${escapeHTML(r.clientPhone)}
                        </a>
                        <div class="text-[10px] text-stone-400 mt-0.5">${escapeHTML(r.pickupZone)} · ${escapeHTML(r.hotel)}</div>
                    </td>
                    <td class="p-3 align-top whitespace-nowrap">
                        <div class="font-bold text-white">${formatARS(r.totalPrice)}</div>
                        <div class="text-[10px] uppercase text-stone-400">${r.paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia'}</div>
                    </td>
                    <td class="p-3 align-top whitespace-nowrap">
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${meta.badgeClass}">
                            <i class="${meta.icon}" aria-hidden="true"></i>
                            ${meta.label}
                        </span>
                    </td>
                    <td class="p-3 align-top">
                        <div class="flex flex-wrap items-center justify-end gap-1.5">
                            ${
                                r.paymentStatus !== 'approved'
                                    ? `<button type="button" data-res-action="approved" data-res-code="${escapeHTML(r.code)}" class="px-2.5 py-1 rounded-lg bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 text-[11px] font-bold transition-colors">Aprobar</button>`
                                    : ''
                            }
                            ${
                                r.paymentStatus !== 'pending'
                                    ? `<button type="button" data-res-action="pending" data-res-code="${escapeHTML(r.code)}" class="px-2.5 py-1 rounded-lg bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-800/60 text-[11px] font-bold transition-colors">Pendiente</button>`
                                    : ''
                            }
                            ${
                                r.paymentStatus !== 'cancelled'
                                    ? `<button type="button" data-res-action="cancelled" data-res-code="${escapeHTML(r.code)}" class="px-2.5 py-1 rounded-lg bg-rose-950/90 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-[11px] font-bold transition-colors">Cancelar</button>`
                                    : ''
                            }
                            <button type="button" data-res-voucher="${escapeHTML(r.code)}" class="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px]" title="Ver Voucher">
                                <i class="fa-solid fa-ticket" aria-hidden="true"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join('');

    tbody.querySelectorAll('[data-res-action]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const code = btn.getAttribute('data-res-code');
            const nextStatus = btn.getAttribute('data-res-action');
            const updated = bookingService.updateStatus(code, nextStatus);
            if (updated) {
                const label = getStatusMeta(nextStatus).label;
                showToast(`Reserva ${code} actualizada a "${label}".`, 'success');
            }
        });
    });

    tbody.querySelectorAll('[data-res-voucher]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const code = btn.getAttribute('data-res-voucher');
            const res = bookingService.getByCode(code);
            if (res) {
                closeAdminDashboard();
                onOpenVoucherCallback(res);
            }
        });
    });
}

function exportFilteredCSV() {
    const filtered = bookingService.filter({
        query: adminState.searchQuery,
        status: adminState.statusFilter
    });

    if (filtered.length === 0) {
        showToast('No hay reservas en la vista actual para exportar.', 'warning');
        return;
    }

    const csv = bookingService.buildCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas_merlo_aventura_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exportadas ${filtered.length} reservas en formato CSV/Excel.`, 'success');
}

function populateSettingsForm(settings) {
    setVal('cfgWhatsapp', settings.whatsappRaw);
    setVal('cfgWhatsappDisplay', settings.whatsappDisplay);
    setVal('cfgEmail', settings.email);
    setVal('cfgAddress', settings.address);
    setVal('cfgAlias', settings.bankAlias);
    setVal('cfgCBU', settings.bankCbu);
    setVal('cfgBankHolder', settings.bankHolder);
    setVal('cfgBankCuit', settings.bankCuit);
    setVal('cfgBankName', settings.bankName);
    setVal('cfgMpMode', settings.mpMode);
    setVal('cfgMpUrl', settings.mpCheckoutUrl);
    setVal('cfgNewAdminPin', '');
}

function handleSaveSettings(e) {
    e.preventDefault();

    const newPin = document.getElementById('cfgNewAdminPin')?.value.trim() || '';
    if (newPin && newPin.length < 4) {
        showToast('El nuevo PIN de administrador debe tener al menos 4 caracteres.', 'warning');
        return;
    }

    const mpMode = document.getElementById('cfgMpMode')?.value || 'demo';
    const mpUrl = document.getElementById('cfgMpUrl')?.value.trim() || '';
    if (mpMode === 'link' && !mpUrl.startsWith('http')) {
        showToast('Si activás Checkout por Link de Mercado Pago, ingresá una URL válida (https://...).', 'warning');
        return;
    }

    const updated = settingsService.updateSettings({
        whatsappRaw: document.getElementById('cfgWhatsapp')?.value || '',
        whatsappDisplay: document.getElementById('cfgWhatsappDisplay')?.value || '',
        email: document.getElementById('cfgEmail')?.value || '',
        address: document.getElementById('cfgAddress')?.value || '',
        bankAlias: document.getElementById('cfgAlias')?.value || '',
        bankCbu: document.getElementById('cfgCBU')?.value || '',
        bankHolder: document.getElementById('cfgBankHolder')?.value || '',
        bankCuit: document.getElementById('cfgBankCuit')?.value || '',
        bankName: document.getElementById('cfgBankName')?.value || '',
        mpMode,
        mpCheckoutUrl: mpUrl,
        ...(newPin ? { adminPin: newPin } : {})
    });

    populateSettingsForm(updated);
    showToast('Ajustes guardados y aplicados en todo el sitio.', 'success');
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
}
