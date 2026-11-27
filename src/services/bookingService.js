/**
 * Capa de servicio de reservas.
 * Implementa persistencia estructurada en localStorage y deja preparada una interfaz
 * limpia (BookingAdapter) para conectar con un backend REST/SQLite sin tocar la UI.
 */

import { EXCURSIONS, getExcursionById } from '../data/excursions.js';
import { storageService } from './storageService.js';
import {
    escapeCSVCell,
    formatARSFull,
    formatDateES,
    generateBookingCode,
    getStatusMeta
} from '../utils/formatters.js';

const RESERVATIONS_KEY = 'ma_reservations';
const listeners = new Set();

function normalizeReservation(raw) {
    const exc =
        getExcursionById(raw.excursionId) ||
        EXCURSIONS.find((e) => e.name === raw.tourName) ||
        EXCURSIONS[0];

    const adults = Math.max(1, Number(raw.adults) || 1);
    const children = Math.max(0, Number(raw.children) || 0);
    const totalPax = Number(raw.totalPax) || adults + children;
    const extrasSelected = Array.isArray(raw.extrasSelected) ? raw.extrasSelected : [];
    const extrasSubtotal = Number(raw.extrasSubtotal) || 0;
    const adultsSubtotal = Number(raw.adultsSubtotal) || adults * (exc?.priceAdult || 0);
    const childrenSubtotal = Number(raw.childrenSubtotal) || children * (exc?.priceChild || 0);
    const totalPrice =
        Number(raw.totalPrice) || adultsSubtotal + childrenSubtotal + extrasSubtotal;

    const validStatuses = ['pending', 'approved', 'cancelled'];
    const paymentStatus = validStatuses.includes(raw.paymentStatus)
        ? raw.paymentStatus
        : 'pending';

    return {
        code: String(raw.code || 'MA-00000'),
        excursionId: exc ? exc.id : Number(raw.excursionId) || 1,
        tourName: raw.tourName || exc?.name || 'Excursión Merlo Aventura',
        tourDate: String(raw.tourDate || ''),
        tourTime: String(raw.tourTime || '09:00'),
        adults,
        children,
        totalPax,
        extrasSelected,
        adultsSubtotal,
        childrenSubtotal,
        extrasSubtotal,
        totalPrice,
        clientName: String(raw.clientName || ''),
        clientPhone: String(raw.clientPhone || ''),
        clientEmail: String(raw.clientEmail || ''),
        clientDni: String(raw.clientDni || ''),
        pickupZone: String(raw.pickupZone || 'Villa de Merlo (Centro / Av. del Sol)'),
        hotel: String(raw.hotel || 'A coordinar en Merlo'),
        notes: String(raw.notes || ''),
        paymentMethod: raw.paymentMethod === 'mercadopago' ? 'mercadopago' : 'transferencia',
        paymentStatus,
        createdAt: raw.createdAt || new Date().toISOString(),
        dateCreated: raw.dateCreated || new Date().toLocaleDateString('es-AR')
    };
}

/**
 * Adaptador local (activo en despliegue estático).
 * Para migrar a Flask/API REST solo basta intercambiar este adaptador
 * apuntando a /api/bookings y /api/availability.
 */
const localAdapter = {
    getAll() {
        const stored = storageService.getJSON(RESERVATIONS_KEY, []);
        if (!Array.isArray(stored)) return [];
        return stored.map(normalizeReservation);
    },

    saveAll(list) {
        return storageService.setJSON(RESERVATIONS_KEY, list);
    }
};

function notifyListeners() {
    const snapshot = localAdapter.getAll();
    listeners.forEach((cb) => {
        try {
            cb(snapshot);
        } catch (err) {
            console.error('[bookingService] Error notificando listener:', err);
        }
    });
}

export const bookingService = {
    list() {
        return localAdapter.getAll();
    },

    getByCode(code) {
        return localAdapter.getAll().find((r) => r.code === code) || null;
    },

    /**
     * Calcula cupos reales descontando reservas activas (pendientes o aprobadas)
     * para la misma excursión, fecha y turno.
     */
    getSlotAvailability(excursionId, tourDate, tourTime) {
        const exc = getExcursionById(excursionId);
        const capacity = exc?.maxCapacity || 8;
        if (!exc || !tourDate || !tourTime) {
            return { capacity, booked: 0, remaining: capacity };
        }

        const booked = localAdapter
            .getAll()
            .filter(
                (r) =>
                    r.excursionId === exc.id &&
                    r.tourDate === tourDate &&
                    r.tourTime === tourTime &&
                    r.paymentStatus !== 'cancelled'
            )
            .reduce((sum, r) => sum + r.totalPax, 0);

        return {
            capacity,
            booked,
            remaining: Math.max(0, capacity - booked)
        };
    },

    calculateQuote({ excursionId, adults, children, selectedExtraIds = [] }) {
        const exc = getExcursionById(excursionId) || EXCURSIONS[0];
        const safeAdults = Math.max(1, Number(adults) || 1);
        const safeChildren = Math.max(0, Number(children) || 0);
        const totalPax = safeAdults + safeChildren;

        const adultsSubtotal = safeAdults * exc.priceAdult;
        const childrenSubtotal = safeChildren * exc.priceChild;

        const extrasSelected = (exc.extras || [])
            .filter((extra) => selectedExtraIds.includes(extra.id))
            .map((extra) => {
                const qty = extra.perPerson ? totalPax : 1;
                return {
                    id: extra.id,
                    name: extra.name,
                    unitPrice: extra.price,
                    qty,
                    subtotal: extra.price * qty
                };
            });

        const extrasSubtotal = extrasSelected.reduce((acc, item) => acc + item.subtotal, 0);
        const totalPrice = adultsSubtotal + childrenSubtotal + extrasSubtotal;

        return {
            excursion: exc,
            adults: safeAdults,
            children: safeChildren,
            totalPax,
            adultsSubtotal,
            childrenSubtotal,
            extrasSelected,
            extrasSubtotal,
            totalPrice
        };
    },

    createBooking(payload) {
        const exc = getExcursionById(payload.excursionId);
        if (!exc) {
            throw new Error('La excursión seleccionada no es válida.');
        }

        const totalPax = (Number(payload.adults) || 1) + (Number(payload.children) || 0);
        const availability = this.getSlotAvailability(exc.id, payload.tourDate, payload.tourTime);
        if (totalPax > availability.remaining) {
            throw new Error(
                availability.remaining === 0
                    ? 'Este turno ya no tiene cupos disponibles. Elegí otra fecha u horario.'
                    : `Solo quedan ${availability.remaining} cupos disponibles para este turno.`
            );
        }

        const quote = this.calculateQuote({
            excursionId: exc.id,
            adults: payload.adults,
            children: payload.children,
            selectedExtraIds: payload.selectedExtraIds || []
        });

        const list = localAdapter.getAll();
        const existingCodes = new Set(list.map((r) => r.code));
        const code = generateBookingCode(existingCodes);

        const reservation = normalizeReservation({
            code,
            excursionId: exc.id,
            tourName: exc.name,
            tourDate: payload.tourDate,
            tourTime: payload.tourTime,
            adults: quote.adults,
            children: quote.children,
            totalPax: quote.totalPax,
            extrasSelected: quote.extrasSelected,
            adultsSubtotal: quote.adultsSubtotal,
            childrenSubtotal: quote.childrenSubtotal,
            extrasSubtotal: quote.extrasSubtotal,
            totalPrice: quote.totalPrice,
            clientName: payload.clientName.trim(),
            clientPhone: payload.clientPhone.trim(),
            clientEmail: payload.clientEmail.trim(),
            clientDni: (payload.clientDni || '').trim(),
            pickupZone: payload.pickupZone,
            hotel: payload.hotel.trim(),
            notes: (payload.notes || '').trim(),
            paymentMethod: payload.paymentMethod,
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
            dateCreated: new Date().toLocaleDateString('es-AR')
        });

        list.unshift(reservation);
        localAdapter.saveAll(list);
        notifyListeners();
        return reservation;
    },

    updateStatus(code, newStatus) {
        if (!['pending', 'approved', 'cancelled'].includes(newStatus)) return null;
        const list = localAdapter.getAll();
        const idx = list.findIndex((r) => r.code === code);
        if (idx === -1) return null;

        list[idx] = { ...list[idx], paymentStatus: newStatus };
        localAdapter.saveAll(list);
        notifyListeners();
        return list[idx];
    },

    filter({ query = '', status = 'all' } = {}) {
        const q = String(query || '').trim().toLowerCase();
        return localAdapter.getAll().filter((r) => {
            if (status !== 'all' && r.paymentStatus !== status) return false;
            if (!q) return true;
            return (
                r.code.toLowerCase().includes(q) ||
                r.clientName.toLowerCase().includes(q) ||
                r.clientPhone.toLowerCase().includes(q) ||
                r.tourName.toLowerCase().includes(q) ||
                r.pickupZone.toLowerCase().includes(q)
            );
        });
    },

    getMetrics(bookings = localAdapter.getAll()) {
        const total = bookings.length;
        const approved = bookings.filter((r) => r.paymentStatus === 'approved').length;
        const pending = bookings.filter((r) => r.paymentStatus === 'pending').length;
        const cancelled = bookings.filter((r) => r.paymentStatus === 'cancelled').length;
        const revenueApproved = bookings
            .filter((r) => r.paymentStatus === 'approved')
            .reduce((sum, r) => sum + r.totalPrice, 0);
        const revenuePending = bookings
            .filter((r) => r.paymentStatus === 'pending')
            .reduce((sum, r) => sum + r.totalPrice, 0);

        return { total, approved, pending, cancelled, revenueApproved, revenuePending };
    },

    buildCSV(bookings = localAdapter.getAll()) {
        const headers = [
            'Código',
            'Fecha Creación',
            'Excursión',
            'Fecha Salida',
            'Turno',
            'Adultos',
            'Menores',
            'Total Pax',
            'Extras',
            'Total ARS',
            'Cliente',
            'Teléfono',
            'Email',
            'DNI',
            'Zona Pick-up',
            'Alojamiento',
            'Medio de Pago',
            'Estado'
        ];

        const rows = bookings.map((r) => {
            const extrasText = (r.extrasSelected || [])
                .map((ex) => `${ex.name} x${ex.qty}`)
                .join(' | ');
            const statusLabel = getStatusMeta(r.paymentStatus).label;
            const payLabel = r.paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia';

            return [
                r.code,
                r.dateCreated,
                r.tourName,
                r.tourDate,
                `${r.tourTime} hs`,
                r.adults,
                r.children,
                r.totalPax,
                extrasText || 'Sin extras',
                r.totalPrice,
                r.clientName,
                r.clientPhone,
                r.clientEmail,
                r.clientDni || '-',
                r.pickupZone,
                r.hotel,
                payLabel,
                statusLabel
            ]
                .map(escapeCSVCell)
                .join(',');
        });

        // UTF-8 BOM para apertura correcta en Excel con tildes y eñes
        return '\uFEFF' + [headers.map(escapeCSVCell).join(','), ...rows].join('\r\n');
    },

    formatSummaryText(res, settings) {
        const statusLabel = getStatusMeta(res.paymentStatus).label;
        const payLabel = res.paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia Bancaria';
        const extrasLines =
            res.extrasSelected && res.extrasSelected.length > 0
                ? res.extrasSelected
                      .map((ex) => `  • ${ex.name} (x${ex.qty}): ${formatARSFull(ex.subtotal)}`)
                      .join('\n')
                : '  • Ninguno';

        return [
            '========================================',
            '  VOUCHER DIGITAL — MERLO AVENTURA',
            '  Villa de Merlo · Sierras de los Comechingones',
            '========================================',
            `Código de Reserva: ${res.code}`,
            `Estado: ${statusLabel}`,
            `Excursión: ${res.tourName}`,
            `Fecha y Turno: ${formatDateES(res.tourDate)} · ${res.tourTime} hs`,
            `Pasajeros: ${res.totalPax} (${res.adults} Adultos, ${res.children} Menores)`,
            `Extras:\n${extrasLines}`,
            `Total: ${formatARSFull(res.totalPrice)} (${payLabel})`,
            '----------------------------------------',
            `Titular: ${res.clientName}`,
            `WhatsApp: ${res.clientPhone}`,
            `Email: ${res.clientEmail}`,
            `Pick-up: ${res.pickupZone} — ${res.hotel}`,
            '----------------------------------------',
            `Consultas WhatsApp: ${settings.whatsappDisplay}`,
            `Base Operativa: ${settings.address}`
        ].join('\n');
    },

    subscribe(callback) {
        listeners.add(callback);
        return () => listeners.delete(callback);
    }
};
