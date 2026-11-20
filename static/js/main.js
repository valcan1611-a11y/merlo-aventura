// Merlo Aventura - Main Interactive Script

let flatpickrInstance = null;
let currentExcursionsData = [];

document.addEventListener('DOMContentLoaded', () => {
    initDatePicker();
    initVideoControls();
    loadExcursionsData();
});

// ----------------- VIDEO HERO CONTROLS ----------------- //

function initVideoControls() {
    const video = document.getElementById('heroVideo');
    if (!video) return;

    // Try auto-play muted (standard browser policy)
    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log('Video autoplay blocked or video file not loaded yet:', error);
        });
    }
}

function toggleHeroSound() {
    const video = document.getElementById('heroVideo');
    const icon = document.getElementById('soundIcon');
    if (!video) return;

    if (video.muted) {
        video.muted = false;
        if (icon) {
            icon.className = 'fa-solid fa-volume-high text-sm text-amber-400';
        }
    } else {
        video.muted = true;
        if (icon) {
            icon.className = 'fa-solid fa-volume-xmark text-sm';
        }
    }
}

function toggleHeroPlay() {
    const video = document.getElementById('heroVideo');
    const icon = document.getElementById('playIcon');
    if (!video) return;

    if (video.paused) {
        video.play();
        if (icon) icon.className = 'fa-solid fa-pause text-sm';
    } else {
        video.pause();
        if (icon) icon.className = 'fa-solid fa-play text-sm text-amber-400';
    }
}

// ----------------- DATEPICKER & CALENDAR ----------------- //

function initDatePicker() {
    const dateInput = document.getElementById('modalDatePicker');
    if (!dateInput) return;

    // Tomorrow as default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    flatpickrInstance = flatpickr(dateInput, {
        locale: flatpickr.l1ons.es,
        minDate: 'today',
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'l, j \\de F \\de Y',
        defaultDate: tomorrow,
        onChange: function(selectedDates, dateStr) {
            checkSlotAvailability();
        }
    });
}

// ----------------- EXCURSION DATA & MODAL ----------------- //

async function loadExcursionsData() {
    try {
        const res = await fetch('/api/excursions');
        const data = await res.json();
        if (data.success) {
            currentExcursionsData = data.excursions;
        }
    } catch (e) {
        console.error('Failed to preload excursions:', e);
    }
}

function openBookingModal(excursionId = null) {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    const select = document.getElementById('modalExcursionSelect');
    if (select) {
        if (excursionId) {
            select.value = excursionId;
        }
        onExcursionChanged();
    }
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

function onExcursionChanged() {
    const select = document.getElementById('modalExcursionSelect');
    if (!select || !select.selectedOptions || !select.selectedOptions[0]) return;

    const option = select.selectedOptions[0];
    const priceAdult = parseFloat(option.dataset.priceAdult || 0);
    const priceChild = parseFloat(option.dataset.priceChild || 0);

    // Update labels
    const adultLbl = document.getElementById('adultPriceLabel');
    const childLbl = document.getElementById('childPriceLabel');
    if (adultLbl) adultLbl.innerText = `$${formatNumber(priceAdult)} c/u`;
    if (childLbl) childLbl.innerText = `$${formatNumber(priceChild)} c/u`;

    // Update available times for this excursion
    const timeSelect = document.getElementById('modalTimeSelect');
    if (timeSelect && option.dataset.times) {
        try {
            const times = JSON.parse(option.dataset.times);
            timeSelect.innerHTML = '';
            times.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.innerText = `Turno ${t >= '12:00' ? 'Tarde' : 'Mañana'} (${t} hs)`;
                timeSelect.appendChild(opt);
            });
        } catch (e) {
            console.error('Error parsing times:', e);
        }
    }

    updateTotalPrice();
    checkSlotAvailability();
}

function changeCount(type, delta) {
    const input = document.getElementById(`${type}Input`);
    const display = document.getElementById(`${type === 'adults' ? 'adult' : 'child'}CountDisplay`);
    if (!input || !display) return;

    let current = parseInt(input.value || 0);
    let min = (type === 'adults') ? 1 : 0;
    let max = 8;

    let next = current + delta;
    if (next < min) next = min;
    if (next > max) next = max;

    input.value = next;
    display.innerText = next;

    updateTotalPrice();
    checkSlotAvailability();
}

function updateTotalPrice() {
    const select = document.getElementById('modalExcursionSelect');
    if (!select || !select.selectedOptions || !select.selectedOptions[0]) return;

    const option = select.selectedOptions[0];
    const priceAdult = parseFloat(option.dataset.priceAdult || 0);
    const priceChild = parseFloat(option.dataset.priceChild || 0);

    const adults = parseInt(document.getElementById('adultsInput')?.value || 1);
    const children = parseInt(document.getElementById('childrenInput')?.value || 0);

    const total = (adults * priceAdult) + (children * priceChild);

    const totalDisplay = document.getElementById('modalTotalPriceDisplay');
    if (totalDisplay) {
        totalDisplay.innerText = `$${formatNumber(total)} ARS`;
    }
}

async function checkSlotAvailability() {
    const select = document.getElementById('modalExcursionSelect');
    const dateInput = document.getElementById('modalDatePicker');
    const timeSelect = document.getElementById('modalTimeSelect');
    const badge = document.getElementById('availabilityBadge');
    const badgeText = document.getElementById('availabilityText');

    if (!select || !dateInput || !timeSelect || !badge) return;

    const excId = select.value;
    const dateVal = dateInput.value;
    const timeVal = timeSelect.value;

    if (!excId || !dateVal) {
        badge.classList.add('hidden');
        return;
    }

    try {
        const res = await fetch(`/api/availability?excursion_id=${excId}&date=${dateVal}`);
        const data = await res.json();

        if (data.success && data.slots) {
            const currentSlot = data.slots.find(s => s.time === timeVal);
            if (currentSlot) {
                badge.classList.remove('hidden');
                if (currentSlot.remaining > 0) {
                    badge.className = 'mt-1.5 text-xs font-semibold text-emerald-400 flex items-center gap-1';
                    badgeText.innerHTML = `<i class="fa-solid fa-circle-check text-[10px]"></i> ¡Quedan <strong>${currentSlot.remaining}</strong> cupos para este turno!`;
                } else {
                    badge.className = 'mt-1.5 text-xs font-semibold text-rose-400 flex items-center gap-1';
                    badgeText.innerHTML = `<i class="fa-solid fa-circle-xmark text-[10px]"></i> Turno agotado. Por favor elegí otro horario o fecha.`;
                }
            }
        }
    } catch (e) {
        console.error('Error fetching availability:', e);
    }
}

// ----------------- SUBMIT BOOKING ----------------- //

async function handleBookingSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = document.getElementById('submitBookingBtn');
    const alertBox = document.getElementById('bookingAlert');

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    // Basic UI loading state
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Procesando Reserva...</span>';

    alertBox.classList.add('hidden');
    alertBox.className = 'hidden p-4 rounded-xl text-xs font-semibold';

    try {
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            alertBox.classList.remove('hidden');
            alertBox.classList.add('bg-emerald-950', 'text-emerald-200', 'border', 'border-emerald-800');
            alertBox.innerHTML = '<i class="fa-solid fa-circle-check mr-1.5"></i> ¡Reserva creada con éxito! Redirigiendo...';

            if (data.payment_method === 'mercadopago') {
                // If using Mercado Pago, redirect to Checkout Pro preference URL
                window.location.href = data.init_point;
            } else {
                // If Bank Transfer, redirect to bank transfer details page
                window.location.href = data.redirect_url;
            }
        } else {
            alertBox.classList.remove('hidden');
            alertBox.classList.add('bg-rose-950', 'text-rose-200', 'border', 'border-rose-800');
            alertBox.innerHTML = `<i class="fa-solid fa-circle-xmark mr-1.5"></i> ${data.error || 'Error al procesar reserva'}`;

            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    } catch (err) {
        alertBox.classList.remove('hidden');
        alertBox.classList.add('bg-rose-950', 'text-rose-200', 'border', 'border-rose-800');
        alertBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-1.5"></i> Error de conexión al crear reserva. Intentá nuevamente.';

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// ----------------- QUICK INQUIRY (WHATSAPP) ----------------- //

function handleInquirySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('inqName')?.value || '';
    const phone = document.getElementById('inqPhone')?.value || '';
    const tour = document.getElementById('inqTour')?.value || '';
    const msg = document.getElementById('inqMsg')?.value || '';

    const text = `¡Hola Merlo Aventura! Mi nombre es ${name} (Tel: ${phone}). Quisiera consultar sobre la excursión "${tour}". Detalle: ${msg}`;
    const rawNumber = '5492664123456';
    const url = `https://wa.me/${rawNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// Helper formatting function
function formatNumber(num) {
    return new Intl.NumberFormat('es-AR').format(Math.round(num));
}
