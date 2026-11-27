/**
 * Catálogo visual de excursiones con filtros rápidos (categoría, dificultad, duración)
 * y cards con desglose claro 4x4 vs Trekking, precios ARS y CTAs de conversión.
 */

import { CATALOG_FILTERS, EXCURSIONS } from '../data/excursions.js';
import { escapeHTML, formatARS } from '../utils/formatters.js';

const filterState = {
    category: 'all',
    difficulty: 'all',
    duration: 'all'
};

let callbacks = {
    onOpenDetail: () => {},
    onOpenBooking: () => {}
};

export function initCatalog({ onOpenDetail, onOpenBooking }) {
    callbacks = { onOpenDetail, onOpenBooking };
    renderFilterControls();
    renderCatalogGrid();
}

function getDifficultyBadgeStyle(level) {
    switch (level) {
        case 'facil':
            return 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60';
        case 'exigente':
            return 'bg-rose-950/90 text-rose-300 border-rose-700/60';
        default:
            return 'bg-amber-950/90 text-amber-300 border-amber-700/60';
    }
}

function renderFilterControls() {
    const catContainer = document.getElementById('catalogCategoryPills');
    const diffSelect = document.getElementById('catalogDifficultyFilter');
    const durSelect = document.getElementById('catalogDurationFilter');
    const resetBtn = document.getElementById('catalogResetFiltersBtn');

    if (catContainer) {
        catContainer.innerHTML = CATALOG_FILTERS.categories
            .map((cat) => {
                const active = filterState.category === cat.id;
                return `
                    <button type="button"
                        data-cat-filter="${cat.id}"
                        aria-pressed="${active}"
                        class="px-3.5 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            active
                                ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-lg shadow-amber-500/20'
                                : 'bg-sierra-950/80 text-stone-300 border-stone-800 hover:border-amber-500/50 hover:text-white'
                        }">
                        <i class="${cat.icon} text-[11px]" aria-hidden="true"></i>
                        <span>${escapeHTML(cat.label)}</span>
                    </button>
                `;
            })
            .join('');

        catContainer.querySelectorAll('[data-cat-filter]').forEach((btn) => {
            btn.addEventListener('click', () => {
                filterState.category = btn.getAttribute('data-cat-filter');
                renderFilterControls();
                renderCatalogGrid();
            });
        });
    }

    if (diffSelect && !diffSelect.dataset.bound) {
        diffSelect.innerHTML = CATALOG_FILTERS.difficulties
            .map((d) => `<option value="${d.id}">${escapeHTML(d.label)}</option>`)
            .join('');
        diffSelect.dataset.bound = 'true';
        diffSelect.addEventListener('change', () => {
            filterState.difficulty = diffSelect.value;
            renderCatalogGrid();
        });
    }
    if (diffSelect) diffSelect.value = filterState.difficulty;

    if (durSelect && !durSelect.dataset.bound) {
        durSelect.innerHTML = CATALOG_FILTERS.durations
            .map((d) => `<option value="${d.id}">${escapeHTML(d.label)}</option>`)
            .join('');
        durSelect.dataset.bound = 'true';
        durSelect.addEventListener('change', () => {
            filterState.duration = durSelect.value;
            renderCatalogGrid();
        });
    }
    if (durSelect) durSelect.value = filterState.duration;

    if (resetBtn && !resetBtn.dataset.bound) {
        resetBtn.dataset.bound = 'true';
        resetBtn.addEventListener('click', resetFilters);
    }
}

export function resetFilters() {
    filterState.category = 'all';
    filterState.difficulty = 'all';
    filterState.duration = 'all';
    renderFilterControls();
    renderCatalogGrid();
}

function getFilteredExcursions() {
    return EXCURSIONS.filter((exc) => {
        if (filterState.category !== 'all' && exc.category !== filterState.category) return false;
        if (filterState.difficulty !== 'all' && exc.difficultyLevel !== filterState.difficulty) return false;
        if (filterState.duration !== 'all' && exc.durationRange !== filterState.duration) return false;
        return true;
    });
}

function renderCatalogGrid() {
    const grid = document.getElementById('excursionsGrid');
    const countLabel = document.getElementById('catalogResultsCount');
    const resetBtn = document.getElementById('catalogResetFiltersBtn');
    if (!grid) return;

    const filtered = getFilteredExcursions();
    const hasActiveFilter =
        filterState.category !== 'all' ||
        filterState.difficulty !== 'all' ||
        filterState.duration !== 'all';

    if (countLabel) {
        countLabel.textContent =
            filtered.length === EXCURSIONS.length
                ? `Mostrando las ${EXCURSIONS.length} salidas oficiales`
                : `Mostrando ${filtered.length} de ${EXCURSIONS.length} salidas`;
    }
    if (resetBtn) {
        resetBtn.classList.toggle('hidden', !hasActiveFilter);
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full bg-sierra-950/90 border border-stone-800 rounded-3xl p-10 text-center space-y-4">
                <div class="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl mx-auto">
                    <i class="fa-solid fa-compass" aria-hidden="true"></i>
                </div>
                <h3 class="font-heading font-bold text-xl text-white">No encontramos salidas con esa combinación</h3>
                <p class="text-sm text-stone-400 max-w-md mx-auto">Probá limpiando los filtros para explorar todos los circuitos de trekking y 4x4 en las Sierras de los Comechingones.</p>
                <button type="button" id="emptyResetFiltersBtn" class="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition-colors">
                    Ver todas las excursiones
                </button>
            </div>
        `;
        document.getElementById('emptyResetFiltersBtn')?.addEventListener('click', resetFilters);
        return;
    }

    grid.innerHTML = filtered
        .map((exc) => {
            const diffStyle = getDifficultyBadgeStyle(exc.difficultyLevel);
            const r = exc.routeInfo;
            const hasFullGps = Boolean(exc.trailKey || r?.routeData);

            return `
                <article class="bg-sierra-950/95 rounded-3xl overflow-hidden border border-stone-800/90 hover:border-amber-500/45 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 flex flex-col group">
                    
                    <!-- Media Header -->
                    <button type="button"
                        data-open-detail="${exc.id}"
                        aria-label="Ver detalle, fotos y mapa GPS de ${escapeHTML(exc.name)}"
                        class="relative h-60 sm:h-64 w-full overflow-hidden bg-stone-950 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
                        <img src="${exc.image}" alt="${escapeHTML(exc.name)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute inset-0 bg-gradient-to-t from-sierra-950 via-sierra-950/25 to-black/35"></div>

                        <div class="absolute top-3.5 left-3.5 right-3.5 flex items-start justify-between gap-2">
                            <span class="bg-amber-500 text-stone-950 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                ${escapeHTML(exc.badge)}
                            </span>
                            <span class="text-[11px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${diffStyle}">
                                ${escapeHTML(exc.difficulty)}
                            </span>
                        </div>

                        <div class="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between gap-2 text-[11px] font-semibold">
                            <span class="inline-flex items-center gap-1.5 bg-stone-950/80 text-stone-200 px-2.5 py-1 rounded-lg border border-stone-700/60 backdrop-blur-md">
                                <i class="fa-regular fa-clock text-amber-400" aria-hidden="true"></i>
                                ${escapeHTML(exc.duration)}
                            </span>
                            <span class="inline-flex items-center gap-1.5 bg-stone-950/80 ${hasFullGps ? 'text-emerald-300 border-emerald-700/50' : 'text-stone-300 border-stone-700/60'} px-2.5 py-1 rounded-lg border backdrop-blur-md">
                                <i class="fa-solid fa-map-location-dot" aria-hidden="true"></i>
                                ${hasFullGps ? 'Track GPS Wikiloc' : 'Mapa Interactivo'}
                            </span>
                        </div>
                    </button>

                    <!-- Card Body -->
                    <div class="p-6 flex-1 flex flex-col justify-between gap-5">
                        <div class="space-y-4">
                            <div>
                                <div class="flex items-center gap-2 text-[11px] font-semibold text-stone-400 mb-1.5">
                                    <span class="text-amber-400/90 uppercase tracking-wider">${escapeHTML(exc.categoryLabel)}</span>
                                    ${exc.ageLimit ? `<span>•</span><span>${escapeHTML(exc.ageLimit)}</span>` : ''}
                                </div>
                                <h3 class="font-heading font-black text-xl text-white leading-snug group-hover:text-amber-400 transition-colors">
                                    <button type="button" data-open-detail="${exc.id}" class="text-left focus:outline-none focus-visible:underline">
                                        ${escapeHTML(exc.name)}
                                    </button>
                                </h3>
                                <p class="text-stone-300 text-sm leading-relaxed mt-2 line-clamp-2">
                                    ${escapeHTML(exc.subtitle)}
                                </p>
                            </div>

                            <!-- Desglose rápido 4x4 vs Trekking -->
                            <div class="bg-stone-900/85 border border-stone-800/90 rounded-2xl p-3.5 space-y-2.5">
                                <div class="grid grid-cols-2 gap-2 text-xs">
                                    <div class="flex items-center gap-2 min-w-0">
                                        <span class="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0">
                                            <i class="fa-solid fa-truck-pickup text-[11px]" aria-hidden="true"></i>
                                        </span>
                                        <div class="min-w-0">
                                            <span class="block text-[10px] uppercase font-bold tracking-wider text-amber-400/90">En 4x4</span>
                                            <span class="block text-stone-100 font-bold truncate">${escapeHTML(r.short4x4 || r.time4x4)}</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2 min-w-0">
                                        <span class="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
                                            <i class="fa-solid fa-person-hiking text-[11px]" aria-hidden="true"></i>
                                        </span>
                                        <div class="min-w-0">
                                            <span class="block text-[10px] uppercase font-bold tracking-wider text-emerald-400/90">Trekking</span>
                                            <span class="block text-stone-100 font-bold truncate">${escapeHTML(r.shortTrek || r.timeTrek)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="h-1.5 w-full rounded-full overflow-hidden bg-stone-800 flex" aria-hidden="true">
                                    <div class="bg-amber-500 h-full" style="width: ${r.ratio4x4Pct || 40}%"></div>
                                    <div class="bg-emerald-500 h-full" style="width: ${r.ratioTrekPct || 60}%"></div>
                                </div>
                            </div>

                            <!-- Inclusiones destacadas -->
                            <ul class="space-y-1.5">
                                ${exc.includes
                                    .slice(0, 3)
                                    .map(
                                        (inc) => `
                                    <li class="flex items-start gap-2 text-xs text-stone-300">
                                        <i class="fa-solid fa-check text-emerald-400 mt-0.5 shrink-0" aria-hidden="true"></i>
                                        <span>${escapeHTML(inc)}</span>
                                    </li>
                                `
                                    )
                                    .join('')}
                            </ul>
                        </div>

                        <!-- Precio y CTAs -->
                        <div class="pt-4 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div>
                                <span class="text-[11px] uppercase tracking-wider text-stone-400 block">Tarifa por adulto</span>
                                <div class="text-2xl sm:text-3xl font-heading font-black text-amber-400 leading-tight">
                                    ${formatARS(exc.priceAdult)} <span class="text-xs font-bold text-stone-400">ARS</span>
                                </div>
                                <span class="text-[11px] text-stone-400 block mt-0.5">Menores (hasta 11): ${formatARS(exc.priceChild)}</span>
                            </div>

                            <div class="flex items-center gap-2 w-full sm:w-auto">
                                <button type="button"
                                    data-open-detail="${exc.id}"
                                    class="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap">
                                    <i class="fa-solid fa-map-location-dot text-amber-400" aria-hidden="true"></i>
                                    <span>Detalle / GPS</span>
                                </button>
                                <button type="button"
                                    data-open-booking="${exc.id}"
                                    class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-heading font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap">
                                    <i class="fa-solid fa-calendar-check" aria-hidden="true"></i>
                                    <span>Reservar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        })
        .join('');

    grid.querySelectorAll('[data-open-detail]').forEach((el) => {
        el.addEventListener('click', () => {
            callbacks.onOpenDetail(Number(el.getAttribute('data-open-detail')));
        });
    });

    grid.querySelectorAll('[data-open-booking]').forEach((el) => {
        el.addEventListener('click', () => {
            callbacks.onOpenBooking(Number(el.getAttribute('data-open-booking')));
        });
    });
}
