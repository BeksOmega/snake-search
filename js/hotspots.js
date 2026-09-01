/**
 * SlitherScope - Hotspots & Quadrant Analyzer Module
 * Splits a user-selected geographic bounding box into 4 quadrants (NW, NE, SW, SE)
 * and runs parallel iNaturalist species_counts queries to identify normalized
 * hotspots for target snake species.
 */

export const POPULAR_TARGET_SPECIES = [
  { id: 29044, name: "Gopher Snake", scientific: "Pituophis catenifer", icon: "🐍" },
  { id: 48268, name: "Western Rattlesnake", scientific: "Crotalus oreganus", icon: "⚡" },
  { id: 146199, name: "California Kingsnake", scientific: "Lampropeltis californiae", icon: "👑" },
  { id: 28362, name: "Garter Snake", scientific: "Thamnophis", icon: "🌿" },
  { id: 27072, name: "North American Racer", scientific: "Coluber constrictor", icon: "🏎️" },
  { id: 26575, name: "Ring-necked Snake", scientific: "Diadophis punctatus", icon: "💍" },
  { id: 29310, name: "Common Watersnake", scientific: "Nerodia sipedon", icon: "💧" },
  { id: 73887, name: "Western Ratsnake", scientific: "Pantherophis obsoletus", icon: "🪵" },
  { id: 30689, name: "Eastern Copperhead", scientific: "Agkistrodon contortrix", icon: "🍂" },
  { id: 30688, name: "Northern Cottonmouth", scientific: "Agkistrodon piscivorus", icon: "⚠️" },
];

export class HotspotsController {
  constructor() {
    this.centerLat = 37.424;
    this.centerLng = -122.068;
    this.boxSizeMiles = 10;
    this.selectedTaxonId = 29044; // Default: Gopher Snake
    this.selectedSpeciesName = "Gopher Snake";

    this.map = null;
    this.quadrantLayers = {};
    this.labelMarkers = {};
    this.centerMarker = null;
    this.outerBoxLayer = null;

    this.quadrantCache = {
      NW: [],
      NE: [],
      SW: [],
      SE: [],
    };

    this.isLoading = false;
    this.isInitialized = false;
    this.debounceTimer = null;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.bindDOM();
  }

  activate() {
    this.init();
    if (!this.map) {
      // Delay initialization slightly so container is unhidden
      setTimeout(() => {
        this.initMap();
        this.fetchQuadrants();
      }, 100);
    } else {
      setTimeout(() => {
        this.map.invalidateSize();
      }, 150);
    }
  }

  bindDOM() {
    // Quick species chips
    const chipsContainer = document.getElementById("hotspots-quick-chips");
    if (chipsContainer) {
      chipsContainer.innerHTML = POPULAR_TARGET_SPECIES.map((s) => `
        <button type="button" data-taxon-id="${s.id}" data-species-name="${s.name}" class="hotspot-chip px-space-xs py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
          s.id === this.selectedTaxonId
            ? "bg-primary-container text-on-primary shadow-sm ring-1 ring-primary"
            : "bg-surface-container text-on-surface hover:bg-surface-container-high"
        }">
          <span>${s.icon}</span>
          <span>${s.name}</span>
        </button>
      `).join("");

      chipsContainer.querySelectorAll(".hotspot-chip").forEach((btn) => {
        btn.addEventListener("click", () => {
          const taxonId = Number(btn.getAttribute("data-taxon-id"));
          const name = btn.getAttribute("data-species-name");
          this.setTargetSpecies(taxonId, name);
        });
      });
    }

    // Species select dropdown
    const select = document.getElementById("hotspots-species-select");
    if (select) {
      this.populateSpeciesSelect();
      select.addEventListener("change", (e) => {
        const option = e.target.selectedOptions[0];
        if (option) {
          const taxonId = Number(option.value);
          const name = option.getAttribute("data-name") || option.textContent.trim();
          this.setTargetSpecies(taxonId, name);
        }
      });
    }

    // Size preset buttons
    [5, 10, 20, 40].forEach((size) => {
      const btn = document.getElementById(`hotspots-size-${size}`);
      if (btn) {
        btn.addEventListener("click", () => {
          this.setBoxSize(size);
        });
      }
    });

    // My location button
    const locBtn = document.getElementById("hotspots-location-btn");
    if (locBtn) {
      locBtn.addEventListener("click", () => {
        this.useCurrentLocation();
      });
    }
  }

  populateSpeciesSelect() {
    const select = document.getElementById("hotspots-species-select");
    if (!select) return;

    // Collect all unique species across popular list + current cache
    const seen = new Set();
    const options = [];

    POPULAR_TARGET_SPECIES.forEach((s) => {
      seen.add(s.id);
      options.push({ id: s.id, name: s.name, icon: s.icon });
    });

    Object.values(this.quadrantCache).forEach((list) => {
      (list || []).forEach((item) => {
        if (item.taxon && !seen.has(item.taxon.id)) {
          seen.add(item.taxon.id);
          const common = item.taxon.preferred_common_name || item.taxon.name;
          options.push({ id: item.taxon.id, name: common, icon: "🐍" });
        }
      });
    });

    select.innerHTML = options.map((opt) => `
      <option value="${opt.id}" data-name="${opt.name}" ${opt.id === this.selectedTaxonId ? "selected" : ""}>
        ${opt.icon} ${opt.name}
      </option>
    `).join("");
  }

  initMap() {
    const container = document.getElementById("hotspot-map");
    if (!container || this.map) return;

    if (typeof L === "undefined") {
      setTimeout(() => this.initMap(), 150);
      return;
    }

    this.map = L.map("hotspot-map", {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([this.centerLat, this.centerLng], 12);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap & CartoDB",
      maxZoom: 19,
    }).addTo(this.map);

    // Draggable center anchor pin
    const centerPinIcon = L.divIcon({
      className: "hotspot-center-pin",
      html: `
        <div class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg ring-4 ring-white border-2 border-primary-container cursor-move animate-bounce-short">
          <span class="material-symbols-outlined text-sm">filter_center_focus</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    this.centerMarker = L.marker([this.centerLat, this.centerLng], {
      draggable: true,
      icon: centerPinIcon,
      title: "Drag to reposition quadrant scan area",
    }).addTo(this.map);

    this.centerMarker.on("drag", (e) => {
      const pos = e.target.getLatLng();
      this.centerLat = pos.lat;
      this.centerLng = pos.lng;
      this.renderMapGeometry(false);
    });

    this.centerMarker.on("dragend", () => {
      this.debouncedFetch();
    });

    // Map click to reposition
    this.map.on("click", (e) => {
      this.setCenter(e.latlng.lat, e.latlng.lng, true);
    });

    this.renderMapGeometry(true);
  }

  setCenter(lat, lng, triggerFetch = true) {
    this.centerLat = lat;
    this.centerLng = lng;
    if (this.centerMarker) {
      this.centerMarker.setLatLng([lat, lng]);
    }
    if (this.map) {
      this.map.panTo([lat, lng]);
    }
    this.renderMapGeometry(false);
    if (triggerFetch) {
      this.debouncedFetch();
    }
  }

  setBoxSize(miles) {
    this.boxSizeMiles = miles;
    [5, 10, 20, 40].forEach((s) => {
      const btn = document.getElementById(`hotspots-size-${s}`);
      if (btn) {
        if (s === miles) {
          btn.className = "hotspot-size-btn px-space-xs py-1 rounded-full text-xs font-bold bg-primary text-on-primary shadow-sm cursor-pointer";
        } else {
          btn.className = "hotspot-size-btn px-space-xs py-1 rounded-full text-xs font-bold bg-surface-container text-on-surface hover:bg-surface-container-high cursor-pointer";
        }
      }
    });

    if (this.map) {
      const zoom = miles <= 5 ? 13 : miles <= 10 ? 12 : miles <= 20 ? 11 : 10;
      this.map.setZoom(zoom);
    }

    this.renderMapGeometry(true);
    this.debouncedFetch();
  }

  setTargetSpecies(taxonId, speciesName) {
    this.selectedTaxonId = taxonId;
    this.selectedSpeciesName = speciesName;

    // Update chips styling
    const chipsContainer = document.getElementById("hotspots-quick-chips");
    if (chipsContainer) {
      chipsContainer.querySelectorAll(".hotspot-chip").forEach((btn) => {
        const id = Number(btn.getAttribute("data-taxon-id"));
        if (id === taxonId) {
          btn.className = "hotspot-chip px-space-xs py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap bg-primary-container text-on-primary shadow-sm ring-1 ring-primary";
        } else {
          btn.className = "hotspot-chip px-space-xs py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap bg-surface-container text-on-surface hover:bg-surface-container-high";
        }
      });
    }

    // Update dropdown
    const select = document.getElementById("hotspots-species-select");
    if (select && Number(select.value) !== taxonId) {
      select.value = taxonId;
    }

    // Instant client-side recalculation from cached results (0 network latency!)
    this.renderAnalysis();
  }

  getQuadrantCoordinates() {
    const halfH = (this.boxSizeMiles / 2) / 69.0;
    const halfW = (this.boxSizeMiles / 2) / (69.0 * Math.cos(this.centerLat * Math.PI / 180));

    const swlat = this.centerLat - halfH;
    const nelat = this.centerLat + halfH;
    const swlng = this.centerLng - halfW;
    const nelng = this.centerLng + halfW;
    const midLat = this.centerLat;
    const midLng = this.centerLng;

    return {
      outer: { swlat, swlng, nelat, nelng },
      NW: { swlat: midLat, swlng: swlng, nelat: nelat, nelng: midLng, name: "Northwest", code: "NW" },
      NE: { swlat: midLat, swlng: midLng, nelat: nelat, nelng: nelng, name: "Northeast", code: "NE" },
      SW: { swlat: swlat, swlng: swlng, nelat: midLat, nelng: midLng, name: "Southwest", code: "SW" },
      SE: { swlat: swlat, swlng: midLng, nelat: midLat, nelng: nelng, name: "Southeast", code: "SE" },
    };
  }

  renderMapGeometry(updateColors = true) {
    if (!this.map) return;
    const coords = this.getQuadrantCoordinates();

    // Outer boundary box
    const outerBounds = [[coords.outer.swlat, coords.outer.swlng], [coords.outer.nelat, coords.outer.nelng]];
    if (!this.outerBoxLayer) {
      this.outerBoxLayer = L.rectangle(outerBounds, {
        color: "#1b4d3e",
        weight: 1.5,
        dashArray: "6, 6",
        fill: false,
      }).addTo(this.map);
    } else {
      this.outerBoxLayer.setBounds(outerBounds);
    }

    // 4 Quadrants
    const keys = ["NW", "NE", "SW", "SE"];
    keys.forEach((key) => {
      const q = coords[key];
      const bounds = [[q.swlat, q.swlng], [q.nelat, q.nelng]];
      const center = [(q.swlat + q.nelat) / 2, (q.swlng + q.nelng) / 2];

      if (!this.quadrantLayers[key]) {
        this.quadrantLayers[key] = L.rectangle(bounds, {
          color: "#00522d",
          weight: 1.5,
          fillColor: "#059669",
          fillOpacity: 0.25,
        }).addTo(this.map);

        this.quadrantLayers[key].on("click", () => {
          this.highlightQuadrantCard(key);
        });
      } else {
        this.quadrantLayers[key].setBounds(bounds);
      }

      // Center label marker
      if (!this.labelMarkers[key]) {
        const icon = L.divIcon({
          className: "quadrant-label-marker",
          html: `<div id="quad-badge-${key}" class="bg-surface/90 backdrop-blur-sm px-2 py-1 rounded shadow-md text-xs font-bold text-center border border-surface-container min-w-[50px]">
            <span class="block text-[10px] text-on-surface-variant font-bold">${key}</span>
            <span class="block text-primary text-xs font-extrabold" id="quad-pct-${key}">--</span>
          </div>`,
          iconSize: [60, 36],
          iconAnchor: [30, 18],
        });
        this.labelMarkers[key] = L.marker(center, { icon, interactive: false }).addTo(this.map);
      } else {
        this.labelMarkers[key].setLatLng(center);
      }
    });

    if (updateColors) {
      this.renderAnalysis();
    }
  }

  debouncedFetch() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.fetchQuadrants();
    }, 350);
  }

  async fetchQuadrants() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.updateStatusUI("Querying 4 quadrants via iNaturalist...", true);

    const coords = this.getQuadrantCoordinates();
    const fetchSingle = async (key, q) => {
      const url = `https://api.inaturalist.org/v1/observations/species_counts?taxon_id=85553&swlat=${q.swlat.toFixed(5)}&swlng=${q.swlng.toFixed(5)}&nelat=${q.nelat.toFixed(5)}&nelng=${q.nelng.toFixed(5)}`;
      try {
        const resp = await fetch(url, { headers: { Accept: "application/json" } });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        return { key, success: true, results: data.results || [] };
      } catch (err) {
        console.warn(`Quadrant ${key} fetch failed:`, err);
        return { key, success: false, results: [] };
      }
    };

    try {
      const results = await Promise.all([
        fetchSingle("NW", coords.NW),
        fetchSingle("NE", coords.NE),
        fetchSingle("SW", coords.SW),
        fetchSingle("SE", coords.SE),
      ]);

      results.forEach((r) => {
        this.quadrantCache[r.key] = r.results;
      });

      this.populateSpeciesSelect();
      this.renderAnalysis();
      this.updateStatusUI("Scan complete", false);
    } catch (err) {
      console.error("Hotspots fetch error:", err);
      this.updateStatusUI("Error loading quadrant data", false);
    } finally {
      this.isLoading = false;
    }
  }

  renderAnalysis() {
    const coords = this.getQuadrantCoordinates();
    const keys = ["NW", "NE", "SW", "SE"];
    const analysis = {};
    let maxProportion = -1;
    let bestKey = null;

    keys.forEach((key) => {
      const list = this.quadrantCache[key] || [];
      const totalSnakes = list.reduce((sum, item) => sum + (item.count || 0), 0);

      // Find target species
      const match = list.find((item) => {
        if (!item.taxon) return false;
        if (this.selectedTaxonId && item.taxon.id === this.selectedTaxonId) return true;
        const cName = (item.taxon.preferred_common_name || item.taxon.name || "").toLowerCase();
        const target = (this.selectedSpeciesName || "").toLowerCase();
        return cName.includes(target) || target.includes(cName);
      });

      const targetCount = match ? match.count : 0;
      const proportion = totalSnakes > 0 ? targetCount / totalSnakes : 0;
      const percentage = proportion * 100;

      // Top co-occurring other snakes
      const others = list
        .filter((item) => item.taxon && (!match || item.taxon.id !== match.taxon.id))
        .slice(0, 2)
        .map((item) => ({
          name: item.taxon.preferred_common_name || item.taxon.name,
          count: item.count,
        }));

      analysis[key] = {
        name: coords[key].name,
        code: key,
        totalSnakes,
        targetCount,
        proportion,
        percentage,
        speciesCount: list.length,
        others,
      };

      if (proportion > maxProportion && targetCount > 0) {
        maxProportion = proportion;
        bestKey = key;
      }
    });

    // Color and update Leaflet quadrant overlays
    keys.forEach((key) => {
      const q = analysis[key];
      const isBest = key === bestKey && q.targetCount > 0;
      let fillColor = "#64748b"; // neutral slate
      let fillOpacity = 0.2;
      let ratingLabel = "Cold Spot";
      let ratingBadgeClass = "bg-surface-container text-on-surface-variant";

      if (q.targetCount === 0) {
        fillColor = "#94a3b8";
        fillOpacity = 0.15;
        ratingLabel = "0 Sightings";
        ratingBadgeClass = "bg-surface-container text-on-surface-variant";
      } else if (isBest) {
        fillColor = "#059669"; // Prime emerald
        fillOpacity = 0.60;
        ratingLabel = "🔥 Top Hotspot";
        ratingBadgeClass = "bg-primary-container text-on-primary font-bold";
      } else if (q.percentage >= 20) {
        fillColor = "#10b981";
        fillOpacity = 0.45;
        ratingLabel = "🟢 High Frequency";
        ratingBadgeClass = "bg-secondary-container text-on-secondary-container";
      } else if (q.percentage >= 8) {
        fillColor = "#f59e0b";
        fillOpacity = 0.35;
        ratingLabel = "⚡ Moderate";
        ratingBadgeClass = "bg-amber-100 text-amber-900";
      } else {
        fillColor = "#fbbf24";
        fillOpacity = 0.25;
        ratingLabel = "🌱 Low Frequency";
        ratingBadgeClass = "bg-surface-container text-on-surface";
      }

      q.ratingLabel = ratingLabel;
      q.ratingBadgeClass = ratingBadgeClass;
      q.fillColor = fillColor;
      q.isBest = isBest;

      // Update Leaflet polygon style
      if (this.quadrantLayers[key]) {
        this.quadrantLayers[key].setStyle({
          fillColor,
          fillOpacity,
          color: isBest ? "#00522d" : "#4a6358",
          weight: isBest ? 3 : 1.5,
        });
      }

      // Update badge label inside quadrant on map
      const pctEl = document.getElementById(`quad-pct-${key}`);
      if (pctEl) {
        if (q.totalSnakes === 0) {
          pctEl.textContent = "0 snakes";
          pctEl.className = "block text-on-surface-variant text-[11px] font-bold";
        } else {
          pctEl.textContent = `${q.percentage.toFixed(1)}%`;
          pctEl.className = isBest
            ? "block text-primary text-xs font-black"
            : "block text-on-surface text-xs font-bold";
        }
      }
    });

    this.renderRecommendation(analysis, bestKey);
    this.renderBentoCards(analysis, bestKey);
  }

  renderRecommendation(analysis, bestKey) {
    const banner = document.getElementById("hotspots-recommendation-banner");
    if (!banner) return;

    if (bestKey && analysis[bestKey] && analysis[bestKey].targetCount > 0) {
      const best = analysis[bestKey];
      banner.innerHTML = `
        <div class="flex items-start gap-3 w-full">
          <span class="text-2xl mt-0.5">🎯</span>
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-bold text-on-surface text-sm sm:text-base">
                Prime Target: ${best.name} (${best.code})
              </h3>
              <span class="bg-primary-container text-on-primary text-xs font-bold px-2 py-0.5 rounded-full">
                ${best.percentage.toFixed(1)}% of Snake Sightings
              </span>
            </div>
            <p class="text-on-surface-variant text-xs sm:text-sm mt-1 leading-relaxed">
              <strong>${best.targetCount} of ${best.totalSnakes} snakes</strong> recorded in the ${best.name} quadrant are <strong>${this.selectedSpeciesName}</strong>. Normalized density accounts for observation volume, steering you clear of crowded zero-find areas!
            </p>
          </div>
        </div>
      `;
      banner.className = "bg-primary-container/20 border-2 border-primary/40 rounded-xl p-3 sm:p-4 shadow-sm flex items-start gap-space-sm";
    } else {
      banner.innerHTML = `
        <div class="flex items-start gap-3 w-full">
          <span class="text-2xl mt-0.5">🔍</span>
          <div class="flex-1">
            <h3 class="font-bold text-on-surface text-sm sm:text-base">
              No ${this.selectedSpeciesName} Sightings in This Region
            </h3>
            <p class="text-on-surface-variant text-xs sm:text-sm mt-1 leading-relaxed">
              Zero observations found across all 4 quadrants. Try expanding the search box to 20 or 40 miles, or tap the map to relocate your search zone.
            </p>
          </div>
        </div>
      `;
      banner.className = "bg-surface-container border border-surface-container-high rounded-xl p-3 sm:p-4 shadow-sm flex items-start gap-space-sm";
    }
  }

  renderBentoCards(analysis, bestKey) {
    const container = document.getElementById("hotspots-quadrant-cards");
    if (!container) return;

    const keys = ["NW", "NE", "SW", "SE"];
    container.innerHTML = keys.map((key) => {
      const q = analysis[key];
      const isBest = key === bestKey && q.targetCount > 0;
      const pctFormatted = q.totalSnakes > 0 ? `${q.percentage.toFixed(1)}%` : "0.0%";

      const othersHtml = q.others && q.others.length > 0
        ? q.others.map((o) => `<span class="inline-block bg-surface-container px-1.5 py-0.5 rounded text-[11px] text-on-surface-variant">${o.name} (${o.count})</span>`).join(" ")
        : `<span class="text-[11px] text-on-surface-variant">No other snakes</span>`;

      return `
        <div id="hotspot-card-${key}" class="p-3 sm:p-4 rounded-xl border transition-all ${
          isBest
            ? "bg-primary-container/15 border-primary shadow-md ring-2 ring-primary/30"
            : "bg-surface-container-lowest border-surface-container shadow-sm"
        }">
          <div class="flex items-center justify-between gap-1 mb-1.5">
            <div class="flex items-center gap-1.5">
              <span class="w-6 h-6 rounded-md bg-surface-container-high flex items-center justify-center font-bold text-xs text-primary">
                ${key}
              </span>
              <h4 class="font-bold text-xs sm:text-sm text-on-surface">${q.name}</h4>
            </div>
            <span class="text-[11px] px-2 py-0.5 rounded-full font-bold ${q.ratingBadgeClass}">
              ${q.ratingLabel}
            </span>
          </div>

          <!-- Percentage display -->
          <div class="my-2 flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-on-surface">${pctFormatted}</span>
            <span class="text-xs text-on-surface-variant font-medium">
              (${q.targetCount} / ${q.totalSnakes} sightings)
            </span>
          </div>

          <!-- Progress proportion bar -->
          <div class="w-full bg-surface-container rounded-full h-2 overflow-hidden mb-2">
            <div class="h-2 rounded-full transition-all duration-500 ${isBest ? "bg-primary" : "bg-secondary"}" style="width: ${Math.min(100, Math.max(q.percentage, q.targetCount > 0 ? 4 : 0))}%"></div>
          </div>

          <!-- Co-occurring snakes -->
          <div class="mt-2 pt-2 border-t border-surface-container flex flex-col gap-1">
            <span class="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Also in Quadrant:</span>
            <div class="flex flex-wrap gap-1">
              ${othersHtml}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  highlightQuadrantCard(key) {
    const card = document.getElementById(`hotspot-card-${key}`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      card.classList.add("ring-4", "ring-primary");
      setTimeout(() => {
        card.classList.remove("ring-4", "ring-primary");
      }, 1200);
    }
  }

  updateStatusUI(text, isScanning) {
    const textEl = document.getElementById("hotspots-status-text");
    const dotEl = document.getElementById("hotspots-status-dot");
    if (textEl) textEl.textContent = text;
    if (dotEl) {
      if (isScanning) {
        dotEl.className = "w-2 h-2 rounded-full bg-primary animate-pulse";
      } else {
        dotEl.className = "w-2 h-2 rounded-full bg-emerald-500";
      }
    }
  }

  useCurrentLocation() {
    if (navigator.geolocation) {
      this.updateStatusUI("Detecting GPS position...", true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.setCenter(pos.coords.latitude, pos.coords.longitude, true);
        },
        (err) => {
          alert("Could not access GPS location. Please tap the map to relocate.");
          this.updateStatusUI("Location denied", false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }
}
