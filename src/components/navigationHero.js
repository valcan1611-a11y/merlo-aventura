/**
 * Navegación accesible, Hero con fallback elegante de video,
 * secciones de confianza (Flota, Paso a Paso, Testimonios, FAQ, Contacto, Footer)
 * y sincronización reactiva con settingsService.
 */

import { SITE_CONFIG } from '../data/siteConfig.js';
import { EXCURSIONS } from '../data/excursions.js';
import { settingsService } from '../services/settingsService.js';
import { buildWhatsAppUrl, escapeHTML, formatARS } from '../utils/formatters.js';
import { showToast } from '../utils/toast.js';

export function initNavigationAndHero({ onOpenBooking, onOpenDetail }) {
    renderHeroBadges();
    renderFleetSection();
    renderHowItWorks();
    renderTestimonials();
    renderFaqAccordion();
    populateInquirySelect();
    renderFooterExcursions(onOpenBooking, onOpenDetail);
    initHeroVideo();
    initMobileDrawer();
    initInquiryForm();

    // Sincronizar enlaces de contacto/WhatsApp al inicio y ante cambios en Ajustes
    syncSettingsToDOM(settingsService.getSettings());
    settingsService.subscribe(syncSettingsToDOM);
}

function renderHeroBadges() {
    const container = document.getElementById('heroTrustBadges');
    if (!container) return;

    container.innerHTML = SITE_CONFIG.hero.trustBadges
        .map(
            (b) => `
            <div class="flex items-center justify-center gap-2 bg-stone-950/65 backdrop-blur-md py-2 px-3 rounded-xl border border-stone-700/60 shadow-sm">
                <i class="${b.icon} text-amber-400 text-xs shrink-0" aria-hidden="true"></i>
                <span class="text-[11px] sm:text-xs font-semibold text-stone-100 whitespace-nowrap">${escapeHTML(b.label)}</span>
            </div>
        `
        )
        .join('');
}

function initHeroVideo() {
    const video = document.getElementById('heroVideo');
    const controls = document.getElementById('heroVideoControls');
    const soundBtn = document.getElementById('videoSoundBtn');
    const playBtn = document.getElementById('videoPlayBtn');
    const soundIcon = document.getElementById('soundIcon');
    const playIcon = document.getElementById('playIcon');

    if (!video) return;

    // Respetar preferencia del sistema para movimiento reducido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        video.classList.add('hidden');
        return;
    }

    let videoReady = false;

    const revealVideo = () => {
        if (videoReady) return;
        videoReady = true;
        video.classList.remove('opacity-0');
        video.classList.add('opacity-100');
        if (controls) controls.classList.remove('hidden');
    };

    const handleUnavailable = () => {
        video.classList.add('opacity-0');
        if (controls) controls.classList.add('hidden');
    };

    video.muted = true;
    video.addEventListener('playing', revealVideo, { once: true });
    video.addEventListener('error', handleUnavailable);

    // Si todas las fuentes fallan, mantener el fallback elegante con hero-poster.jpg
    const sources = video.querySelectorAll('source');
    const lastSource = sources[sources.length - 1];
    if (lastSource) {
        lastSource.addEventListener('error', handleUnavailable);
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.then === 'function') {
        playPromise
            .then(() => {
                if (video.readyState >= 2) revealVideo();
            })
            .catch(() => {
                // Autoplay bloqueado o video no disponible: la imagen poster permanece impecable
                handleUnavailable();
            });
    }

    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            soundBtn.setAttribute('aria-pressed', String(!video.muted));
            soundBtn.title = video.muted ? 'Activar sonido del video' : 'Silenciar video';
            if (soundIcon) {
                soundIcon.className = video.muted
                    ? 'fa-solid fa-volume-xmark text-sm'
                    : 'fa-solid fa-volume-high text-sm text-amber-400';
            }
        });
    }

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (video.paused) {
                video.play().catch(() => {});
                playBtn.setAttribute('aria-pressed', 'false');
                if (playIcon) playIcon.className = 'fa-solid fa-pause text-sm';
            } else {
                video.pause();
                playBtn.setAttribute('aria-pressed', 'true');
                if (playIcon) playIcon.className = 'fa-solid fa-play text-sm text-amber-400';
            }
        });
    }
}

function initMobileDrawer() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    const icon = menuBtn?.querySelector('i');

    if (!menuBtn || !menu) return;

    const setMenuOpen = (isOpen) => {
        menu.classList.toggle('hidden', !isOpen);
        menuBtn.setAttribute('aria-expanded', String(isOpen));
        menuBtn.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
        if (icon) {
            icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        }
    };

    menuBtn.addEventListener('click', () => {
        const isCurrentlyOpen = !menu.classList.contains('hidden');
        setMenuOpen(!isCurrentlyOpen);
    });

    menu.querySelectorAll('a, button').forEach((el) => {
        el.addEventListener('click', () => setMenuOpen(false));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
            setMenuOpen(false);
            menuBtn.focus();
        }
    });
}

function renderFleetSection() {
    const cardsGrid = document.getElementById('fleetCardsGrid');
    const specsGrid = document.getElementById('fleetSpecsGrid');

    const badgeClasses = {
        amber: 'bg-amber-500 text-stone-950',
        emerald: 'bg-emerald-500 text-stone-950',
        sky: 'bg-sky-500 text-stone-950'
    };

    const footerColors = {
        amber: 'text-amber-400',
        emerald: 'text-emerald-400',
        sky: 'text-sky-400'
    };

    if (cardsGrid) {
        cardsGrid.innerHTML = SITE_CONFIG.fleet.cards
            .map(
                (card) => `
                <article class="bg-stone-900/90 rounded-3xl overflow-hidden border border-stone-800/90 group hover:border-amber-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-black/40 flex flex-col">
                    <div class="relative h-60 overflow-hidden bg-stone-950">
                        <img src="${card.image}" alt="${escapeHTML(card.alt)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/15 to-transparent"></div>
                        <span class="absolute top-4 left-4 ${badgeClasses[card.badgeColor] || badgeClasses.amber} text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                            ${escapeHTML(card.badge)}
                        </span>
                    </div>
                    <div class="p-6 flex-1 flex flex-col justify-between">
                        <div>
                            <h3 class="font-heading font-bold text-lg text-white mb-2">${escapeHTML(card.title)}</h3>
                            <p class="text-sm text-stone-300 leading-relaxed">${escapeHTML(card.description)}</p>
                        </div>
                        <div class="mt-5 pt-3.5 border-t border-stone-800/80 text-xs ${footerColors[card.footerColor] || 'text-amber-400'} font-semibold flex items-center gap-2">
                            <i class="${card.footerIcon}" aria-hidden="true"></i>
                            <span>${escapeHTML(card.footerText)}</span>
                        </div>
                    </div>
                </article>
            `
            )
            .join('');
    }

    if (specsGrid) {
        specsGrid.innerHTML = SITE_CONFIG.fleet.specs
            .map(
                (spec) => `
                <div class="p-5 rounded-2xl bg-stone-900/80 border border-stone-800/90 hover:border-stone-700 transition-colors">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                        <i class="${spec.icon} text-lg" aria-hidden="true"></i>
                    </div>
                    <h4 class="font-heading font-bold text-white text-sm mb-1.5">${escapeHTML(spec.title)}</h4>
                    <p class="text-xs text-stone-300 leading-relaxed">${escapeHTML(spec.description)}</p>
                </div>
            `
            )
            .join('');
    }
}

function renderHowItWorks() {
    const grid = document.getElementById('howItWorksGrid');
    if (!grid) return;

    const pillColors = {
        amber: 'text-amber-400',
        sky: 'text-sky-400',
        emerald: 'text-emerald-400'
    };

    grid.innerHTML = SITE_CONFIG.howItWorks
        .map(
            (item) => `
            <article class="bg-sierra-950/90 p-7 rounded-3xl border border-stone-800/90 hover:border-amber-500/35 transition-colors flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl font-heading font-black mb-5">
                        ${escapeHTML(item.step)}
                    </div>
                    <h3 class="font-heading font-bold text-xl text-white mb-2.5">${escapeHTML(item.title)}</h3>
                    <p class="text-stone-300 text-sm leading-relaxed mb-5">${escapeHTML(item.description)}</p>
                </div>
                <span class="text-xs ${pillColors[item.pillColor] || 'text-amber-400'} font-semibold flex items-center gap-2 pt-3 border-t border-stone-800/80">
                    <i class="${item.pillIcon}" aria-hidden="true"></i>
                    <span>${escapeHTML(item.pillText)}</span>
                </span>
            </article>
        `
        )
        .join('');
}

function renderTestimonials() {
    const grid = document.getElementById('testimonialsGrid');
    if (!grid) return;

    grid.innerHTML = SITE_CONFIG.testimonials
        .map(
            (t) => `
            <article class="bg-stone-900/90 p-6 sm:p-7 rounded-3xl border border-stone-800/90 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center text-amber-400 gap-1 text-xs" aria-label="Calificación 5 de 5 estrellas">
                            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        </div>
                        <span class="text-[11px] font-semibold text-stone-400 bg-stone-950/80 px-2.5 py-0.5 rounded-full border border-stone-800">${escapeHTML(t.tour)}</span>
                    </div>
                    <p class="text-stone-200 text-sm italic mb-6 leading-relaxed">"${escapeHTML(t.quote)}"</p>
                </div>
                <div class="flex items-center gap-3 pt-4 border-t border-stone-800/80">
                    <div class="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs">
                        ${escapeHTML(t.initials)}
                    </div>
                    <div>
                        <div class="font-bold text-white text-sm">${escapeHTML(t.name)}</div>
                        <div class="text-xs text-stone-400">${escapeHTML(t.city)}</div>
                    </div>
                </div>
            </article>
        `
        )
        .join('');
}

function renderFaqAccordion() {
    const container = document.getElementById('faqAccordionList');
    if (!container) return;

    container.innerHTML = SITE_CONFIG.faq
        .map(
            (item, idx) => `
            <details class="group bg-sierra-950/90 rounded-2xl border border-stone-800/90 hover:border-stone-700 transition-colors overflow-hidden" ${idx === 0 ? 'open' : ''}>
                <summary class="flex items-center justify-between gap-4 cursor-pointer p-5 sm:p-6 font-heading font-bold text-white text-sm sm:text-base list-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-2xl">
                    <span>${escapeHTML(item.question)}</span>
                    <span class="w-8 h-8 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-400 shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden="true">
                        <i class="fa-solid fa-chevron-down text-xs"></i>
                    </span>
                </summary>
                <div class="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 text-sm text-stone-300 leading-relaxed border-t border-stone-800/50">
                    <p class="pt-4">${escapeHTML(item.answer)}</p>
                </div>
            </details>
        `
        )
        .join('');
}

function populateInquirySelect() {
    const select = document.getElementById('inqTour');
    if (!select) return;

    const options = EXCURSIONS.map(
        (exc) => `<option value="${escapeHTML(exc.name)} (${formatARS(exc.priceAdult)})">${escapeHTML(exc.shortName)} — ${formatARS(exc.priceAdult)}</option>`
    );
    options.push('<option value="Salida Privada en Nissan Frontier 4x4">Salida Privada / A medida en Nissan Frontier 4x4</option>');
    select.innerHTML = options.join('');
}

function initInquiryForm() {
    const form = document.getElementById('inquiryForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('inqName')?.value.trim() || '';
        const phone = document.getElementById('inqPhone')?.value.trim() || '';
        const tour = document.getElementById('inqTour')?.value || '';
        const msg = document.getElementById('inqMsg')?.value.trim() || '';

        if (name.length < 2) {
            showToast('Por favor ingresá tu nombre completo.', 'warning');
            document.getElementById('inqName')?.focus();
            return;
        }
        if (phone.replace(/\D/g, '').length < 8) {
            showToast('Ingresá un número de WhatsApp válido (al menos 8 dígitos).', 'warning');
            document.getElementById('inqPhone')?.focus();
            return;
        }

        const settings = settingsService.getSettings();
        const text = `¡Hola Merlo Aventura! Soy ${name} (Tel: ${phone}). Quiero consultar por "${tour}".${msg ? ` Detalle: ${msg}` : ''}`;
        window.open(buildWhatsAppUrl(settings.whatsappRaw, text), '_blank', 'noopener');
        showToast('Abriendo WhatsApp con tu consulta prellenada.', 'success');
    });
}

function renderFooterExcursions(onOpenBooking, onOpenDetail) {
    const list = document.getElementById('footerExcursionsList');
    if (!list) return;

    list.innerHTML = EXCURSIONS.map(
        (exc) => `
        <li>
            <button type="button" data-footer-exc-id="${exc.id}" class="text-left w-full hover:text-amber-400 transition-colors flex items-center justify-between gap-2 text-xs text-stone-300 py-0.5">
                <span class="flex items-center gap-1.5 truncate">
                    <i class="fa-solid fa-angle-right text-[10px] text-amber-500 shrink-0" aria-hidden="true"></i>
                    <span class="truncate">${escapeHTML(exc.shortName)}</span>
                </span>
                <span class="text-stone-400 font-semibold shrink-0">${formatARS(exc.priceAdult)}</span>
            </button>
        </li>
    `
    ).join('');

    list.querySelectorAll('[data-footer-exc-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = Number(btn.getAttribute('data-footer-exc-id'));
            if (typeof onOpenDetail === 'function') {
                onOpenDetail(id);
            } else if (typeof onOpenBooking === 'function') {
                onOpenBooking(id);
            }
        });
    });
}

export function syncSettingsToDOM(settings) {
    const generalMsg = '¡Hola Merlo Aventura! Quiero consultar por las excursiones de trekking y 4x4 en Merlo.';
    const waUrl = buildWhatsAppUrl(settings.whatsappRaw, generalMsg);

    ['navWhatsappBtn', 'mobileWhatsappBtn', 'contactWhatsappBtn', 'footerWhatsapp', 'floatingWhatsapp'].forEach(
        (id) => {
            const el = document.getElementById(id);
            if (el) el.href = waUrl;
        }
    );

    const baseAddress = document.getElementById('baseAddressText');
    if (baseAddress) baseAddress.textContent = settings.address;

    const footerAddress = document.getElementById('footerAddressText');
    if (footerAddress) footerAddress.textContent = settings.address;

    const basePhone = document.getElementById('basePhoneText');
    if (basePhone) basePhone.textContent = `${settings.whatsappDisplay} (${SITE_CONFIG.defaults.hours})`;

    const footerPhone = document.getElementById('footerPhoneText');
    if (footerPhone) footerPhone.textContent = settings.whatsappDisplay;

    const baseEmail = document.getElementById('baseEmailText');
    if (baseEmail) baseEmail.textContent = settings.email;
}
