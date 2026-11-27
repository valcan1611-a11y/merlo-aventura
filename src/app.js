/**
 * Punto de entrada principal de Merlo Aventura.
 * Conecta navegación, hero, catálogo, detalle GPS, stepper de reservas,
 * pagos/voucher y panel de administración seguro.
 */

import { initNavigationAndHero } from './components/navigationHero.js';
import { initCatalog } from './components/catalog.js';
import {
    closeExcursionDetailModal,
    initExcursionDetailModal,
    isExcursionDetailOpen,
    openExcursionDetailModal
} from './components/excursionDetailModal.js';
import {
    closeBookingModal,
    initBookingStepper,
    isBookingModalOpen,
    openBookingModal
} from './components/bookingStepper.js';
import {
    closeAllPaymentModals,
    handlePostBookingFlow,
    initPaymentAndVoucher,
    isAnyPaymentOrVoucherOpen,
    openVoucherModal
} from './components/paymentVoucher.js';
import {
    closeAllAdminModals,
    initAdminPanel,
    isAdminOpen,
    openAdminEntry
} from './components/adminPanel.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Navegación, Hero, Flota, Paso a Paso, Testimonios, FAQ, Consulta y Footer
    initNavigationAndHero({
        onOpenBooking: (excId) => openBookingModal(excId),
        onOpenDetail: (excId) => openExcursionDetailModal(excId)
    });

    // 2. Catálogo con filtros y cards 4x4 vs Trekking
    initCatalog({
        onOpenDetail: (excId) => openExcursionDetailModal(excId),
        onOpenBooking: (excId) => openBookingModal(excId)
    });

    // 3. Modal de Detalle + Mapa Leaflet
    initExcursionDetailModal({
        onReserve: (excId) => openBookingModal(excId)
    });

    // 4. Stepper de Reserva
    initBookingStepper({
        onBookingCreated: (reservation) => handlePostBookingFlow(reservation)
    });

    // 5. Transferencia, Mercado Pago y Voucher Digital
    initPaymentAndVoucher();

    // 6. Panel de Administración protegido
    initAdminPanel({
        onOpenVoucher: (res) => openVoucherModal(res)
    });

    // 7. Disparadores globales de botones estáticos en HTML
    document.querySelectorAll('[data-open-booking-global]').forEach((btn) => {
        btn.addEventListener('click', () => openBookingModal());
    });

    document.getElementById('footerAdminBtn')?.addEventListener('click', openAdminEntry);

    // 8. Accesibilidad: cierre de modales activos con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (isAdminOpen()) {
            closeAllAdminModals();
        } else if (isAnyPaymentOrVoucherOpen()) {
            closeAllPaymentModals();
        } else if (isBookingModalOpen()) {
            closeBookingModal();
        } else if (isExcursionDetailOpen()) {
            closeExcursionDetailModal();
        }
    });

    // 9. Deep-links por URL (?excursion=1 o ?reservar=1)
    const params = new URLSearchParams(window.location.search);
    const excParam = params.get('excursion');
    const bookParam = params.get('reservar');
    if (bookParam) {
        openBookingModal(Number(bookParam));
    } else if (excParam) {
        openExcursionDetailModal(Number(excParam));
    }
});
