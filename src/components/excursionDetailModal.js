/**
 * Modal de detalle de excursión: galería con foto real principal,
 * comparativa visual 4x4 vs Trekking, mapa Leaflet con estado de carga/error,
 * selector Satelital/Calles, pantalla completa y enlace directo al Visor GPS 3D.
 */

import { getExcursionById } from '../data/excursions.js';
import { settingsService } from '../services/settingsService.js';
import { buildWhatsAppUrl, escapeHTML, formatARSFull } from '../utils/formatters.js';

let detailLeafletMap = null;
let detailMapLayerGroup = null;
let detailTileLayers = {};
let activeTileKey = 'satellite';
let currentRouteBounds = null;
let currentExcursion = null;
const ROUTES_CACHE = new Map();

let onReserveCallback = () => {};

export function initExcursionDetailModal({ onReserve }) {
    onReserveCallback = onReserve;

    document.getElementById('detailBackdrop')?.addEventListener('click', closeExcursionDetailModal);
    document.getElementById('detailCloseBtn')?.addEventListener('click', closeExcursionDetailModal);

    document.getElementById('detailLayerSatBtn')?.addEventListener('click', () => setDetailMapLayer('satellite'));
    document.getElementById('detailLayerOsmBtn')?.addEventListener('click', () => setDetailMapLayer('osm'));
    document.getElementById('detailMapFitBtn')?.addEventListener('click', fitDetailBounds);
    document.getElementById('detailMapFullscreenBtn')?.addEventListener('click', toggleMapFullscreen);
    document.getElementById('detailMapRetryBtn')?.addEventListener('click', () => {
        if (currentExcursion) renderExcursionMap(currentExcursion);
    });

    document.addEventListener('fullscreenchange', () => {
        setTimeout(() => {
            if (detailLeafletMap) {
                detailLeafletMap.invalidateSize();
                fitDetailBounds();
            }
        }, 120);
    });
}

export function openExcursionDetailModal(excursionId) {
    const exc = getExcursionById(excursionId);
    if (!exc) return;
    currentExcursion = exc;

    setText('detailModalCategory', exc.categoryLabel);
    setText('detailModalTitle', exc.name);
    setText('detailBadgePrice', formatARSFull(exc.priceAdult));
    setHTML('detailBadgeDuration', `<i class="fa-regular fa-clock text-amber-400 mr-1" aria-hidden="true"></i>${escapeHTML(exc.duration)}`);
    setHTML('detailBadgeDifficulty', `<i class="fa-solid fa-gauge-high mr-1" aria-hidden="true"></i>${escapeHTML(exc.difficulty)}`);

    const ageBadge = document.getElementById('detailBadgeAge');
    if (ageBadge) {
        if (exc.ageLimit) {
            ageBadge.textContent = exc.ageLimit;
            ageBadge.classList.remove('hidden');
        } else {
            ageBadge.classList.add('hidden');
        }
    }

    // Galería: foto real de la excursión primero
    const photos = exc.gallery && exc.gallery.length > 0 ? exc.gallery : [exc.image];
    const mainImg = document.getElementById('detailMainImage');
    if (mainImg) {
        mainImg.src = photos[0];
        mainImg.alt = exc.name;
    }

    const thumbsContainer = document.getElementById('detailThumbnails');
    if (thumbsContainer) {
        thumbsContainer.innerHTML = photos
            .map(
                (photoUrl, idx) => `
                <button type="button"
                    data-thumb-url="${escapeHTML(photoUrl)}"
                    aria-label="Ver foto ${idx + 1} de ${escapeHTML(exc.name)}"
                    class="h-16 sm:h-20 rounded-xl overflow-hidden border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        idx === 0
                            ? 'border-amber-400 opacity-100 shadow-md'
                            : 'border-stone-800 opacity-70 hover:opacity-100'
                    }">
                    <img src="${escapeHTML(photoUrl)}" alt="" loading="lazy" class="w-full h-full object-cover">
                </button>
            `
            )
            .join('');

        thumbsContainer.querySelectorAll('[data-thumb-url]').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (mainImg) mainImg.src = btn.getAttribute('data-thumb-url');
                thumbsContainer.querySelectorAll('[data-thumb-url]').forEach((b) => {
                    b.classList.remove('border-amber-400', 'opacity-100', 'shadow-md');
                    b.classList.add('border-stone-800', 'opacity-70');
                });
                btn.classList.remove('border-stone-800', 'opacity-70');
                btn.classList.add('border-amber-400', 'opacity-100', 'shadow-md');
            });
        });
    }

    // Desglose 4x4 vs Trekking
    const r = exc.routeInfo || {};
    setText('detailRoute4x4Time', r.time4x4 || 'Aproximación 4x4');
    setText('detailRoute4x4Desc', r.desc4x4 || 'Traslado en Nissan Frontier 4x4 hasta el inicio del sendero.');
    setText('detailRouteTrekTime', r.timeTrek || 'Trekking guiado');
    setText('detailRouteTrekDesc', r.descTrek || 'Sendero guiado por las Sierras de los Comechingones.');

    const bar4x4 = document.getElementById('detailRatio4x4');
    const barTrek = document.getElementById('detailRatioTrek');
    if (bar4x4) bar4x4.style.width = `${r.ratio4x4Pct || 40}%`;
    if (barTrek) barTrek.style.width = `${r.ratioTrekPct || 60}%`;

    // Enlaces al Visor GPS 3D (con ?trail= cuando corresponde) y Wikiloc externo
    const visorHref = exc.trailKey
        ? `visor-senderos.html?trail=${encodeURIComponent(exc.trailKey)}`
        : 'visor-senderos.html';

    ['detailVisorLinkTop', 'detailVisorLinkBottom'].forEach((id) => {
        const link = document.getElementById(id);
        if (link) link.href = visorHref;
    });

    const wikilocLink = document.getElementById('detailWikilocExternalLink');
    if (wikilocLink) {
        if (exc.wikilocUrl) {
            wikilocLink.href = exc.wikilocUrl;
            wikilocLink.classList.remove('hidden');
        } else {
            wikilocLink.classList.add('hidden');
        }
    }

    // Descripción, inclusiones, equipo y notas/extras
    setText('detailFullText', exc.fullDescription || exc.subtitle);

    const includesList = document.getElementById('detailIncludesList');
    if (includesList) {
        includesList.innerHTML = (exc.includes || [])
            .map(
                (inc) => `
                <li class="flex items-start gap-2">
                    <i class="fa-solid fa-check text-emerald-400 mt-0.5 shrink-0" aria-hidden="true"></i>
                    <span>${escapeHTML(inc)}</span>
                </li>
            `
            )
            .join('');
    }

    setText(
        'detailEquipmentText',
        exc.equipment || 'Calzado cómodo acordonado, abrigo liviano, agua y protector solar.'
    );

    const extrasBox = document.getElementById('detailExtrasBox');
    const extrasText = document.getElementById('detailExtrasText');
    if (extrasBox && extrasText) {
        const extraLines = [];
        if (exc.extras && exc.extras.length > 0) {
            exc.extras.forEach((ex) => {
                extraLines.push(`• ${ex.name}: ${formatARSFull(ex.price)} (seleccionable al reservar).`);
            });
        }
        if (exc.notes) extraLines.push(exc.notes);

        if (extraLines.length > 0) {
            extrasText.textContent = extraLines.join('\n');
            extrasBox.classList.remove('hidden');
        } else {
            extrasBox.classList.add('hidden');
        }
    }

    // Footer del modal
    setText('detailFooterPrice', formatARSFull(exc.priceAdult));
    setText('detailFooterChildPrice', `Menores (hasta 11): ${formatARSFull(exc.priceChild)}`);

    const settings = settingsService.getSettings();
    const waMsg = `¡Hola Merlo Aventura! Quiero consultar por la excursión "${exc.name}" (${formatARSFull(exc.priceAdult)}).`;
    const waBtn = document.getElementById('detailWhatsappBtn');
    if (waBtn) waBtn.href = buildWhatsAppUrl(settings.whatsappRaw, waMsg);

    const bookBtn = document.getElementById('detailBookBtn');
    if (bookBtn) {
        bookBtn.onclick = () => {
            closeExcursionDetailModal();
            onReserveCallback(exc.id);
        };
    }

    const modal = document.getElementById('excursionDetailModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        modal.querySelector('.overflow-y-auto')?.scrollTo({ top: 0 });
    }

    // Renderizar mapa una vez visible el contenedor
    requestAnimationFrame(() => renderExcursionMap(exc));
}

export function closeExcursionDetailModal() {
    const modal = document.getElementById('excursionDetailModal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
}

export function isExcursionDetailOpen() {
    const modal = document.getElementById('excursionDetailModal');
    return Boolean(modal && !modal.classList.contains('hidden'));
}

function setMapOverlayState(state, message = '') {
    const loadingEl = document.getElementById('detailMapLoading');
    const errorEl = document.getElementById('detailMapError');
    const errorMsgEl = document.getElementById('detailMapErrorMsg');

    if (loadingEl) loadingEl.classList.toggle('hidden', state !== 'loading');
    if (errorEl) errorEl.classList.toggle('hidden', state !== 'error');
    if (errorMsgEl && message) errorMsgEl.textContent = message;
}

function ensureLeafletInitialized() {
    const mapEl = document.getElementById('excursionDetailMap');
    if (!mapEl || typeof window.L === 'undefined') return false;

    if (!detailLeafletMap) {
        detailLeafletMap = window.L.map('excursionDetailMap', {
            zoomControl: true,
            scrollWheelZoom: false,
            attributionControl: true
        });

        detailTileLayers = {
            satellite: window.L.tileLayer(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                { maxZoom: 18, attribution: '&copy; Esri Satelital · Merlo Aventura' }
            ),
            osm: window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '&copy; OpenStreetMap · Merlo Aventura'
            })
        };

        detailTileLayers[activeTileKey].addTo(detailLeafletMap);
        detailMapLayerGroup = window.L.layerGroup().addTo(detailLeafletMap);
        updateLayerToggleUI();
    } else {
        detailMapLayerGroup.clearLayers();
    }
    return true;
}

function setDetailMapLayer(layerKey) {
    if (!detailLeafletMap || !detailTileLayers[layerKey] || layerKey === activeTileKey) return;
    if (detailTileLayers[activeTileKey]) {
        detailLeafletMap.removeLayer(detailTileLayers[activeTileKey]);
    }
    activeTileKey = layerKey;
    detailTileLayers[activeTileKey].addTo(detailLeafletMap);
    updateLayerToggleUI();
}

function updateLayerToggleUI() {
    const satBtn = document.getElementById('detailLayerSatBtn');
    const osmBtn = document.getElementById('detailLayerOsmBtn');
    const activeClasses = ['bg-amber-500', 'text-stone-950', 'font-black'];
    const inactiveClasses = ['text-stone-300', 'hover:text-white', 'font-semibold'];

    if (satBtn && osmBtn) {
        if (activeTileKey === 'satellite') {
            satBtn.classList.add(...activeClasses);
            satBtn.classList.remove(...inactiveClasses);
            osmBtn.classList.remove(...activeClasses);
            osmBtn.classList.add(...inactiveClasses);
        } else {
            osmBtn.classList.add(...activeClasses);
            osmBtn.classList.remove(...inactiveClasses);
            satBtn.classList.remove(...activeClasses);
            satBtn.classList.add(...inactiveClasses);
        }
    }
}

function fitDetailBounds() {
    if (detailLeafletMap && currentRouteBounds) {
        detailLeafletMap.fitBounds(currentRouteBounds, { padding: [32, 32] });
    }
}

function toggleMapFullscreen() {
    const wrapper = document.getElementById('detailMapWrapper');
    if (!wrapper) return;

    if (document.fullscreenElement === wrapper) {
        document.exitFullscreen().catch(() => {});
        return;
    }

    if (wrapper.requestFullscreen) {
        wrapper.requestFullscreen().catch(() => {
            wrapper.classList.toggle('map-fullscreen-fallback');
            setTimeout(() => {
                detailLeafletMap?.invalidateSize();
                fitDetailBounds();
            }, 100);
        });
    } else {
        wrapper.classList.toggle('map-fullscreen-fallback');
        setTimeout(() => {
            detailLeafletMap?.invalidateSize();
            fitDetailBounds();
        }, 100);
    }
}

function renderExcursionMap(exc) {
    if (!ensureLeafletInitialized()) {
        setMapOverlayState('error', 'El motor de mapas no pudo inicializarse. Podés abrir el Visor GPS 3D completo.');
        return;
    }

    const L = window.L;
    const mapEl = document.getElementById('excursionDetailMap');
    const r = exc.routeInfo;
    if (!r) return;

    const makeBadgeIcon = (colorBg, iconClass, label, offset = [0, 0]) => {
        const compact = mapEl.clientWidth < 400;
        return L.divIcon({
            className: 'custom-map-marker',
            html: compact
                ? `<div class="w-7 h-7 rounded-xl ${colorBg} text-stone-950 flex items-center justify-center text-xs border-2 border-stone-950 shadow-xl"><i class="${iconClass}"></i></div>`
                : `<div class="inline-flex items-center gap-1.5 bg-stone-950/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl border border-stone-700 shadow-xl whitespace-nowrap w-max">
                      <span class="w-5 h-5 rounded-lg ${colorBg} text-stone-950 flex items-center justify-center text-[10px] shrink-0"><i class="${iconClass}"></i></span>
                      <span>${escapeHTML(label)}</span>
                   </div>`,
            iconSize: compact ? [28, 28] : null,
            iconAnchor: compact ? [14, 14] : [14 - offset[0], 14 - offset[1]]
        });
    };

    const plotGeoJSON = (route) => {
        detailMapLayerGroup.clearLayers();
        const driveLayer = L.geoJSON(route.drive, {
            style: { color: '#f59e0b', weight: 5, dashArray: '6, 8', opacity: 0.95 }
        })
            .bindPopup(
                `<b>Aproximación 4x4 Nissan Frontier</b><br>Desde Plaza central de Merlo · ${route.drive?.properties?.distanceKm || 21.5} km`
            )
            .addTo(detailMapLayerGroup);

        const trekLayer = L.geoJSON(route.trail, {
            style: { color: '#10b981', weight: 5, opacity: 0.95 }
        })
            .bindPopup(
                `<b>Track GPS Wikiloc Oficial</b><br>${route.source?.distanceKm || 13.7} km · ${(route.source?.trackPoints || 2540).toLocaleString('es-AR')} puntos`
            )
            .addTo(detailMapLayerGroup);

        L.marker([route.plaza[1], route.plaza[0]], {
            icon: makeBadgeIcon('bg-amber-400', 'fa-solid fa-house', 'Merlo (Salida)')
        })
            .bindPopup('<b>Salida:</b> Villa de Merlo (Pick-up en tu alojamiento)')
            .addTo(detailMapLayerGroup);

        L.marker([route.trailhead[1], route.trailhead[0]], {
            icon: makeBadgeIcon('bg-amber-500', 'fa-solid fa-truck-pickup', 'Inicio Senda 4x4', [-125, -18])
        })
            .bindPopup('<b>Fin tramo 4x4 / Inicio Trekking</b>')
            .addTo(detailMapLayerGroup);

        const destCoords = route.destination ? [route.destination[1], route.destination[0]] : [-32.4268, -64.8737];
        L.marker(destCoords, {
            icon: makeBadgeIcon('bg-emerald-400', 'fa-solid fa-flag-checkered', exc.shortName, [10, 12])
        })
            .bindPopup(`<b>Destino:</b> ${escapeHTML(exc.name)}`)
            .addTo(detailMapLayerGroup);

        currentRouteBounds = L.featureGroup([driveLayer, trekLayer]).getBounds();
        setMapOverlayState('ready');

        setTimeout(() => {
            detailLeafletMap.invalidateSize();
            fitDetailBounds();
        }, 160);
    };

    if (r.routeData) {
        if (ROUTES_CACHE.has(r.routeData)) {
            plotGeoJSON(ROUTES_CACHE.get(r.routeData));
            return;
        }
        setMapOverlayState('loading');
        fetch(r.routeData)
            .then((res) => {
                if (!res.ok) throw new Error('Error HTTP');
                return res.json();
            })
            .then((route) => {
                ROUTES_CACHE.set(r.routeData, route);
                if (currentExcursion && currentExcursion.id === exc.id) {
                    plotGeoJSON(route);
                }
            })
            .catch(() => {
                setMapOverlayState(
                    'error',
                    'No se pudo cargar el track GPS en este momento. Podés reintentar o abrir el Visor GPS 3D completo.'
                );
            });
    } else if (r.start && r.trailhead && r.destination) {
        setMapOverlayState('ready');
        detailMapLayerGroup.clearLayers();

        L.polyline([r.start, r.trailhead], {
            color: '#f59e0b',
            weight: 4,
            dashArray: '6, 8',
            opacity: 0.95
        })
            .bindPopup(`<b>Tramo 4x4:</b> ${escapeHTML(r.desc4x4)}`)
            .addTo(detailMapLayerGroup);

        L.polyline([r.trailhead, r.destination], {
            color: '#10b981',
            weight: 5,
            opacity: 0.95
        })
            .bindPopup(`<b>Trekking a pie:</b> ${escapeHTML(r.descTrek)}`)
            .addTo(detailMapLayerGroup);

        L.marker(r.start, {
            icon: makeBadgeIcon('bg-amber-400', 'fa-solid fa-house', 'Villa de Merlo')
        })
            .bindPopup('<b>Salida:</b> Villa de Merlo')
            .addTo(detailMapLayerGroup);

        L.marker(r.trailhead, {
            icon: makeBadgeIcon('bg-amber-500', 'fa-solid fa-truck-pickup', 'Inicio Senda')
        })
            .bindPopup(`<b>Inicio Trekking:</b> ${escapeHTML(r.desc4x4)}`)
            .addTo(detailMapLayerGroup);

        L.marker(r.destination, {
            icon: makeBadgeIcon('bg-emerald-400', 'fa-solid fa-flag-checkered', exc.shortName)
        })
            .bindPopup(`<b>Destino:</b> ${escapeHTML(exc.name)}`)
            .addTo(detailMapLayerGroup);

        currentRouteBounds = L.latLngBounds([r.start, r.trailhead, r.destination]);
        setTimeout(() => {
            detailLeafletMap.invalidateSize();
            fitDetailBounds();
        }, 160);
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}
