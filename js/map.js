/**
 * SlitherScope - Interactive Leaflet Map & Live iNaturalist Integration
 * Connects the map view directly to the iNaturalist API for real-time species counts & sightings.
 */

// Venomous snake check (Viperidae: 30667, Elapidae: 30403)
export function isVenomousTaxon(taxon) {
  if (!taxon) return false;
  const ancestors = taxon.ancestor_ids || [];
  if (ancestors.includes(30667) || ancestors.includes(30403) || taxon.id === 30667 || taxon.id === 30403) {
    return true;
  }
  const name = (taxon.name || "").toLowerCase();
  const common = (taxon.preferred_common_name || "").toLowerCase();
  return (
    common.includes("rattlesnake") ||
    common.includes("copperhead") ||
    common.includes("cottonmouth") ||
    common.includes("coral snake") ||
    common.includes("viper") ||
    name.includes("crotalus") ||
    name.includes("agkistrodon") ||
    name.includes("micrurus") ||
    name.includes("sistrurus")
  );
}

const SEGMENT_COLORS = [
  '#006a3b', // Primary forest green
  '#027cb0', // Ocean blue
  '#ffab69', // Warm orange
  '#7ed99e', // Mint green
  '#8e4e14', // Earthy brown (caution)
  '#00628c', // Deep teal
  '#6f7a70'  // Slate grey
];

export class SnakeMapController {
  constructor() {
    this.currentLat = 37.424;
    this.currentLng = -122.068;
    this.currentRadiusMiles = 5;
    this.currentPlaceName = "Local Survey Area";
    this.map = null;
    this.radiusCircle = null;
    this.centerMarker = null;
    this.edgeHandle = null;
    this.observationMarkersLayer = null;
    this.currentSpeciesData = [];
    this.activeFilter = 'all';
    this.fetchDebounceTimer = null;
  }

  init() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    if (typeof L === 'undefined') {
      setTimeout(() => this.init(), 100);
      return;
    }

    if (this.map) return; // Already initialized

    this.map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([this.currentLat, this.currentLng], this.getZoomForRadius(this.currentRadiusMiles));

    // CartoDB Voyager tiles (clean, soft colors matching M3 theme)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(this.map);

    this.observationMarkersLayer = L.layerGroup().addTo(this.map);
    this.bindRadiusControls();
    this.updateRadiusUI();
    this.updateMapGeometry();

    // Tap map to survey area
    this.map.on('click', (e) => {
      this.currentLat = e.latlng.lat;
      this.currentLng = e.latlng.lng;
      this.currentPlaceName = `Area (${this.currentLat.toFixed(3)}, ${this.currentLng.toFixed(3)})`;

      this.updateRadiusUI();
      this.updateMapGeometry();
      this.fetchCensusData();
    });

    this.fetchCensusData();
    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 300);
  }

  bindRadiusControls() {
    const overlay = document.getElementById('map-radius-control');
    if (overlay && typeof L !== 'undefined') {
      L.DomEvent.disableClickPropagation(overlay);
      L.DomEvent.disableScrollPropagation(overlay);
    }

    const shrinkBtn = document.getElementById('radius-shrink-btn');
    if (shrinkBtn) {
      shrinkBtn.onclick = (e) => {
        e.stopPropagation();
        this.shrinkRadius();
      };
    }

    const expandBtn = document.getElementById('radius-expand-btn');
    if (expandBtn) {
      expandBtn.onclick = (e) => {
        e.stopPropagation();
        this.expandRadius();
      };
    }

    const slider = document.getElementById('radius-slider');
    if (slider) {
      slider.oninput = (e) => {
        e.stopPropagation();
        const miles = Number(e.target.value);
        this.setRadius(miles, true);
      };
    }
  }

  formatRadius(miles) {
    if (miles < 1) {
      return `${miles.toFixed(miles < 0.2 ? 2 : 1).replace(/\.?0+$/, '')} mi`;
    }
    if (miles % 1 === 0) {
      return `${Math.round(miles)} mi`;
    }
    return `${miles.toFixed(1)} mi`;
  }

  updateRadiusUI() {
    const display = document.getElementById('radius-display');
    if (display) {
      display.textContent = this.formatRadius(this.currentRadiusMiles);
    }
    const slider = document.getElementById('radius-slider');
    if (slider && Math.abs(Number(slider.value) - this.currentRadiusMiles) > 0.05) {
      slider.value = this.currentRadiusMiles;
    }
    const areaLabel = document.getElementById('census-area-label');
    if (areaLabel) {
      areaLabel.textContent = `${this.currentPlaceName} • ${this.formatRadius(this.currentRadiusMiles)} Radius`;
    }
  }

  updateMapGeometry() {
    if (!this.map) return;
    const radiusMeters = this.currentRadiusMiles * 1609.34;

    if (this.radiusCircle) {
      this.radiusCircle.setLatLng([this.currentLat, this.currentLng]);
      this.radiusCircle.setRadius(radiusMeters);
    } else {
      this.radiusCircle = L.circle([this.currentLat, this.currentLng], {
        radius: radiusMeters,
        color: '#006a3b',
        weight: 2,
        fillColor: '#268451',
        fillOpacity: 0.12,
        dashArray: '4, 6'
      }).addTo(this.map);
    }

    if (this.centerMarker) {
      this.centerMarker.setLatLng([this.currentLat, this.currentLng]);
    } else {
      const centerIcon = L.divIcon({
        className: 'custom-center-marker',
        html: `<div style="background:#006a3b; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; box-shadow:0 3px 8px rgba(0,0,0,0.3); border:2px solid #fff;">🔍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      this.centerMarker = L.marker([this.currentLat, this.currentLng], { icon: centerIcon }).addTo(this.map);
    }

    // Edge resize handle allowing direct dragging on the circle border
    const lngOffset = radiusMeters / (111320 * Math.cos(this.currentLat * (Math.PI / 180)));
    const edgeLatLng = [this.currentLat, this.currentLng + lngOffset];

    if (this.edgeHandle) {
      this.edgeHandle.setLatLng(edgeLatLng);
    } else {
      const handleIcon = L.divIcon({
        className: 'custom-radius-handle',
        html: `<div title="Drag circle edge to expand or shrink search radius" style="background:#ffffff; color:#006a3b; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold; box-shadow:0 2px 6px rgba(0,0,0,0.35); border:2px solid #006a3b; cursor:ew-resize; user-select:none;">↔</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      this.edgeHandle = L.marker(edgeLatLng, {
        icon: handleIcon,
        draggable: true,
        zIndexOffset: 1000
      }).addTo(this.map);

      this.edgeHandle.on('drag', (e) => {
        const center = L.latLng(this.currentLat, this.currentLng);
        const distMeters = center.distanceTo(e.latlng);
        const rawMiles = distMeters / 1609.34;
        let miles;
        if (rawMiles < 1) {
          miles = Math.max(0.1, Math.round(rawMiles * 10) / 10);
        } else if (rawMiles < 10) {
          miles = Math.round(rawMiles * 10) / 10;
        } else {
          miles = Math.min(50, Math.round(rawMiles));
        }
        this.currentRadiusMiles = miles;
        if (this.radiusCircle) {
          this.radiusCircle.setRadius(miles * 1609.34);
        }
        this.updateRadiusUI();
      });

      this.edgeHandle.on('dragend', () => {
        this.setRadius(this.currentRadiusMiles, true);
      });
    }

    this.map.setView([this.currentLat, this.currentLng], this.getZoomForRadius(this.currentRadiusMiles));
  }

  getZoomForRadius(miles) {
    if (miles <= 0.15) return 17;
    if (miles <= 0.35) return 16;
    if (miles <= 0.75) return 15;
    if (miles <= 1.5) return 14;
    if (miles <= 3.5) return 13;
    if (miles <= 7) return 12;
    if (miles <= 14) return 11;
    if (miles <= 28) return 10;
    return 9;
  }

  setRadius(miles, triggerFetch = true) {
    const clamped = Math.max(0.1, Math.min(50, Math.round(miles * 10) / 10));
    this.currentRadiusMiles = clamped;
    this.updateRadiusUI();
    this.updateMapGeometry();

    if (triggerFetch) {
      if (this.fetchDebounceTimer) {
        clearTimeout(this.fetchDebounceTimer);
      }
      this.fetchDebounceTimer = setTimeout(() => {
        this.fetchCensusData();
      }, 400);
    }
  }

  expandRadius() {
    let next;
    if (this.currentRadiusMiles < 0.5) {
      next = this.currentRadiusMiles + 0.1;
    } else if (this.currentRadiusMiles < 1) {
      next = this.currentRadiusMiles + 0.25;
    } else if (this.currentRadiusMiles < 2) {
      next = this.currentRadiusMiles + 0.5;
    } else if (this.currentRadiusMiles < 10) {
      next = this.currentRadiusMiles + 1;
    } else if (this.currentRadiusMiles < 20) {
      next = this.currentRadiusMiles + 2;
    } else {
      next = this.currentRadiusMiles + 5;
    }
    const clamped = Math.min(50, Math.round(next * 100) / 100);
    this.setRadius(clamped, true);
  }

  shrinkRadius() {
    let next;
    if (this.currentRadiusMiles > 10) {
      next = this.currentRadiusMiles - 5;
    } else if (this.currentRadiusMiles > 2) {
      next = this.currentRadiusMiles - 1;
    } else if (this.currentRadiusMiles > 1) {
      next = this.currentRadiusMiles - 0.5;
    } else if (this.currentRadiusMiles > 0.5) {
      next = this.currentRadiusMiles - 0.25;
    } else {
      next = this.currentRadiusMiles - 0.1;
    }
    const clamped = Math.max(0.1, Math.round(next * 100) / 100);
    this.setRadius(clamped, true);
  }

  jumpToPreset(lat, lng, name, radiusMiles) {
    this.currentLat = lat;
    this.currentLng = lng;
    this.currentPlaceName = name;
    this.currentRadiusMiles = radiusMiles || 5;
    this.updateRadiusUI();
    this.updateMapGeometry();
    this.fetchCensusData();
  }

  useCurrentLocation() {
    if (navigator.geolocation) {
      const pill = document.getElementById('map-status-pill');
      if (pill) pill.innerText = "Locating you...";
      navigator.geolocation.getCurrentPosition(
        pos => {
          this.currentLat = pos.coords.latitude;
          this.currentLng = pos.coords.longitude;
          this.currentPlaceName = "Current Location";
          this.updateRadiusUI();
          this.updateMapGeometry();
          this.fetchCensusData();
          if (pill) pill.innerText = "Tap map to survey";
        },
        err => {
          alert("Could not access location. Please tap a location on the map.");
          if (pill) pill.innerText = "Tap map to survey";
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }

  async fetchCensusData() {
    const radiusKm = Math.max(0.1, Math.round(this.currentRadiusMiles * 1.60934 * 100) / 100);

    const liveText = document.getElementById('census-live-text');
    const liveDot = document.getElementById('census-live-dot');
    if (liveText) liveText.innerText = "Searching iNaturalist...";
    if (liveDot) liveDot.className = "w-2 h-2 rounded-full bg-secondary animate-ping";

    const container = document.getElementById('census-species-list');
    if (container) {
      container.innerHTML = `
        <div class="w-full bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex items-center justify-center gap-2 py-10 text-on-surface-variant">
          <span class="material-symbols-outlined text-primary text-2xl animate-spin">sync</span>
          <span class="font-label-md text-label-md">Surveying local snakes in radius...</span>
        </div>
      `;
    }

    try {
      const countsUrl = `https://api.inaturalist.org/v1/observations/species_counts?taxon_id=85553&lat=${this.currentLat}&lng=${this.currentLng}&radius=${radiusKm}&quality_grade=research`;
      const countsRes = await fetch(countsUrl);
      const countsData = await countsRes.json();

      const obsUrl = `https://api.inaturalist.org/v1/observations?taxon_id=85553&lat=${this.currentLat}&lng=${this.currentLng}&radius=${radiusKm}&photos=true&per_page=30&order_by=observed_on&order=desc`;
      const obsRes = await fetch(obsUrl);
      const obsData = await obsRes.json();

      this.renderCensus(countsData, obsData);
    } catch (err) {
      console.error("Error fetching iNaturalist data:", err);
      if (liveText) liveText.innerText = "Offline / Using Mock";
      if (container) {
        container.innerHTML = `
          <div class="w-full bg-error-container text-on-error-container rounded-lg p-space-md">
            Failed to connect to iNaturalist API. Showing cached local dataset.
          </div>
        `;
      }
    }
  }

  renderCensus(countsData, obsData) {
    const liveText = document.getElementById('census-live-text');
    const liveDot = document.getElementById('census-live-dot');
    if (liveText) liveText.innerText = "Live iNaturalist Data";
    if (liveDot) liveDot.className = "w-2 h-2 rounded-full bg-primary-container animate-ping";

    const totalSpecies = countsData.total_results || 0;
    const speciesList = countsData.results || [];
    this.currentSpeciesData = speciesList;

    if (obsData.results && obsData.results.length > 0) {
      const firstGuess = obsData.results[0].place_guess;
      if (firstGuess) {
        this.currentPlaceName = firstGuess.split(',')[0].trim();
      }
    }

    // Update Header labels
    const areaLabel = document.getElementById('census-area-label');
    const titleLabel = document.getElementById('census-title');
    const speciesCountLabel = document.getElementById('census-species-count');
    const speciesTypesCount = document.getElementById('census-species-types-count');
    const neighborsCountLabel = document.getElementById('census-neighbors-count');

    if (areaLabel) areaLabel.textContent = `${this.currentPlaceName} • ${this.formatRadius(this.currentRadiusMiles)} Radius`;
    if (titleLabel) titleLabel.textContent = `${this.currentPlaceName} Census`;
    if (speciesCountLabel) speciesCountLabel.textContent = totalSpecies;
    if (speciesTypesCount) speciesTypesCount.textContent = `${totalSpecies} Types`;

    let totalObservations = 0;
    let harmlessObs = 0;
    let cautionObs = 0;

    speciesList.forEach(item => {
      const count = item.count || 0;
      totalObservations += count;
      if (isVenomousTaxon(item.taxon)) {
        cautionObs += count;
      } else {
        harmlessObs += count;
      }
    });

    if (neighborsCountLabel) neighborsCountLabel.textContent = `~${totalObservations}`;

    const harmlessPct = totalObservations > 0 ? Math.round((harmlessObs / totalObservations) * 100) : 100;
    const cautionPct = totalObservations > 0 ? Math.round((cautionObs / totalObservations) * 100) : 0;

    const harmlessLabel = document.getElementById('caterpillar-harmless-label');
    const cautionLabel = document.getElementById('caterpillar-caution-label');
    if (harmlessLabel) harmlessLabel.textContent = `🌿 ${harmlessPct}% Harmless Helpers`;
    if (cautionLabel) cautionLabel.textContent = `⚠️ ${cautionPct}% Watch From Afar`;

    this.renderCaterpillar(speciesList, totalObservations);
    this.renderSpeciesCards(speciesList, totalObservations);
    this.renderMapPins(obsData.results || []);
  }

  renderCaterpillar(speciesList, totalObservations) {
    const bar = document.getElementById('census-caterpillar-bar');
    if (!bar) return;
    if (!speciesList || speciesList.length === 0 || totalObservations === 0) {
      bar.innerHTML = `<div class="h-full bg-surface-container-high rounded-full w-full flex items-center justify-center text-xs text-on-surface-variant">No sightings recorded in this radius</div>`;
      return;
    }

    let html = '';
    const topFive = speciesList.slice(0, 5);
    let accountedPct = 0;

    topFive.forEach((item, idx) => {
      const pct = Math.max(1, Math.round((item.count / totalObservations) * 100));
      accountedPct += pct;
      const color = isVenomousTaxon(item.taxon) ? '#8e4e14' : SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
      const name = item.taxon.preferred_common_name || item.taxon.name;
      html += `
        <div class="h-full transition-all duration-300 relative group cursor-pointer" 
             style="width: ${pct}%; background-color: ${color};" 
             title="${name} (${pct}%)">
        </div>
      `;
    });

    const remainderPct = 100 - accountedPct;
    if (remainderPct > 2) {
      html += `
        <div class="h-full transition-all duration-300 relative group" 
             style="width: ${remainderPct}%; background-color: #becabe;" 
             title="Other Species (${remainderPct}%)">
        </div>
      `;
    }

    bar.innerHTML = html;
  }

  renderSpeciesCards(speciesList, totalObservations) {
    const container = document.getElementById('census-species-list');
    if (!container) return;

    if (!speciesList || speciesList.length === 0) {
      container.innerHTML = `
        <div class="w-full bg-surface-container-lowest rounded-lg p-space-md shadow-sm text-center text-on-surface-variant">
          <span class="text-3xl block mb-2">🔍</span>
          <p class="font-headline-sm text-headline-sm text-on-surface">No snake records found in this radius</p>
          <p class="font-body-sm text-body-sm mt-1">Try expanding the search radius with the [+] button or slider, or selecting a nearby park or canyon!</p>
        </div>
      `;
      return;
    }

    let html = '';
    speciesList.forEach(item => {
      const t = item.taxon || {};
      const count = item.count || 0;
      const pct = totalObservations > 0 ? Math.round((count / totalObservations) * 100) : 0;
      const commonName = t.preferred_common_name || t.name;
      const sciName = t.name;
      const venomous = isVenomousTaxon(t);
      const photoUrl = t.default_photo ? t.default_photo.medium_url : 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=400&auto=format&fit=crop&q=80';

      const categoryClass = venomous ? 'caution' : 'harmless';
      const badgeHtml = venomous
        ? `<span class="bg-secondary text-on-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full flex items-center gap-1 font-bold"><span class="material-symbols-outlined text-[14px]">warning</span> Caution: Venomous</span>`
        : `<span class="bg-surface-container text-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full flex items-center gap-1 font-bold"><span class="material-symbols-outlined text-[14px]">eco</span> 100% Harmless</span>`;

      const behaviorNote = venomous
        ? `Observe from at least 6 feet away • Keep pets on leash`
        : `Beneficial rodent and pest eater • Safe neighbor`;

      html += `
        <div class="species-card ${categoryClass} w-full bg-surface-container-lowest rounded-lg p-space-sm shadow-sm flex flex-col gap-space-xs transition-all hover:shadow-md border border-transparent hover:border-surface-container cursor-pointer" 
             data-type="${categoryClass}"
             onclick="window.slitherApp && window.slitherApp.openSpeciesDetail ? window.slitherApp.openSpeciesDetail('${t.id}') : null">
          <div class="flex items-center gap-space-sm">
            <img class="w-20 h-20 rounded-DEFAULT object-cover shrink-0 bg-surface-container" 
                 src="${photoUrl}" 
                 alt="${commonName}" 
                 loading="lazy"
                 onerror="this.src='https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=400&auto=format&fit=crop&q=80'"/>
            <div class="flex flex-col flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <span class="font-headline-sm text-headline-sm text-on-surface truncate">${commonName}</span>
                <span class="font-headline-sm text-headline-sm ${venomous ? 'text-secondary' : 'text-primary'} font-bold shrink-0">${pct > 0 ? pct + '%' : '<1%'}</span>
              </div>
              <span class="font-body-sm text-body-sm text-on-surface-variant italic truncate">${sciName}</span>
              <div class="flex flex-wrap items-center gap-1 mt-1">
                ${badgeHtml}
                <span class="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">
                  ${count} ${count === 1 ? 'sighting' : 'sightings'}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between bg-surface-container-low rounded-DEFAULT px-space-sm py-1 text-on-surface-variant">
            <span class="font-body-sm text-body-sm flex items-center gap-1 text-[13px]">
              <span class="material-symbols-outlined text-[16px] ${venomous ? 'text-secondary' : 'text-primary'}">${venomous ? 'visibility' : 'check_circle'}</span>
              ${behaviorNote}
            </span>
            <a href="https://www.inaturalist.org/taxa/${t.id}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="font-label-sm text-label-sm font-bold text-tertiary hover:underline flex items-center gap-0.5 shrink-0">
              iNat <span class="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  renderMapPins(observations) {
    if (!this.observationMarkersLayer) return;
    this.observationMarkersLayer.clearLayers();

    observations.forEach(obs => {
      const coords = obs.geojson ? obs.geojson.coordinates : null;
      if (!coords || coords.length < 2) return;
      const [lng, lat] = coords;

      const t = obs.taxon || {};
      const commonName = t.preferred_common_name || t.name || 'Snake';
      const venomous = isVenomousTaxon(t);
      const photo = (obs.photos && obs.photos.length > 0)
        ? obs.photos[0].url.replace('square', 'medium')
        : (t.default_photo ? t.default_photo.medium_url : null);

      const markerColor = venomous ? '#8e4e14' : '#006a3b';
      const markerEmoji = venomous ? '⚠️' : '🐍';

      const customIcon = L.divIcon({
        className: 'custom-snake-marker',
        html: `<div style="background:${markerColor}; color:#fff; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; border:2px solid #fff; box-shadow:0 2px 5px rgba(0,0,0,0.25);">${markerEmoji}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const photoTag = photo
        ? `<img src="${photo}" class="w-full h-28 object-cover rounded-DEFAULT mb-2" alt="${commonName}"/>`
        : '';

      marker.bindPopup(`
        <div class="flex flex-col text-on-surface" style="width: 180px;">
          ${photoTag}
          <span class="font-bold text-sm text-on-surface leading-tight">${commonName}</span>
          <span class="text-xs text-on-surface-variant italic mb-1">${t.name || ''}</span>
          <div class="flex items-center gap-1 text-[11px] text-on-surface-variant">
            <span>📅 ${obs.observed_on || 'Observed'}</span>
          </div>
          <a href="https://www.inaturalist.org/observations/${obs.id}" target="_blank" rel="noopener" class="text-xs text-primary font-bold mt-1.5 inline-block hover:underline">
            View Sighting ↗
          </a>
        </div>
      `);

      this.observationMarkersLayer.addLayer(marker);
    });
  }
}
