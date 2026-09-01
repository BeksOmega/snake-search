import { HotspotsController } from './hotspots.js';
import { SnakeMapController } from './map.js';
/**
 * SlitherScope - Main Application Controller
 * Handles UI rendering, hash routing, modal interactions, speech synthesis, and events.
 */
import { SPECIES_DATA, LOCATIONS_DATA, SAFETY_RULES } from './data.js';
import { state } from './state.js';

// SVG Fallback for broken images
const SVG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23d8f2ff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2300628c'%3E🐍 SlitherScope Reptile%3C/text%3E%3C/svg%3E";

class SlitherScopeApp {
  constructor() {
    this.initElements();
    this.bindEvents();
    this.initRouter();
    this.snakeMap = new SnakeMapController();
    this.hotspotsController = new HotspotsController();
    this.render();

    // Subscribe to state changes
    state.subscribe((event, payload) => {
      this.handleStateChange(event, payload);
    });
  }

  initElements() {
    // Views
    this.viewCensus = document.getElementById('view-census');
    this.viewExplore = document.getElementById('view-explore');
    this.viewGuide = document.getElementById('view-guide');
    this.viewLog = document.getElementById('view-log');
    this.viewHotspots = document.getElementById('view-hotspots');

    // Header XP
    this.headerXpBadge = document.getElementById('header-xp-badge');

    // Modals
    this.speciesModal = document.getElementById('species-detail-modal');
    this.logModal = document.getElementById('log-sighting-modal');
    this.locationModal = document.getElementById('location-picker-modal');
    this.shareModal = document.getElementById('share-modal');
    this.shareToast = document.getElementById('share-toast');

    // Speech synthesis state
    this.speechUtterance = null;
    this.isSpeaking = false;
  }

  bindEvents() {
    // Bottom Nav clicks
    document.querySelectorAll('nav [data-path]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const path = link.getAttribute('data-path');
        window.location.hash = path;
      });
    });

    // Header Profile button opens My Log
    const profileBtn = document.getElementById('header-profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        window.location.hash = 'my-log';
      });
    }

    // Modal Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllModals();
      });
    });

    // Close modals on backdrop click
    [this.speciesModal, this.logModal, this.locationModal, this.shareModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeAllModals();
          }
        });
      }
    });

    // Photo file input in Log Modal
    const photoInput = document.getElementById('log-photo-input');
    const photoPreview = document.getElementById('log-photo-preview');
    if (photoInput && photoPreview) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            photoPreview.src = event.target.result;
            photoPreview.classList.remove('hidden');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Log Form Submit
    const logForm = document.getElementById('log-sighting-form');
    if (logForm) {
      logForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogFormSubmit(logForm);
      });
    }
  }

  initRouter() {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '') || 'area-census';
      let cleanTab = 'area-census';
      if (hash.includes('explore')) cleanTab = 'explore';
      else if (hash.includes('hotspot')) cleanTab = 'hotspots';
      else if (hash.includes('guide') || hash.includes('field-guide')) cleanTab = 'field-guide';
      else if (hash.includes('log') || hash.includes('my-log')) cleanTab = 'my-log';
      else cleanTab = 'area-census';

      this.switchTab(cleanTab);

      // Check if deep linking to a specific species modal e.g. #species/eastern-garter
      if (hash.startsWith('species/')) {
        const speciesId = hash.split('/')[1];
        if (speciesId) {
          this.openSpeciesModal(speciesId);
        }
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();
  }

  switchTab(tabName) {
    state.activeTab = tabName;

    // Update view visibility
    const views = {
      'area-census': this.viewCensus,
      'explore': this.viewExplore,
      'hotspots': this.viewHotspots,
      'field-guide': this.viewGuide,
      'my-log': this.viewLog
    };

    Object.entries(views).forEach(([name, el]) => {
      if (el) {
        if (name === tabName) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Update Bottom Nav styling
    document.querySelectorAll('nav [data-path]').forEach(link => {
      const path = link.getAttribute('data-path');
      const isCurrent = (path === tabName) || 
        (tabName === 'field-guide' && path === 'field-guide') ||
        (tabName === 'my-log' && path === 'my-log') ||
        (tabName === 'area-census' && path === 'area-census');

      if (isCurrent) {
        link.className = 'flex-1 flex flex-col items-center justify-center min-h-[44px] py-space-xs px-space-xxs rounded-full transition-all duration-150 bg-primary-container text-on-primary font-bold shadow-[0_4px_0px_#00522d]';
        link.setAttribute('aria-current', 'page');
      } else {
        link.className = 'flex-1 flex flex-col items-center justify-center min-h-[44px] py-space-xs px-space-xxs rounded-full text-on-surface-variant hover:text-primary transition-all duration-150';
        link.removeAttribute('aria-current');
      }
    });

    // Show/hide map section wrapper (visible on Census and Explore, hidden on Guide and Log)
    const mapWrapper = document.getElementById('map-section-wrapper');
    if (mapWrapper) {
      if (tabName === 'area-census' || tabName === 'explore') {
        mapWrapper.classList.remove('hidden');
      } else {
        mapWrapper.classList.add('hidden');
      }
    }

    // Re-render active tab content
    if (tabName === 'area-census') {
      this.renderCensus();
      if (this.snakeMap && this.snakeMap.map) {
        setTimeout(() => this.snakeMap.map.invalidateSize(), 150);
      }
    }
    else if (tabName === 'explore') {
      this.renderExplore();
      if (this.snakeMap && this.snakeMap.map) {
        setTimeout(() => this.snakeMap.map.invalidateSize(), 150);
      }
    }
    else if (tabName === 'hotspots') {
      if (this.hotspotsController) {
        this.hotspotsController.activate();
      }
    }
    else if (tabName === 'field-guide') this.renderGuide();
    else if (tabName === 'my-log') this.renderLog();

    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleStateChange(event, payload) {
    this.renderHeaderXP();
    if (event === 'location_changed') {
      this.renderCensus();
      this.showToast(`Switched area to ${payload.name}`);
    } else if (event === 'family_filter_changed') {
      this.renderCensusSpecies();
    } else if (event === 'tip_changed') {
      this.renderTipCard();
    } else if (event === 'explore_filter_changed') {
      this.renderExploreResults();
    } else if (event === 'log_added') {
      this.renderLog();
      this.showToast(`🎉 Sighting Logged! +50 XP Earned`);
    } else if (event === 'log_deleted') {
      this.renderLog();
      this.showToast(`Sighting removed.`);
    } else if (event === 'badge_unlocked') {
      this.showToast(`🏆 New Achievement Unlocked!`);
    }
  }

  render() {
    this.renderHeaderXP();
    this.renderCensus();
    this.renderExplore();
    this.renderGuide();
    this.renderLog();
  }

  renderHeaderXP() {
    const profile = state.getProfile();
    if (this.headerXpBadge) {
      this.headerXpBadge.textContent = `${profile.xp} XP`;
    }
  }

  // ==========================================
  // CENSUS VIEW RENDERERS
  // ==========================================
  renderCensus() {
    const loc = state.getLocation();
    if (!loc) return;

    // Location Banner Header
    const locAreaLabel = document.getElementById('census-area-label');
    const locTitle = document.getElementById('census-title');
    const locSubtitle = document.getElementById('census-subtitle');
    const speciesCountLabel = document.getElementById('census-species-count');
    const neighborsCountLabel = document.getElementById('census-neighbors-count');

    if (locAreaLabel) locAreaLabel.textContent = loc.area;
    if (locTitle) locTitle.textContent = loc.name;
    if (locSubtitle) locSubtitle.textContent = loc.subtitle;
    if (speciesCountLabel) speciesCountLabel.textContent = loc.totalSpecies;
    if (neighborsCountLabel) neighborsCountLabel.textContent = `~${loc.totalNeighbors}`;

    // Clickable Location Banner
    const locBanner = document.getElementById('census-location-banner');
    if (locBanner) {
      locBanner.onclick = () => this.openLocationPicker();
    }

    // Caterpillar Progress Bar
    const barGarter = document.getElementById('bar-garter');
    const barRat = document.getElementById('bar-rat');
    const barTiny = document.getElementById('bar-tiny');
    const barViper = document.getElementById('bar-viper');
    const harmlessLabel = document.getElementById('caterpillar-harmless-label');
    const cautionLabel = document.getElementById('caterpillar-caution-label');

    if (barGarter) {
      barGarter.style.width = `${loc.familyPercentages.garter}%`;
      barGarter.title = `Water & Garter (${loc.familyPercentages.garter}%)`;
    }
    if (barRat) {
      barRat.style.width = `${loc.familyPercentages.rat}%`;
      barRat.title = `Rat & Kingsnakes (${loc.familyPercentages.rat}%)`;
    }
    if (barTiny) {
      barTiny.style.width = `${loc.familyPercentages.tiny}%`;
      barTiny.title = `Tiny Bug Eaters (${loc.familyPercentages.tiny}%)`;
    }
    if (barViper) {
      barViper.style.width = `${loc.familyPercentages.viper}%`;
      barViper.title = `Pit Vipers (${loc.familyPercentages.viper}%)`;
    }

    if (harmlessLabel) harmlessLabel.textContent = `🌿 ${loc.harmlessPercent}% Totally Harmless Helpers`;
    if (cautionLabel) cautionLabel.textContent = `⚠️ ${loc.cautionPercent}% Watch From Afar`;

    // Audio button
    const audioBtn = document.getElementById('census-audio-btn');
    if (audioBtn) {
      audioBtn.onclick = () => this.toggleCensusSpeech(loc);
    }

    // Family Filter Chips
    this.renderFamilyChips(loc);

    // Family Legend Cards click binding
    document.querySelectorAll('[data-legend-family]').forEach(card => {
      card.onclick = () => {
        const fam = card.getAttribute('data-legend-family');
        state.setFamilyFilter(fam);
      };
    });

    // Species Cards
    this.renderCensusSpecies();

    // Habitat Breakdown
    this.renderHabitats(loc);

    // Detective Tip
    this.renderTipCard();

    // Share Button
    const shareBtn = document.getElementById('census-share-btn');
    if (shareBtn) {
      shareBtn.onclick = () => this.handleShare();
    }
  }

  renderFamilyChips(loc) {
    const container = document.getElementById('family-chips-container');
    if (!container) return;

    const currentFilter = state.getFamilyFilter();
    const chips = [
      { id: 'all', label: 'All Families (100%)' },
      { id: 'garter', label: `Water & Garter (${loc.familyPercentages.garter}%)` },
      { id: 'rat', label: `Rat & Kings (${loc.familyPercentages.rat}%)` },
      { id: 'tiny', label: `Tiny Bug Eaters (${loc.familyPercentages.tiny}%)` },
      { id: 'viper', label: `Pit Vipers (${loc.familyPercentages.viper}%)` }
    ];

    container.innerHTML = chips.map(c => {
      const active = c.id === currentFilter;
      const cls = active
        ? 'family-btn bg-primary-container text-on-primary font-label-sm text-label-sm px-space-sm py-1.5 rounded-full whitespace-nowrap shadow-[0_3px_0px_#00522d] active:translate-y-0.5 transition-all'
        : 'family-btn bg-surface-container-high text-on-surface font-label-sm text-label-sm px-space-sm py-1.5 rounded-full whitespace-nowrap active:translate-y-0.5 transition-all hover:bg-surface-container-highest';
      return `<button class="${cls}" data-family="${c.id}">${c.label}</button>`;
    }).join('');

    container.querySelectorAll('button[data-family]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.setFamilyFilter(btn.getAttribute('data-family'));
      });
    });
  }

  renderCensusSpecies() {
    const container = document.getElementById('census-species-list');
    const countHeader = document.getElementById('census-species-types-count');
    if (!container) return;

    const currentFilter = state.getFamilyFilter();
    const topSpecies = state.getTopSpeciesForLocation();
    const filtered = currentFilter === 'all'
      ? topSpecies
      : topSpecies.filter(s => s.family === currentFilter);

    if (countHeader) {
      countHeader.textContent = `${filtered.length} Species in View`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="bg-surface-container-lowest rounded-lg p-space-lg text-center flex flex-col items-center gap-space-xs shadow-sm">
          <span class="material-symbols-outlined text-4xl text-tertiary">search_off</span>
          <span class="font-headline-sm text-on-surface">No species match this family</span>
          <button class="mt-2 text-primary font-bold underline" onclick="window.slitherApp.resetFamilyFilter()">View All Families</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(s => {
      const isVenomous = s.dangerLevel === 'venomous';
      const badgeClass = isVenomous ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-primary';
      const pctColor = isVenomous ? 'text-secondary' : (s.family === 'rat' ? 'text-tertiary-container' : 'text-primary');
      const containerClass = isVenomous ? 'bg-surface-container-low border border-secondary/20' : 'bg-surface-container-lowest';
      const bottomIcon = isVenomous ? 'visibility' : (s.family === 'garter' ? 'water' : (s.family === 'rat' ? 'nature' : 'pest_control'));

      return `
        <div class="species-card w-full ${containerClass} rounded-lg p-space-sm shadow-sm flex flex-col gap-space-xs transition-all hover:shadow-md cursor-pointer active:scale-[0.99]" data-species-id="${s.id}">
          <div class="flex items-center gap-space-sm">
            <img class="w-20 h-20 rounded-DEFAULT object-cover shrink-0 bg-surface-container"
                 alt="${s.name}"
                 src="${s.imageUrl}"
                 onerror="this.onerror=null; this.src='${SVG_FALLBACK}';" />
            <div class="flex flex-col flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <span class="font-headline-sm text-headline-sm text-on-surface truncate">${s.name}</span>
                <span class="font-headline-sm text-headline-sm ${pctColor} font-bold shrink-0">${s.percentage}%</span>
              </div>
              <span class="font-body-sm text-body-sm text-on-surface-variant italic truncate">${s.scientificName}</span>
              <div class="flex flex-wrap items-center gap-1 mt-1">
                <span class="${badgeClass} font-label-sm text-label-sm px-2 py-0.5 rounded-full">${s.safetyBadge}</span>
                <span class="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full">${s.size}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between bg-surface-container-low rounded-DEFAULT px-space-sm py-1.5 text-on-surface-variant text-xs">
            <span class="font-body-sm text-body-sm flex items-center gap-1 min-w-0 truncate">
              <span class="material-symbols-outlined text-[16px] ${pctColor} shrink-0">${bottomIcon}</span>
              <span class="truncate">${s.trailNote}</span>
            </span>
            <span class="font-label-sm text-label-sm font-bold ${pctColor} shrink-0 ml-1">${s.frequencyLabel}</span>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-species-id]').forEach(card => {
      card.onclick = () => {
        const id = card.getAttribute('data-species-id');
        this.openSpeciesModal(id);
      };
    });
  }

  renderHabitats(loc) {
    const container = document.getElementById('census-habitats-grid');
    if (!container || !loc.habitatBreakdown) return;

    const { creek, rocks, canopy } = loc.habitatBreakdown;
    const items = [
      { key: 'creek', color: 'text-tertiary', ...creek },
      { key: 'rocks', color: 'text-secondary', ...rocks },
      { key: 'canopy', color: 'text-primary', ...canopy }
    ];

    container.innerHTML = items.map(item => `
      <div class="bg-surface-container-low rounded-DEFAULT p-space-xs flex flex-col items-center text-center gap-1 hover:bg-surface-container cursor-pointer transition-colors" data-filter-habitat="${item.key}">
        <div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center ${item.color}">
          <span class="material-symbols-outlined text-[20px]">${item.icon}</span>
        </div>
        <span class="font-headline-sm text-headline-sm ${item.color} font-bold leading-tight">${item.percent}%</span>
        <span class="font-label-sm text-label-sm text-on-surface font-bold leading-tight">${item.label}</span>
        <span class="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-tight">${item.sub}</span>
      </div>
    `).join('');

    container.querySelectorAll('[data-filter-habitat]').forEach(el => {
      el.onclick = () => {
        const hab = el.getAttribute('data-filter-habitat');
        state.setExploreFilter('habitat', hab);
        window.location.hash = 'explore';
      };
    });
  }

  renderTipCard() {
    const tip = state.getCurrentTip();
    const titleEl = document.getElementById('detective-tip-title');
    const textEl = document.getElementById('detective-tip-text');
    const nextBtn = document.getElementById('detective-tip-next-btn');

    if (titleEl) titleEl.textContent = tip.title;
    if (textEl) textEl.textContent = tip.text;
    if (nextBtn) {
      nextBtn.onclick = () => {
        state.nextTip();
      };
    }
  }

  toggleCensusSpeech(loc) {
    if (!('speechSynthesis' in window)) {
      this.showToast('Speech synthesis not supported in this browser.');
      return;
    }

    if (this.isSpeaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.updateSpeechButton(false);
      return;
    }

    const text = `SlitherScope Census for ${loc.name}. ${loc.area}. There are ${loc.totalSpecies} species counted, with approximately ${loc.totalNeighbors} local reptile neighbors. ${loc.harmlessPercent} percent are harmless helpers like garter and water snakes, while only ${loc.cautionPercent} percent are pit vipers to observe from a safe distance.`;

    this.speechUtterance = new SpeechSynthesisUtterance(text);
    this.speechUtterance.rate = 0.95;
    this.speechUtterance.pitch = 1.05;

    this.speechUtterance.onstart = () => {
      this.isSpeaking = true;
      this.updateSpeechButton(true);
    };

    this.speechUtterance.onend = () => {
      this.isSpeaking = false;
      this.updateSpeechButton(false);
    };

    this.speechUtterance.onerror = () => {
      this.isSpeaking = false;
      this.updateSpeechButton(false);
    };

    window.speechSynthesis.speak(this.speechUtterance);
  }

  updateSpeechButton(speaking) {
    const btn = document.getElementById('census-audio-btn');
    if (btn) {
      if (speaking) {
        btn.classList.add('animate-bounce', 'bg-primary', 'text-on-primary');
        btn.classList.remove('bg-surface-container', 'text-tertiary');
      } else {
        btn.classList.remove('animate-bounce', 'bg-primary', 'text-on-primary');
        btn.classList.add('bg-surface-container', 'text-tertiary');
      }
    }
  }

  // ==========================================
  // EXPLORE & SEARCH VIEW RENDERERS
  // ==========================================
  renderExplore() {
    const searchInput = document.getElementById('explore-search-input');
    const clearSearchBtn = document.getElementById('explore-clear-search');

    if (searchInput) {
      searchInput.value = state.exploreFilters.query;
      searchInput.oninput = (e) => {
        state.setExploreFilter('query', e.target.value);
        if (clearSearchBtn) {
          clearSearchBtn.classList.toggle('hidden', !e.target.value);
        }
      };
    }

    if (clearSearchBtn) {
      clearSearchBtn.onclick = () => {
        if (searchInput) searchInput.value = '';
        state.setExploreFilter('query', '');
        clearSearchBtn.classList.add('hidden');
      };
    }

    // Danger Filters
    document.querySelectorAll('[data-filter-danger]').forEach(btn => {
      btn.onclick = () => {
        const val = btn.getAttribute('data-filter-danger');
        state.setExploreFilter('danger', val);
      };
    });

    // Habitat Filters
    document.querySelectorAll('[data-filter-hab]').forEach(btn => {
      btn.onclick = () => {
        const val = btn.getAttribute('data-filter-hab');
        state.setExploreFilter('habitat', val);
      };
    });

    // Pattern Filters
    document.querySelectorAll('[data-filter-pattern]').forEach(btn => {
      btn.onclick = () => {
        const val = btn.getAttribute('data-filter-pattern');
        state.setExploreFilter('pattern', val);
      };
    });

    this.renderExploreFilterButtons();
    this.renderExploreResults();
  }

  renderExploreFilterButtons() {
    const filters = state.getExploreFilters();

    // Danger buttons
    document.querySelectorAll('[data-filter-danger]').forEach(btn => {
      const val = btn.getAttribute('data-filter-danger');
      const active = filters.danger === val;
      btn.className = active
        ? 'px-3 py-1.5 rounded-full font-label-sm text-label-sm bg-primary text-on-primary font-bold shadow-sm transition-all'
        : 'px-3 py-1.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all';
    });

    // Habitat buttons
    document.querySelectorAll('[data-filter-hab]').forEach(btn => {
      const val = btn.getAttribute('data-filter-hab');
      const active = filters.habitat === val;
      btn.className = active
        ? 'px-3 py-1.5 rounded-full font-label-sm text-label-sm bg-tertiary text-on-tertiary font-bold shadow-sm transition-all'
        : 'px-3 py-1.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all';
    });

    // Pattern buttons
    document.querySelectorAll('[data-filter-pattern]').forEach(btn => {
      const val = btn.getAttribute('data-filter-pattern');
      const active = filters.pattern === val;
      btn.className = active
        ? 'px-3 py-1.5 rounded-full font-label-sm text-label-sm bg-secondary text-on-secondary font-bold shadow-sm transition-all'
        : 'px-3 py-1.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all';
    });
  }

  renderExploreResults() {
    const container = document.getElementById('explore-results-grid');
    const counter = document.getElementById('explore-results-count');
    if (!container) return;

    this.renderExploreFilterButtons();

    const results = state.getFilteredSpecies();
    const all = state.getAllSpecies();

    if (counter) {
      counter.textContent = `Showing ${results.length} of ${all.length} Species`;
    }

    if (results.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-surface-container-lowest rounded-lg p-space-lg text-center flex flex-col items-center gap-space-sm shadow-sm">
          <span class="material-symbols-outlined text-5xl text-tertiary">search_off</span>
          <div class="flex flex-col">
            <span class="font-headline-sm text-on-surface font-bold">No snakes found</span>
            <span class="font-body-sm text-on-surface-variant">Try adjusting your trait filters or search query</span>
          </div>
          <button class="bg-primary-container text-on-primary font-label-sm text-label-sm px-space-md py-2 rounded-full shadow-sm" onclick="window.slitherApp.resetExploreFilters()">
            Reset All Filters
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = results.map(s => {
      const isVenomous = s.dangerLevel === 'venomous';
      const badgeClass = isVenomous ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-primary';

      return `
        <div class="bg-surface-container-lowest rounded-lg p-space-sm shadow-sm flex flex-col gap-space-xs hover:shadow-md cursor-pointer transition-all active:scale-[0.99]" data-species-id="${s.id}">
          <div class="relative w-full h-36 rounded-DEFAULT overflow-hidden bg-surface-container">
            <img class="w-full h-full object-cover"
                 alt="${s.name}"
                 src="${s.imageUrl}"
                 onerror="this.onerror=null; this.src='${SVG_FALLBACK}';" />
            <span class="absolute top-2 right-2 ${badgeClass} font-label-sm text-label-sm px-2 py-0.5 rounded-full shadow-sm">
              ${s.safetyBadge}
            </span>
          </div>
          <div class="flex flex-col flex-1 justify-between">
            <div class="flex flex-col">
              <span class="font-headline-sm text-headline-sm text-on-surface truncate">${s.name}</span>
              <span class="font-body-sm text-body-sm text-on-surface-variant italic truncate">${s.scientificName}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-on-surface-variant mt-2 pt-2 border-t border-surface-container">
              <span class="flex items-center gap-1 truncate"><span class="material-symbols-outlined text-[14px]">straighten</span> ${s.size}</span>
              <span class="flex items-center gap-1 font-bold text-primary shrink-0"><span class="material-symbols-outlined text-[14px]">visibility</span> View ID</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-species-id]').forEach(card => {
      card.onclick = () => {
        const id = card.getAttribute('data-species-id');
        this.openSpeciesModal(id);
      };
    });
  }

  // ==========================================
  // FIELD GUIDE VIEW RENDERERS
  // ==========================================
  renderGuide() {
    const safetyContainer = document.getElementById('guide-safety-rules');
    if (safetyContainer) {
      safetyContainer.innerHTML = SAFETY_RULES.map(r => `
        <div class="flex items-start gap-space-sm bg-surface-container-lowest p-space-sm rounded-DEFAULT shadow-sm">
          <div class="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-display-mobile font-bold shrink-0">
            ${r.letter}
          </div>
          <div class="flex flex-col">
            <span class="font-headline-sm text-on-surface">${r.word}</span>
            <span class="font-body-sm text-on-surface-variant">${r.desc}</span>
          </div>
        </div>
      `).join('');
    }

    // Unlock safety badge when viewing guide
    state.unlockBadge('safety-champion');
  }

  // ==========================================
  // MY LOG & XP VIEW RENDERERS
  // ==========================================
  renderLog() {
    const profile = state.getProfile();
    const logs = state.getSightingLogs();
    const achievements = state.getAchievements();

    // Profile Card
    const xpVal = document.getElementById('log-profile-xp');
    const levelVal = document.getElementById('log-profile-level');
    const titleVal = document.getElementById('log-profile-title');
    const progressBar = document.getElementById('log-xp-progress');
    const nextLevelLabel = document.getElementById('log-xp-next-level');

    if (xpVal) xpVal.textContent = `${profile.xp} XP`;
    if (levelVal) levelVal.textContent = `Level ${profile.level}`;
    if (titleVal) titleVal.textContent = profile.title;

    // Level thresholds
    let nextThreshold = 500;
    if (profile.xp < 100) nextThreshold = 100;
    else if (profile.xp < 250) nextThreshold = 250;
    else if (profile.xp < 500) nextThreshold = 500;
    else if (profile.xp < 1000) nextThreshold = 1000;
    else nextThreshold = 2000;

    const progressPct = Math.min(100, Math.round((profile.xp / nextThreshold) * 100));
    if (progressBar) progressBar.style.width = `${progressPct}%`;
    if (nextLevelLabel) nextLevelLabel.textContent = `${profile.xp} / ${nextThreshold} XP to Next Rank`;

    // Sighting Button
    const newLogBtn = document.getElementById('log-new-sighting-btn');
    if (newLogBtn) {
      newLogBtn.onclick = () => this.openLogModal();
    }

    // Sighting list
    const logList = document.getElementById('log-sightings-list');
    const countBadge = document.getElementById('log-sightings-count');
    if (countBadge) countBadge.textContent = `${logs.length} Logged`;

    if (logList) {
      if (logs.length === 0) {
        logList.innerHTML = `
          <div class="bg-surface-container-lowest rounded-lg p-space-lg text-center flex flex-col items-center gap-space-xs shadow-sm">
            <span class="material-symbols-outlined text-4xl text-tertiary">edit_note</span>
            <span class="font-headline-sm text-on-surface">No sightings logged yet</span>
            <span class="font-body-sm text-on-surface-variant">Tap below to record your first snake observation!</span>
            <button class="mt-2 bg-primary-container text-on-primary font-label-sm text-label-sm px-space-md py-2 rounded-full" onclick="window.slitherApp.openLogModal()">
              + Record Sighting
            </button>
          </div>
        `;
      } else {
        logList.innerHTML = logs.map(l => {
          const dateStr = new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          return `
            <div class="bg-surface-container-lowest rounded-lg p-space-sm shadow-sm flex flex-col gap-space-xs">
              <div class="flex items-start gap-space-sm">
                <img class="w-20 h-20 rounded-DEFAULT object-cover shrink-0 bg-surface-container"
                     src="${l.photoUrl}"
                     alt="${l.speciesName}"
                     onerror="this.onerror=null; this.src='${SVG_FALLBACK}';" />
                <div class="flex flex-col flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="font-headline-sm text-headline-sm text-on-surface truncate font-bold">${l.speciesName}</span>
                    <button class="text-on-surface-variant hover:text-error p-1" title="Delete Log" onclick="window.slitherApp.deleteLog('${l.id}')">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                  <span class="font-label-sm text-label-sm text-primary flex items-center gap-1 mt-0.5">
                    <span class="material-symbols-outlined text-[14px]">location_on</span> ${l.location}
                  </span>
                  <span class="font-body-sm text-body-sm text-on-surface-variant text-[12px] mt-0.5">
                    ${dateStr}
                  </span>
                </div>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface bg-surface-container-low p-space-xs rounded-DEFAULT mt-1">
                "${l.notes}"
              </p>
            </div>
          `;
        }).join('');
      }
    }

    // Achievements Shelf
    const achGrid = document.getElementById('log-achievements-grid');
    if (achGrid) {
      achGrid.innerHTML = achievements.map(ach => {
        const bg = ach.unlocked ? 'bg-surface-container-lowest text-primary' : 'bg-surface-container text-on-surface-variant opacity-60';
        const iconBg = ach.unlocked ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface-variant';
        return `
          <div class="${bg} rounded-DEFAULT p-space-xs flex items-center gap-space-xs shadow-sm">
            <div class="w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[20px]">${ach.icon}</span>
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-label-sm text-label-sm font-bold truncate text-on-surface">${ach.title}</span>
              <span class="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-tight line-clamp-2">${ach.description}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // ==========================================
  // MODAL CONTROLLERS
  // ==========================================
  openSpeciesModal(speciesId) {
    const s = state.getSpeciesById(speciesId);
    if (!s || !this.speciesModal) return;

    const img = document.getElementById('modal-species-image');
    const badge = document.getElementById('modal-species-badge');
    const name = document.getElementById('modal-species-name');
    const sciName = document.getElementById('modal-species-sci');
    const size = document.getElementById('modal-species-size');
    const hours = document.getElementById('modal-species-hours');
    const diet = document.getElementById('modal-species-diet');
    const desc = document.getElementById('modal-species-desc');
    const kidFact = document.getElementById('modal-species-fact');
    const idTipsList = document.getElementById('modal-species-id-tips');
    const logBtn = document.getElementById('modal-species-log-btn');
    const audioBtn = document.getElementById('modal-species-audio-btn');

    if (img) {
      img.src = s.imageUrl;
      img.onerror = () => { img.src = SVG_FALLBACK; };
    }
    if (badge) {
      badge.textContent = s.safetyBadge;
      badge.className = s.dangerLevel === 'venomous'
        ? 'bg-secondary text-on-secondary font-label-sm text-label-sm px-2.5 py-1 rounded-full'
        : 'bg-surface-container text-primary font-label-sm text-label-sm px-2.5 py-1 rounded-full';
    }
    if (name) name.textContent = s.name;
    if (sciName) sciName.textContent = s.scientificName;
    if (size) size.textContent = s.size;
    if (hours) hours.textContent = s.activityTime;
    if (diet) diet.textContent = s.diet;
    if (desc) desc.textContent = s.description;
    if (kidFact) kidFact.textContent = s.kidFact;

    if (idTipsList && s.idTips) {
      idTipsList.innerHTML = s.idTips.map(tip => `
        <li class="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
          <span class="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">check_circle</span>
          <span>${tip}</span>
        </li>
      `).join('');
    }

    if (audioBtn) {
      audioBtn.onclick = () => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const text = `${s.name}. Scientific name: ${s.scientificName}. ${s.description} Fun detective fact: ${s.kidFact}`;
          const utt = new SpeechSynthesisUtterance(text);
          window.speechSynthesis.speak(utt);
        }
      };
    }

    if (logBtn) {
      logBtn.onclick = () => {
        this.closeAllModals();
        this.openLogModal(s.id);
      };
    }

    this.speciesModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  openLogModal(preselectedSpeciesId = null) {
    if (!this.logModal) return;

    const select = document.getElementById('log-species-select');
    const locInput = document.getElementById('log-location-input');
    const notesInput = document.getElementById('log-notes-input');
    const preview = document.getElementById('log-photo-preview');
    const photoInput = document.getElementById('log-photo-input');

    if (select) {
      const all = state.getAllSpecies();
      select.innerHTML = `
        <option value="">Select a species...</option>
        ${all.map(s => `<option value="${s.id}" ${s.id === preselectedSpeciesId ? 'selected' : ''}>${s.name} (${s.safetyBadge})</option>`).join('')}
        <option value="custom">Other / Unknown Snake</option>
      `;
    }

    if (locInput) {
      locInput.value = state.getLocation().name;
    }
    if (notesInput) notesInput.value = '';
    if (preview) {
      preview.src = '';
      preview.classList.add('hidden');
    }
    if (photoInput) photoInput.value = '';

    this.logModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  handleLogFormSubmit(form) {
    const select = document.getElementById('log-species-select');
    const locInput = document.getElementById('log-location-input');
    const habitatSelect = document.getElementById('log-habitat-select');
    const notesInput = document.getElementById('log-notes-input');
    const photoPreview = document.getElementById('log-photo-preview');

    const speciesId = select ? select.value : '';
    const location = locInput ? locInput.value : '';
    const habitat = habitatSelect ? habitatSelect.value : 'creek';
    const notes = notesInput ? notesInput.value : '';
    const photoUrl = (photoPreview && !photoPreview.classList.contains('hidden')) ? photoPreview.src : null;

    if (!speciesId && !notes) {
      alert('Please select a species or enter observation notes!');
      return;
    }

    state.addSightingLog({
      speciesId: speciesId === 'custom' ? null : speciesId,
      customSpeciesName: speciesId === 'custom' ? 'Unknown Wild Snake' : null,
      location,
      habitat,
      notes,
      photoUrl
    });

    this.closeAllModals();
    window.location.hash = 'my-log';
  }

  deleteLog(id) {
    if (confirm('Are you sure you want to delete this sighting log?')) {
      state.deleteSightingLog(id);
    }
  }

  openLocationPicker() {
    if (!this.locationModal) return;

    const list = document.getElementById('location-picker-list');
    const currentLoc = state.getLocation();
    const all = state.getAllLocations();

    if (list) {
      list.innerHTML = all.map(loc => {
        const isCurrent = loc.id === currentLoc.id;
        const border = isCurrent ? 'border-2 border-primary bg-primary-container/10' : 'border border-surface-container bg-surface-container-lowest';
        return `
          <div class="${border} rounded-lg p-space-sm flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-all" data-loc-id="${loc.id}">
            <div class="flex flex-col">
              <span class="font-headline-sm text-on-surface font-bold">${loc.name}</span>
              <span class="font-body-sm text-on-surface-variant text-xs">${loc.area}</span>
              <span class="font-label-sm text-label-sm text-primary mt-1">${loc.totalSpecies} Species • ~${loc.totalNeighbors} Sightings</span>
            </div>
            ${isCurrent ? '<span class="material-symbols-outlined text-primary text-[24px]">check_circle</span>' : ''}
          </div>
        `;
      }).join('');

      list.querySelectorAll('[data-loc-id]').forEach(el => {
        el.onclick = () => {
          const id = el.getAttribute('data-loc-id');
          state.setLocation(id);
          this.closeAllModals();
        };
      });
    }

    this.locationModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  handleShare() {
    const loc = state.getLocation();
    const shareData = {
      title: `SlitherScope: ${loc.name}`,
      text: `Check out the reptile census for ${loc.name} on SlitherScope! 🌿 ${loc.harmlessPercent}% Harmless Helpers, ${loc.totalSpecies} species counted.`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      }
      this.showToast('Census link and summary copied to clipboard! 🦎');
    }
  }

  closeAllModals() {
    [this.speciesModal, this.logModal, this.locationModal, this.shareModal].forEach(m => {
      if (m) m.classList.add('hidden');
    });
    document.body.style.overflow = '';
    // Reset species hash if closing
    if (window.location.hash.startsWith('#species/')) {
      window.location.hash = state.activeTab;
    }
  }

  showToast(message) {
    if (this.shareToast) {
      const textSpan = this.shareToast.querySelector('span:last-child');
      if (textSpan) textSpan.textContent = message;

      this.shareToast.classList.remove('opacity-0', 'pointer-events-none');
      this.shareToast.classList.add('opacity-100');
      setTimeout(() => {
        this.shareToast.classList.remove('opacity-100');
        this.shareToast.classList.add('opacity-0', 'pointer-events-none');
      }, 2600);
    }
  }

  // Global helper methods exposed to inline onclicks
  resetFamilyFilter() {
    state.setFamilyFilter('all');
  }

  resetExploreFilters() {
    state.resetExploreFilters();
    const searchInput = document.getElementById('explore-search-input');
    if (searchInput) searchInput.value = '';
  }

  // Map Controller Delegations
  jumpToPreset(lat, lng, name, radius) {
    if (this.snakeMap) this.snakeMap.jumpToPreset(lat, lng, name, radius);
  }

  setRadius(miles) {
    if (this.snakeMap) this.snakeMap.setRadius(miles);
  }

  expandRadius() {
    if (this.snakeMap) this.snakeMap.expandRadius();
  }

  shrinkRadius() {
    if (this.snakeMap) this.snakeMap.shrinkRadius();
  }

  useCurrentLocation() {
    if (this.snakeMap) this.snakeMap.useCurrentLocation();
  }
}

// Initialize on DOM load
function boot() {
  window.slitherApp = new SlitherScopeApp();
  if (window.slitherApp.snakeMap) {
    window.slitherApp.snakeMap.init();
  }
  if (window.slitherApp.hotspotsController) {
    window.slitherApp.hotspotsController.init();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

