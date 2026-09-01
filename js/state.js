/**
 * SlitherScope - State Management & LocalStorage Persistence
 */
import { SPECIES_DATA, LOCATIONS_DATA, ACHIEVEMENTS, SAMPLE_LOGS, DETECTIVE_TIPS } from './data.js';
import { resolveSpeciesImage } from './media.js';

const STORAGE_KEYS = {
  LOCATION: 'slitherscope_location_v1',
  LOGS: 'slitherscope_logs_v1',
  PROFILE: 'slitherscope_profile_v1',
  ACHIEVEMENTS: 'slitherscope_achievements_v1'
};

class AppState {
  constructor() {
    this.listeners = [];
    this.activeTab = 'area-census';
    this.activeFamilyFilter = 'all';
    this.currentTipIndex = 0;
    this.exploreFilters = {
      query: '',
      danger: 'all',
      habitat: 'all',
      pattern: 'all'
    };

    this.init();
  }

  init() {
    const storage = typeof localStorage !== 'undefined' ? localStorage : null;

    // Load or initialize location
    const savedLocation = storage ? storage.getItem(STORAGE_KEYS.LOCATION) : null;
    this.currentLocationId = savedLocation && LOCATIONS_DATA.some(l => l.id === savedLocation)
      ? savedLocation
      : 'barton-creek';

    // Load or initialize logs
    const savedLogs = storage ? storage.getItem(STORAGE_KEYS.LOGS) : null;
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        this.sightingLogs = parsed.map(log => ({
          ...log,
          photoUrl: resolveSpeciesImage({ photoUrl: log.photoUrl, speciesId: log.speciesId, speciesList: SPECIES_DATA })
        }));
      } catch (e) {
        this.sightingLogs = [...SAMPLE_LOGS];
      }
    } else {
      this.sightingLogs = [...SAMPLE_LOGS];
      this.saveLogs();
    }

    // Load or initialize profile
    const savedProfile = storage ? storage.getItem(STORAGE_KEYS.PROFILE) : null;
    if (savedProfile) {
      try {
        this.profile = JSON.parse(savedProfile);
      } catch (e) {
        this.profile = { xp: 240, level: 2, title: 'Junior Naturalist' };
      }
    } else {
      this.profile = { xp: 240, level: 2, title: 'Junior Naturalist' };
      this.saveProfile();
    }

    // Load or initialize achievements
    const savedAchievements = storage ? storage.getItem(STORAGE_KEYS.ACHIEVEMENTS) : null;
    if (savedAchievements) {
      try {
        this.unlockedBadgeIds = JSON.parse(savedAchievements);
      } catch (e) {
        this.unlockedBadgeIds = ['first-sighting', 'water-scout', 'harmless-hero'];
      }
    } else {
      this.unlockedBadgeIds = ['first-sighting', 'water-scout', 'harmless-hero'];
      this.saveAchievements();
    }
  }

  saveLogs() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.sightingLogs));
    }
  }

  saveProfile() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(this.profile));
    }
  }

  saveAchievements() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(this.unlockedBadgeIds));
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify(event, payload) {
    this.listeners.forEach(cb => {
      try {
        cb(event, payload);
      } catch (err) {
        console.error('Listener notification error:', err);
      }
    });
  }

  // Location APIs
  getLocation() {
    return LOCATIONS_DATA.find(l => l.id === this.currentLocationId) || LOCATIONS_DATA[0];
  }

  getAllLocations() {
    return LOCATIONS_DATA;
  }

  setLocation(locationId) {
    if (this.currentLocationId !== locationId && LOCATIONS_DATA.some(l => l.id === locationId)) {
      this.currentLocationId = locationId;
      localStorage.setItem(STORAGE_KEYS.LOCATION, locationId);
      this.notify('location_changed', this.getLocation());
    }
  }

  // Species APIs
  getAllSpecies() {
    return SPECIES_DATA;
  }

  getSpeciesById(id) {
    return SPECIES_DATA.find(s => s.id === id) || null;
  }

  getTopSpeciesForLocation() {
    const loc = this.getLocation();
    return loc.topSpeciesIds
      .map(id => this.getSpeciesById(id))
      .filter(Boolean);
  }

  getFamilyFilter() {
    return this.activeFamilyFilter;
  }

  setFamilyFilter(family) {
    this.activeFamilyFilter = family;
    this.notify('family_filter_changed', family);
  }

  // Explore Filter APIs
  getExploreFilters() {
    return { ...this.exploreFilters };
  }

  setExploreFilter(key, value) {
    this.exploreFilters[key] = value;
    this.notify('explore_filter_changed', this.exploreFilters);
  }

  resetExploreFilters() {
    this.exploreFilters = {
      query: '',
      danger: 'all',
      habitat: 'all',
      pattern: 'all'
    };
    this.notify('explore_filter_changed', this.exploreFilters);
  }

  getFilteredSpecies() {
    const { query, danger, habitat, pattern } = this.exploreFilters;
    const q = query.trim().toLowerCase();

    return SPECIES_DATA.filter(s => {
      // Query filter
      if (q) {
        const matchName = s.name.toLowerCase().includes(q);
        const matchSci = s.scientificName.toLowerCase().includes(q);
        const matchDiet = s.diet.toLowerCase().includes(q);
        const matchDesc = s.description.toLowerCase().includes(q);
        const matchBadge = s.safetyBadge.toLowerCase().includes(q);
        if (!matchName && !matchSci && !matchDiet && !matchDesc && !matchBadge) {
          return false;
        }
      }

      // Danger filter
      if (danger === 'harmless' && s.dangerLevel === 'venomous') return false;
      if (danger === 'venomous' && s.dangerLevel !== 'venomous') return false;

      // Habitat filter
      if (habitat !== 'all' && !s.habitats.includes(habitat)) return false;

      // Pattern filter
      if (pattern !== 'all' && s.traits.pattern !== pattern) return false;

      return true;
    });
  }

  // Detective Tips
  getCurrentTip() {
    return DETECTIVE_TIPS[this.currentTipIndex];
  }

  nextTip() {
    this.currentTipIndex = (this.currentTipIndex + 1) % DETECTIVE_TIPS.length;
    this.notify('tip_changed', this.getCurrentTip());
    return this.getCurrentTip();
  }

  // Profile & Sighting Logs
  getProfile() {
    return { ...this.profile };
  }

  getAchievements() {
    return ACHIEVEMENTS.map(ach => ({
      ...ach,
      unlocked: this.unlockedBadgeIds.includes(ach.id)
    }));
  }

  unlockBadge(badgeId) {
    if (!this.unlockedBadgeIds.includes(badgeId)) {
      this.unlockedBadgeIds.push(badgeId);
      this.saveAchievements();
      this.notify('badge_unlocked', badgeId);
    }
  }

  addXp(amount) {
    this.profile.xp += amount;
    // Calculate level
    if (this.profile.xp >= 1000) {
      this.profile.level = 5;
      this.profile.title = 'Master Herpetologist';
    } else if (this.profile.xp >= 500) {
      this.profile.level = 4;
      this.profile.title = 'Senior Field Scout';
      this.unlockBadge('master-naturalist');
    } else if (this.profile.xp >= 250) {
      this.profile.level = 3;
      this.profile.title = 'Wildlife Detective';
    } else if (this.profile.xp >= 100) {
      this.profile.level = 2;
      this.profile.title = 'Junior Naturalist';
    } else {
      this.profile.level = 1;
      this.profile.title = 'Cadet Explorer';
    }
    this.saveProfile();
    this.notify('profile_updated', this.profile);
  }

  getSightingLogs() {
    return [...this.sightingLogs];
  }

  addSightingLog({ speciesId, customSpeciesName, location, habitat, notes, photoUrl }) {
    const species = speciesId ? this.getSpeciesById(speciesId) : null;
    const name = species ? species.name : (customSpeciesName || 'Unknown Snake');
    const image = resolveSpeciesImage({ photoUrl, species, speciesId, speciesList: SPECIES_DATA });

    const newLog = {
      id: 'log-' + Date.now(),
      speciesId: species ? species.id : null,
      speciesName: name,
      date: new Date().toISOString(),
      location: location || this.getLocation().name,
      habitat: habitat || (species ? species.primaryHabitat : 'rocks'),
      notes: notes || 'Observed quietly in the field.',
      photoUrl: image,
      xpEarned: 50
    };

    this.sightingLogs.unshift(newLog);
    this.saveLogs();

    // Check unlocks
    this.unlockBadge('first-sighting');
    if (newLog.habitat === 'creek') this.unlockBadge('water-scout');
    if (newLog.habitat === 'canopy') this.unlockBadge('canopy-spotter');

    // Add XP
    this.addXp(50);

    this.notify('log_added', newLog);
    return newLog;
  }

  deleteSightingLog(id) {
    this.sightingLogs = this.sightingLogs.filter(log => log.id !== id);
    this.saveLogs();
    this.notify('log_deleted', id);
  }
}

export const state = new AppState();
