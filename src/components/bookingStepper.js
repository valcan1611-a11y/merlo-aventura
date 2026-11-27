/**
 * Flujo de Reserva Guiado (Stepper en 3 pasos):
 * Paso 1: Excursión, Fecha (Flatpickr ES corregido), Turno, Cupos reales, Pasajeros y Extras.
 * Paso 2: Datos de contacto y zona de pick-up (Merlo, Carpintería, Cerro de Oro) con validación inline.
 * Paso 3: Resumen final y elección de medio de pago (Mercado Pago / Transferencia Bancaria).
 */

import { EXCURSIONS, getExcursionById } from '../data/excursions.js';
import { SITE_CONFIG } from '../data/siteConfig.js';
import { bookingService } from '../services/bookingService.js';
import { settingsService } from '../services/settingsService.js';
import { escapeHTML, formatARS, formatARSFull, formatDateES } from '../utils/formatters.js';
import { showToast } from '../utils/toast.js';

const state = {
    step: 1,
    excursionId: EXCURSIONS[0].id,
    tourDate: '',
    tourTime: EXCURSIONS[0].times[0],
    adults: 1,
    children: 0,
    selectedExtraIds: [],
    paymentMethod: 'transferencia'
};

let flatpickrInst = null;
let onBookingCreatedCallback = () => {};

export function initBookingStepper({ onBookingCreated }) {
    onBookingCreatedCallback = onBookingCreated;

    populateExcursionSelect();
    populatePickupZones();
    initFlatpickrCalendar();
    bindEvents();

    // Sincronizar disponibilidad si cambian reservas desde admin
    bookingService.subscribe(() => {
        if (isBookingModalOpen()) {
            updateAvailabilityAndUI();
        }
    });

    settingsService.subscribe(syncPaymentOptionLabels);
    syncPaymentOptionLabels(settingsService.getSettings());
}

function populateExcursionSelect() {
    const select = document.getElementById('modalExcursionSelect');
    if (!select) return;
    select.innerHTML = EXCURSIONS.map(
        (exc) => `<option value="${exc.id}">${escapeHTML(exc.name)} — ${formatARS(exc.priceAdult)}</option>`
    ).join('');
}

function populatePickupZones() {
    const select = document.getElementById('custPickupZone');
    if (!select) return;
    select.innerHTML = [
        '<option value="">Seleccioná tu zona de alojamiento *</option>',
        ...SITE_CONFIG.pickupZones.map(
            (z) => `<option value="${escapeHTML(z.value)}">${escapeHTML(z.label)}</option>`
        )
    ].join('');
}

function getDefaultDateString() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function initFlatpickrCalendar() {
    const dateInput = document.getElementById('modalDatePicker');
    if (!dateInput) return;

    const defaultIso = getDefaultDateString();
    state.tourDate = defaultIso;

    // FIX CRÍTICO: flatpickr.l10ns.es (cero en l10ns, antes tenía typo l1ons)
    if (typeof window.flatpickr === 'function') {
        const esLocale = window.flatpickr.l10ns?.es || 'default';
        flatpickrInst = window.flatpickr(dateInput, {
            locale: esLocale,
            minDate: 'today',
            dateFormat: 'Y-m-d',
            altInput: true,
            altFormat: 'D j \\de M, Y',
            defaultDate: defaultIso,
            onChange: (_dates, dateStr) => {
                state.tourDate = dateStr;
                clearFieldError('modalDatePicker');
                updateAvailabilityAndUI();
            }
        });
    } else {
        // Fallback nativo si CDN de Flatpickr no carga
        dateInput.type = 'date';
        dateInput.min = new Date().toISOString().slice(0, 10);
        dateInput.value = defaultIso;
        dateInput.addEventListener('change', () => {
            state.tourDate = dateInput.value;
            clearFieldError('modalDatePicker');
            updateAvailabilityAndUI();
        });
    }
}

function bindEvents() {
    document.getElementById('bookingBackdrop')?.addEventListener('click', closeBookingModal);
    document.getElementById('bookingCloseBtn')?.addEventListener('click', closeBookingModal);

    document.getElementById('modalExcursionSelect')?.addEventListener('change', (e) => {
        selectExcursion(Number(e.target.value));
    });

    document.getElementById('modalTimeSelect')?.addEventListener('change', (e) => {
        state.tourTime = e.target.value;
        updateAvailabilityAndUI();
    });

    document.getElementById('adultMinusBtn')?.addEventListener('click', () => adjustPax('adults', -1));
    document.getElementById('adultPlusBtn')?.addEventListener('click', () => adjustPax('adults', 1));
    document.getElementById('childMinusBtn')?.addEventListener('click', () => adjustPax('children', -1));
    document.getElementById('childPlusBtn')?.addEventListener('click', () => adjustPax('children', 1));

    document.getElementById('bookingBackBtn')?.addEventListener('click', () => {
        if (state.step > 1) goToStep(state.step - 1);
    });

    document.getElementById('bookingNextBtn')?.addEventListener('click', () => {
        if (state.step === 1 && validateStep1()) {
            goToStep(2);
        } else if (state.step === 2 && validateStep2()) {
            renderStep3Recap();
            goToStep(3);
        }
    });

    document.querySelectorAll('[data-stepper-btn]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetStep = Number(btn.getAttribute('data-stepper-btn'));
            if (targetStep < state.step) {
                goToStep(targetStep);
            }
        });
    });

    // Limpiar errores inline al escribir
    ['custName', 'custPhone', 'custEmail', 'custPickupZone', 'custHotel'].forEach((id) => {
        const el = document.getElementById(id);
        el?.addEventListener('input', () => clearFieldError(id));
        el?.addEventListener('change', () => clearFieldError(id));
    });

    // Zona base operativa vuelve hotel opcional visualmente
    document.getElementById('custPickupZone')?.addEventListener('change', (e) => {
        const hotelInput = document.getElementById('custHotel');
        const hotelHint = document.getElementById('custHotelLabel');
        if (!hotelInput || !hotelHint) return;
        const isBase = e.target.value.includes('Base Operativa');
        hotelHint.textContent = isBase
            ? 'Alojamiento o referencia (opcional si venís a la base)'
            : 'Hotel, cabaña o dirección de pick-up *';
        hotelInput.placeholder = isBase
            ? 'Opcional — Te esperamos en Av. del Sol 650'
            : 'Ej: Cabañas del Sol, Av. de los Césares 1240';
    });

    document.querySelectorAll('input[name="payMethod"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            state.paymentMethod = radio.value;
        });
    });

    document.getElementById('bookingForm')?.addEventListener('submit', handleBookingSubmit);
}

function syncPaymentOptionLabels(settings) {
    const mpBadge = document.getElementById('mpMethodStatusBadge');
    const mpDesc = document.getElementById('mpMethodDesc');
    if (!mpBadge || !mpDesc) return;

    if (settings.mpMode === 'link' && settings.mpCheckoutUrl?.startsWith('http')) {
        mpBadge.textContent = 'Checkout Online Activo';
        mpDesc.textContent = 'Tarjetas de crédito, débito o dinero en cuenta vía link oficial de Mercado Pago.';
    } else {
        mpBadge.textContent = 'Link por WhatsApp / Demo';
        mpDesc.textContent = 'Solicitá el link de pago al instante o probá el flujo en modo demostración.';
    }
}

export function openBookingModal(excursionId = null) {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    clearAllFieldErrors();
    state.step = 1;
    state.selectedExtraIds = [];
    state.children = 0;

    const targetId = excursionId ? Number(excursionId) : state.excursionId || EXCURSIONS[0].id;
    const exc = getExcursionById(targetId) || EXCURSIONS[0];
    state.adults = Math.max(1, exc.minPax || 1);

    const select = document.getElementById('modalExcursionSelect');
    if (select) select.value = String(exc.id);

    if (!state.tourDate) {
        state.tourDate = getDefaultDateString();
        if (flatpickrInst) flatpickrInst.setDate(state.tourDate, false);
    }

    selectExcursion(exc.id, { preserveAdults: true });
    goToStep(1);

    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

export function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

export function isBookingModalOpen() {
    const modal = document.getElementById('bookingModal');
    return Boolean(modal && !modal.classList.contains('hidden'));
}

function selectExcursion(excId, { preserveAdults = false } = {}) {
    const exc = getExcursionById(excId) || EXCURSIONS[0];
    state.excursionId = exc.id;
    state.selectedExtraIds = [];

    if (!preserveAdults) {
        state.adults = Math.max(1, exc.minPax || 1);
        state.children = 0;
    }

    const timeSelect = document.getElementById('modalTimeSelect');
    if (timeSelect) {
        timeSelect.innerHTML = exc.times
            .map((t) => {
                const label = t >= '18:00' ? 'Nocturno' : t >= '12:00' ? 'Tarde' : 'Mañana';
                return `<option value="${t}">Turno ${label} (${t} hs)</option>`;
            })
            .join('');
        state.tourTime = exc.times[0];
        timeSelect.value = state.tourTime;
    }

    setText('adultRateLabel', `${formatARS(exc.priceAdult)} c/u`);
    setText('childRateLabel', `${formatARS(exc.priceChild)} c/u`);

    const minPaxNote = document.getElementById('minPaxNotice');
    if (minPaxNote) {
        if (exc.minPax > 1) {
            minPaxNote.textContent = `Esta salida requiere un mínimo de ${exc.minPax} pasajeros.`;
            minPaxNote.classList.remove('hidden');
        } else {
            minPaxNote.classList.add('hidden');
        }
    }

    renderExtrasList(exc);
    updateAvailabilityAndUI();
}

function renderExtrasList(exc) {
    const wrapper = document.getElementById('bookingExtrasSection');
    const list = document.getElementById('bookingExtrasList');
    if (!wrapper || !list) return;

    if (!exc.extras || exc.extras.length === 0) {
        wrapper.classList.add('hidden');
        list.innerHTML = '';
        return;
    }

    wrapper.classList.remove('hidden');
    list.innerHTML = exc.extras
        .map((extra) => {
            const checked = state.selectedExtraIds.includes(extra.id);
            return `
                <label class="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/40 cursor-pointer transition-colors">
                    <div class="flex items-start gap-3">
                        <input type="checkbox"
                            data-extra-id="${escapeHTML(extra.id)}"
                            ${checked ? 'checked' : ''}
                            class="mt-1 h-4 w-4 rounded border-stone-600 bg-stone-950 text-amber-500 focus:ring-amber-400">
                        <div>
                            <div class="text-xs sm:text-sm font-bold text-white">${escapeHTML(extra.name)}</div>
                            <p class="text-[11px] text-stone-400 leading-snug mt-0.5">${escapeHTML(extra.description)}</p>
                        </div>
                    </div>
                    <div class="text-right shrink-0">
                        <span class="text-xs font-black text-amber-400">+${formatARS(extra.price)}</span>
                        <span class="block text-[10px] text-stone-400">${extra.perPerson ? 'por persona' : 'por reserva'}</span>
                    </div>
                </label>
            `;
        })
        .join('');

    list.querySelectorAll('[data-extra-id]').forEach((cb) => {
        cb.addEventListener('change', () => {
            const id = cb.getAttribute('data-extra-id');
            if (cb.checked) {
                if (!state.selectedExtraIds.includes(id)) state.selectedExtraIds.push(id);
            } else {
                state.selectedExtraIds = state.selectedExtraIds.filter((item) => item !== id);
            }
            updateQuoteSummary();
        });
    });
}

function adjustPax(type, delta) {
    const exc = getExcursionById(state.excursionId) || EXCURSIONS[0];
    const avail = bookingService.getSlotAvailability(state.excursionId, state.tourDate, state.tourTime);
    const maxCap = Math.max(avail.remaining, 1);

    const nextAdults = type === 'adults' ? state.adults + delta : state.adults;
    const nextChildren = type === 'children' ? state.children + delta : state.children;

    if (nextAdults < 1 || nextChildren < 0) return;

    const totalNext = nextAdults + nextChildren;
    if (delta > 0 && totalNext > maxCap) {
        showToast(
            avail.remaining === 0
                ? 'Este turno está completo. Elegí otra fecha u horario.'
                : `Cupo máximo disponible para este turno: ${avail.remaining} plazas.`,
            'warning'
        );
        return;
    }

    if (delta < 0 && totalNext < (exc.minPax || 1)) {
        showToast(`Esta excursión requiere un mínimo de ${exc.minPax} pasajeros.`, 'info');
        return;
    }

    state.adults = nextAdults;
    state.children = nextChildren;
    updateAvailabilityAndUI();
}

function updateAvailabilityAndUI() {
    setText('adultCountDisplay', String(state.adults));
    setText('childCountDisplay', String(state.children));

    const avail = bookingService.getSlotAvailability(state.excursionId, state.tourDate, state.tourTime);
    const totalPax = state.adults + state.children;
    const badge = document.getElementById('availabilityBadge');
    const badgeText = document.getElementById('availabilityText');
    const nextBtn = document.getElementById('bookingNextBtn');

    if (badge && badgeText) {
        badgeText.className = 'flex items-center gap-2';
        if (avail.remaining === 0) {
            badge.className = 'mt-2 text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/60 rounded-xl px-3 py-2 flex items-center gap-2';
            badgeText.innerHTML = `<i class="fa-solid fa-circle-xmark shrink-0"></i><span>Turno agotado (${avail.booked}/${avail.capacity} plazas ocupadas). Elegí otra fecha u horario.</span>`;
        } else if (totalPax > avail.remaining) {
            badge.className = 'mt-2 text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/60 rounded-xl px-3 py-2 flex items-center gap-2';
            badgeText.innerHTML = `<i class="fa-solid fa-triangle-exclamation shrink-0"></i><span>Seleccionaste ${totalPax} pax pero solo quedan <strong>${avail.remaining}</strong> cupos libres.</span>`;
        } else if (avail.remaining <= 2) {
            badge.className = 'mt-2 text-xs font-semibold text-amber-300 bg-amber-950/50 border border-amber-700/50 rounded-xl px-3 py-2 flex items-center gap-2';
            badgeText.innerHTML = `<i class="fa-solid fa-fire shrink-0"></i><span>¡Últimos <strong>${avail.remaining}</strong> de ${avail.capacity} cupos disponibles!</span>`;
        } else {
            badge.className = 'mt-2 text-xs font-semibold text-emerald-300 bg-emerald-950/50 border border-emerald-800/60 rounded-xl px-3 py-2 flex items-center gap-2';
            badgeText.innerHTML = `<i class="fa-solid fa-circle-check shrink-0"></i><span>Quedan <strong>${avail.remaining}</strong> de ${avail.capacity} cupos disponibles para esta salida.</span>`;
        }
    }

    if (nextBtn && state.step === 1) {
        const disabled = avail.remaining === 0 || totalPax > avail.remaining;
        nextBtn.disabled = disabled;
        nextBtn.classList.toggle('opacity-50', disabled);
        nextBtn.classList.toggle('cursor-not-allowed', disabled);
    }

    updateQuoteSummary();
}

function updateQuoteSummary() {
    const quote = bookingService.calculateQuote({
        excursionId: state.excursionId,
        adults: state.adults,
        children: state.children,
        selectedExtraIds: state.selectedExtraIds
    });

    const breakdownEl = document.getElementById('modalPriceBreakdown');
    if (breakdownEl) {
        const parts = [`${quote.adults} adulto${quote.adults > 1 ? 's' : ''} (${formatARS(quote.adultsSubtotal)})`];
        if (quote.children > 0) {
            parts.push(`${quote.children} menor${quote.children > 1 ? 'es' : ''} (${formatARS(quote.childrenSubtotal)})`);
        }
        if (quote.extrasSubtotal > 0) {
            parts.push(`Extras (${formatARS(quote.extrasSubtotal)})`);
        }
        breakdownEl.textContent = parts.join(' + ');
    }

    setText('modalPriceSummary', formatARSFull(quote.totalPrice));
    return quote;
}

function goToStep(stepNumber) {
    state.step = stepNumber;

    [1, 2, 3].forEach((n) => {
        const panel = document.getElementById(`bookingStep${n}`);
        if (panel) panel.classList.toggle('hidden', n !== stepNumber);

        const indicator = document.querySelector(`[data-stepper-btn="${n}"]`);
        if (indicator) {
            const isCurrent = n === stepNumber;
            const isCompleted = n < stepNumber;
            indicator.disabled = n > stepNumber;
            indicator.className = `flex-1 flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                isCurrent
                    ? 'bg-amber-500 text-stone-950 shadow'
                    : isCompleted
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900/60 cursor-pointer'
                    : 'bg-stone-950/70 text-stone-500 border border-stone-800/80 cursor-not-allowed'
            }`;
        }
    });

    const backBtn = document.getElementById('bookingBackBtn');
    const nextBtn = document.getElementById('bookingNextBtn');
    const submitBtn = document.getElementById('bookingSubmitBtn');

    if (backBtn) backBtn.classList.toggle('hidden', stepNumber === 1);
    if (nextBtn) {
        nextBtn.classList.toggle('hidden', stepNumber === 3);
        nextBtn.disabled = false;
        nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    if (submitBtn) submitBtn.classList.toggle('hidden', stepNumber !== 3);

    if (stepNumber === 1) updateAvailabilityAndUI();

    const scrollContainer = document.querySelector('#bookingModal .overflow-y-auto');
    if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep1() {
    const exc = getExcursionById(state.excursionId);
    if (!state.tourDate) {
        setFieldError('modalDatePicker', 'Seleccioná la fecha de tu excursión en el calendario.');
        return false;
    }

    const totalPax = state.adults + state.children;
    if (exc && totalPax < (exc.minPax || 1)) {
        showToast(`Esta excursión requiere un mínimo de ${exc.minPax} pasajeros.`, 'warning');
        return false;
    }

    const avail = bookingService.getSlotAvailability(state.excursionId, state.tourDate, state.tourTime);
    if (avail.remaining === 0 || totalPax > avail.remaining) {
        showToast('No hay suficientes cupos para esa fecha y turno. Elegí otro horario o reducí pasajeros.', 'error');
        return false;
    }
    return true;
}

function validateStep2() {
    clearAllFieldErrors();
    let valid = true;

    const name = document.getElementById('custName')?.value.trim() || '';
    const phone = document.getElementById('custPhone')?.value.trim() || '';
    const email = document.getElementById('custEmail')?.value.trim() || '';
    const pickupZone = document.getElementById('custPickupZone')?.value || '';
    const hotel = document.getElementById('custHotel')?.value.trim() || '';

    if (name.length < 3) {
        setFieldError('custName', 'Ingresá tu nombre y apellido completo (mínimo 3 caracteres).');
        valid = false;
    }

    if (phone.replace(/\D/g, '').length < 8) {
        setFieldError('custPhone', 'Ingresá un WhatsApp válido con código de área (mín. 8 dígitos).');
        valid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError('custEmail', 'Ingresá un correo electrónico válido para tu voucher.');
        valid = false;
    }

    if (!pickupZone) {
        setFieldError('custPickupZone', 'Seleccioná la zona donde te alojás para coordinar el pick-up.');
        valid = false;
    }

    const isBase = pickupZone.includes('Base Operativa');
    if (!isBase && hotel.length < 3) {
        setFieldError('custHotel', 'Indicá el nombre del hotel, cabaña o dirección para pasarte a buscar.');
        valid = false;
    }

    if (!valid) {
        showToast('Revisá los campos marcados en rojo antes de continuar.', 'warning');
    }
    return valid;
}

function renderStep3Recap() {
    const quote = updateQuoteSummary();
    const pickupZone = document.getElementById('custPickupZone')?.value || '';
    const hotel = document.getElementById('custHotel')?.value.trim() || 'Base Operativa Av. del Sol 650';
    const name = document.getElementById('custName')?.value.trim() || '';

    setText('recapTourName', quote.excursion.name);
    setText('recapDateTime', `${formatDateES(state.tourDate)} · ${state.tourTime} hs`);
    setText(
        'recapPax',
        `${quote.totalPax} pasajero${quote.totalPax > 1 ? 's' : ''} (${quote.adults} Adulto${quote.adults > 1 ? 's' : ''}${quote.children > 0 ? `, ${quote.children} Menor${quote.children > 1 ? 'es' : ''}` : ''})`
    );
    setText('recapPickup', `${pickupZone} — ${hotel}`);
    setText('recapClient', name);

    const extrasRow = document.getElementById('recapExtrasRow');
    const extrasVal = document.getElementById('recapExtrasVal');
    if (extrasRow && extrasVal) {
        if (quote.extrasSelected.length > 0) {
            extrasVal.textContent = quote.extrasSelected
                .map((ex) => `${ex.name} (x${ex.qty})`)
                .join(' · ');
            extrasRow.classList.remove('hidden');
        } else {
            extrasRow.classList.add('hidden');
        }
    }

    setText('recapTotal', formatARSFull(quote.totalPrice));
}

function handleBookingSubmit(e) {
    e.preventDefault();
    if (!validateStep1()) {
        goToStep(1);
        return;
    }
    if (!validateStep2()) {
        goToStep(2);
        return;
    }

    const pickupZone = document.getElementById('custPickupZone')?.value || 'Villa de Merlo (Centro / Av. del Sol)';
    const hotelRaw = document.getElementById('custHotel')?.value.trim() || '';
    const payMethod = document.querySelector('input[name="payMethod"]:checked')?.value || 'transferencia';

    try {
        const reservation = bookingService.createBooking({
            excursionId: state.excursionId,
            tourDate: state.tourDate,
            tourTime: state.tourTime,
            adults: state.adults,
            children: state.children,
            selectedExtraIds: [...state.selectedExtraIds],
            clientName: document.getElementById('custName').value,
            clientPhone: document.getElementById('custPhone').value,
            clientEmail: document.getElementById('custEmail').value,
            clientDni: document.getElementById('custDNI')?.value || '',
            pickupZone,
            hotel: hotelRaw || 'Punto de encuentro: Base Av. del Sol 650',
            notes: document.getElementById('custNotes')?.value || '',
            paymentMethod: payMethod
        });

        closeBookingModal();
        showToast(`Reserva ${reservation.code} registrada correctamente.`, 'success');
        onBookingCreatedCallback(reservation);
    } catch (err) {
        showToast(err.message || 'No se pudo completar la reserva.', 'error');
        goToStep(1);
    }
}

function setFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    const errEl = document.getElementById(`${inputId}Error`);
    if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.classList.add('border-rose-500');
        input.classList.remove('border-stone-700');
    }
    if (errEl) {
        errEl.textContent = message;
        errEl.classList.remove('hidden');
    }
}

function clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    const errEl = document.getElementById(`${inputId}Error`);
    if (input) {
        input.removeAttribute('aria-invalid');
        input.classList.remove('border-rose-500');
        input.classList.add('border-stone-700');
    }
    if (errEl) {
        errEl.textContent = '';
        errEl.classList.add('hidden');
    }
}

function clearAllFieldErrors() {
    ['modalDatePicker', 'custName', 'custPhone', 'custEmail', 'custPickupZone', 'custHotel'].forEach(clearFieldError);
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
