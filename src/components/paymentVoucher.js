/**
 * Flujos post-reserva:
 * 1. Modal Transferencia Bancaria (código MA-XXXXX, Alias/CBU copiables + feedback, WhatsApp prellenado)
 * 2. Modal Mercado Pago (checkout configurable o modo demo transparente sin falsos aprobados silenciosos)
 * 3. Voucher Digital (estado real, desglose completo, imprimir, copiar resumen y descargar .txt)
 */

import { bookingService } from '../services/bookingService.js';
import { settingsService } from '../services/settingsService.js';
import {
    buildWhatsAppUrl,
    copyToClipboard,
    formatARSFull,
    formatDateES,
    getStatusMeta
} from '../utils/formatters.js';
import { showToast } from '../utils/toast.js';

let activeReservation = null;

export function initPaymentAndVoucher() {
    // Transferencia
    document.getElementById('transferBackdrop')?.addEventListener('click', closeTransferModal);
    document.getElementById('transferCloseBtn')?.addEventListener('click', closeTransferModal);
    document.getElementById('transferToVoucherBtn')?.addEventListener('click', () => {
        closeTransferModal();
        if (activeReservation) openVoucherModal(activeReservation);
    });

    bindCopyButton('copyCodeBtn', () => activeReservation?.code || '');
    bindCopyButton('copyAliasBtn', () => settingsService.getSettings().bankAlias);
    bindCopyButton('copyCbuBtn', () => settingsService.getSettings().bankCbu);

    // Mercado Pago
    document.getElementById('mpBackdrop')?.addEventListener('click', closeMpModal);
    document.getElementById('mpCloseBtn')?.addEventListener('click', closeMpModal);
    document.getElementById('mpSwitchToTransferBtn')?.addEventListener('click', () => {
        closeMpModal();
        if (activeReservation) openTransferModal(activeReservation);
    });
    document.getElementById('mpDemoApproveBtn')?.addEventListener('click', () => {
        if (!activeReservation) return;
        const updated = bookingService.updateStatus(activeReservation.code, 'approved') || activeReservation;
        activeReservation = updated;
        closeMpModal();
        showToast(`Pago demo acreditado para reserva ${updated.code}.`, 'success');
        openVoucherModal(updated);
    });
    document.getElementById('mpShowVoucherPendingBtn')?.addEventListener('click', () => {
        closeMpModal();
        if (activeReservation) openVoucherModal(activeReservation);
    });

    // Voucher
    document.getElementById('voucherBackdrop')?.addEventListener('click', closeVoucherModal);
    document.getElementById('voucherCloseBtn')?.addEventListener('click', closeVoucherModal);
    document.getElementById('voucherDoneBtn')?.addEventListener('click', closeVoucherModal);
    document.getElementById('voucherPrintBtn')?.addEventListener('click', () => window.print());

    document.getElementById('voucherCopySummaryBtn')?.addEventListener('click', async (e) => {
        if (!activeReservation) return;
        const btn = e.currentTarget;
        const summary = bookingService.formatSummaryText(activeReservation, settingsService.getSettings());
        const ok = await copyToClipboard(summary);
        if (ok) {
            flashButtonCopied(btn, '¡Resumen copiado!');
            showToast('Resumen del voucher copiado al portapapeles.', 'success');
        } else {
            showToast('No se pudo copiar automáticamente.', 'error');
        }
    });

    document.getElementById('voucherDownloadTxtBtn')?.addEventListener('click', () => {
        if (!activeReservation) return;
        const summary = bookingService.formatSummaryText(activeReservation, settingsService.getSettings());
        const blob = new Blob([summary], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voucher_${activeReservation.code}_merlo_aventura.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Comprobante descargado.', 'success');
    });

    // Sincronizar cambios de settings si el modal de transferencia está abierto
    settingsService.subscribe((settings) => {
        syncBankDetailsInTransferModal(settings);
    });
    syncBankDetailsInTransferModal(settingsService.getSettings());
}

export function handlePostBookingFlow(reservation) {
    activeReservation = reservation;
    if (reservation.paymentMethod === 'mercadopago') {
        openMpModal(reservation);
    } else {
        openTransferModal(reservation);
    }
}

export function openTransferModal(res) {
    activeReservation = bookingService.getByCode(res.code) || res;
    const settings = settingsService.getSettings();
    syncBankDetailsInTransferModal(settings);

    setText('transferCodeDisplay', activeReservation.code);
    setText(
        'transferTourDisplay',
        `${activeReservation.tourName} (${formatDateES(activeReservation.tourDate)} · ${activeReservation.tourTime} hs)`
    );
    setText('transferTotalDisplay', formatARSFull(activeReservation.totalPrice));
    setText('transferRefDisplay', activeReservation.code);

    const extrasInfo =
        activeReservation.extrasSelected?.length > 0
            ? ` Extras: ${activeReservation.extrasSelected.map((ex) => `${ex.name} x${ex.qty}`).join(', ')}.`
            : '';

    const msg =
        `¡Hola Merlo Aventura! Realicé la reserva #${activeReservation.code} para "${activeReservation.tourName}" ` +
        `el ${formatDateES(activeReservation.tourDate)} a las ${activeReservation.tourTime} hs ` +
        `(${activeReservation.totalPax} pax: ${activeReservation.adults} adultos, ${activeReservation.children} menores).${extrasInfo} ` +
        `Pick-up: ${activeReservation.pickupZone} (${activeReservation.hotel}). ` +
        `Total a transferir: ${formatARSFull(activeReservation.totalPrice)}. Te adjunto el comprobante.`;

    const waBtn = document.getElementById('transferWhatsappBtn');
    if (waBtn) waBtn.href = buildWhatsAppUrl(settings.whatsappRaw, msg);

    document.getElementById('transferModal')?.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

export function closeTransferModal() {
    document.getElementById('transferModal')?.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

export function openMpModal(res) {
    activeReservation = bookingService.getByCode(res.code) || res;
    const settings = settingsService.getSettings();
    const hasConfiguredLink = settings.mpMode === 'link' && settings.mpCheckoutUrl?.startsWith('http');

    setText('mpCodeDisplay', activeReservation.code);
    setText('mpTourDisplay', `${activeReservation.tourName} (${formatDateES(activeReservation.tourDate)} · ${activeReservation.tourTime} hs)`);
    setText('mpTotalDisplay', formatARSFull(activeReservation.totalPrice));

    const liveBox = document.getElementById('mpLiveCheckoutBox');
    const demoBox = document.getElementById('mpDemoCheckoutBox');
    const externalLink = document.getElementById('mpExternalPayLink');
    const requestLinkWa = document.getElementById('mpRequestLinkWhatsappBtn');

    if (liveBox) liveBox.classList.toggle('hidden', !hasConfiguredLink);
    if (demoBox) demoBox.classList.toggle('hidden', hasConfiguredLink);

    if (externalLink && hasConfiguredLink) {
        externalLink.href = settings.mpCheckoutUrl;
    }

    if (requestLinkWa) {
        const msg =
            `¡Hola Merlo Aventura! Hice la reserva #${activeReservation.code} para "${activeReservation.tourName}" ` +
            `(${formatDateES(activeReservation.tourDate)} · ${activeReservation.tourTime} hs, ${activeReservation.totalPax} pax, ` +
            `Total: ${formatARSFull(activeReservation.totalPrice)}). ¿Me pasás el link de Mercado Pago para abonarla?`;
        requestLinkWa.href = buildWhatsAppUrl(settings.whatsappRaw, msg);
    }

    document.getElementById('mpCheckoutModal')?.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

export function closeMpModal() {
    document.getElementById('mpCheckoutModal')?.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

export function openVoucherModal(res) {
    activeReservation = bookingService.getByCode(res.code) || res;
    const settings = settingsService.getSettings();
    const statusMeta = getStatusMeta(activeReservation.paymentStatus);

    setText('vouchCode', activeReservation.code);
    setText('vouchTour', activeReservation.tourName);
    setText('vouchDateTime', `${formatDateES(activeReservation.tourDate)} · ${activeReservation.tourTime} hs`);
    setText(
        'vouchPax',
        `${activeReservation.totalPax} pax (${activeReservation.adults} Adulto${activeReservation.adults > 1 ? 's' : ''}${activeReservation.children > 0 ? `, ${activeReservation.children} Menor${activeReservation.children > 1 ? 'es' : ''}` : ''})`
    );
    setText(
        'vouchTotal',
        `${formatARSFull(activeReservation.totalPrice)} · ${activeReservation.paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia'}`
    );
    setText(
        'vouchClient',
        `${activeReservation.clientName} • Tel: ${activeReservation.clientPhone}${activeReservation.clientEmail ? ` • ${activeReservation.clientEmail}` : ''}`
    );
    setText('vouchHotel', `${activeReservation.pickupZone} — ${activeReservation.hotel}`);

    // Estado real en badge
    const statusBadge = document.getElementById('vouchStatusBadge');
    if (statusBadge) {
        statusBadge.className = `inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full ${statusMeta.badgeClass}`;
        statusBadge.innerHTML = `<i class="${statusMeta.icon}" aria-hidden="true"></i><span>Estado: ${statusMeta.label}</span>`;
    }

    const extrasRow = document.getElementById('vouchExtrasBox');
    const extrasText = document.getElementById('vouchExtrasText');
    if (extrasRow && extrasText) {
        if (activeReservation.extrasSelected && activeReservation.extrasSelected.length > 0) {
            extrasText.textContent = activeReservation.extrasSelected
                .map((ex) => `${ex.name} (x${ex.qty} · ${formatARSFull(ex.subtotal)})`)
                .join(' | ');
            extrasRow.classList.remove('hidden');
        } else {
            extrasRow.classList.add('hidden');
        }
    }

    const waBtn = document.getElementById('voucherWhatsappBtn');
    if (waBtn) {
        const msg = `¡Hola Merlo Aventura! Comparto mi voucher #${activeReservation.code} para "${activeReservation.tourName}" el ${formatDateES(activeReservation.tourDate)} (${activeReservation.tourTime} hs). Titular: ${activeReservation.clientName}.`;
        waBtn.href = buildWhatsAppUrl(settings.whatsappRaw, msg);
    }

    document.getElementById('voucherModal')?.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

export function closeVoucherModal() {
    document.getElementById('voucherModal')?.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

export function isAnyPaymentOrVoucherOpen() {
    return ['transferModal', 'mpCheckoutModal', 'voucherModal'].some((id) => {
        const el = document.getElementById(id);
        return Boolean(el && !el.classList.contains('hidden'));
    });
}

export function closeAllPaymentModals() {
    closeTransferModal();
    closeMpModal();
    closeVoucherModal();
}

function syncBankDetailsInTransferModal(settings) {
    setText('transferAliasText', settings.bankAlias);
    setText('transferCBUText', settings.bankCbu);
    setText('transferHolderText', settings.bankHolder);
    setText('transferCuitText', settings.bankCuit);
    setText('transferBankText', settings.bankName);
}

function bindCopyButton(btnId, getTextFn) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const value = getTextFn();
        if (!value) return;
        const ok = await copyToClipboard(value);
        if (ok) {
            flashButtonCopied(btn, '¡Copiado!');
            showToast(`Copiado: ${value}`, 'success', 2400);
        } else {
            showToast('No se pudo copiar automáticamente.', 'error');
        }
    });
}

function flashButtonCopied(btn, label) {
    const prevHtml = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-check text-emerald-400" aria-hidden="true"></i> <span>${label}</span>`;
    setTimeout(() => {
        btn.innerHTML = prevHtml;
    }, 2000);
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
