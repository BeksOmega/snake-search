/**
 * SlitherScope - Centralized Species-Aware Media Resolution Utility
 * Handles species image resolution, iNaturalist default photos, and SVG fallbacks.
 */

export const SVG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23d8f2ff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2300628c'%3E🐍 SlitherScope Reptile%3C/text%3E%3C/svg%3E";

/**
 * Checks if a URL points to an unverified third-party stock media host (such as Unsplash).
 * @param {string} url
 * @returns {boolean}
 */
export function isUnverifiedStockUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return lower.includes('unsplash.com') || lower.includes('pexels.com') || lower.includes('pixabay.com');
}

/**
 * Centralized species-aware media resolution utility.
 * Resolves an image URL for sighting logs, map cards, species cards, and detail modals.
 *
 * @param {Object} options
 * @param {string} [options.photoUrl] - User-uploaded or custom photo URL
 * @param {Object} [options.species] - Species object from local dataset (with imageUrl)
 * @param {Object} [options.taxon] - iNaturalist API taxon object (with default_photo)
 * @param {string} [options.speciesId] - ID of species to look up if species object not provided
 * @param {Array} [options.speciesList] - List of species dataset entries for ID lookup
 * @returns {string} Resolved image URL or SVG_FALLBACK
 */
export function resolveSpeciesImage({ photoUrl, species, taxon, speciesId, speciesList } = {}) {
  // 1. If user provided a custom photo URL that is valid and not an unverified stock URL
  if (photoUrl && typeof photoUrl === 'string' && photoUrl.trim() !== '' && !isUnverifiedStockUrl(photoUrl)) {
    return photoUrl.trim();
  }

  // 2. If iNaturalist taxon object has a valid default photo
  if (taxon && taxon.default_photo) {
    const defaultUrl = taxon.default_photo.medium_url || taxon.default_photo.url;
    if (defaultUrl && !isUnverifiedStockUrl(defaultUrl)) {
      return defaultUrl.replace('square', 'medium').replace('small', 'medium');
    }
  }

  // 3. Resolve from species object or speciesId lookup
  let sp = species;
  if (!sp && speciesId && Array.isArray(speciesList)) {
    sp = speciesList.find(s => s.id === speciesId);
  }
  if (sp && sp.imageUrl && !isUnverifiedStockUrl(sp.imageUrl)) {
    return sp.imageUrl;
  }

  // 4. Default to SVG_FALLBACK
  return SVG_FALLBACK;
}

/**
 * Queries the iNaturalist API for a verified default photo for a given species name or taxon ID.
 * @param {string|number} taxonIdOrName
 * @returns {Promise<string>}
 */
export async function fetchSpeciesDefaultPhoto(taxonIdOrName) {
  if (!taxonIdOrName) return SVG_FALLBACK;
  try {
    const isId = typeof taxonIdOrName === 'number' || /^\d+$/.test(taxonIdOrName);
    const url = isId
      ? `https://api.inaturalist.org/v1/taxa/${taxonIdOrName}`
      : `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(taxonIdOrName)}&per_page=1`;

    const resp = await fetch(url);
    if (!resp.ok) return SVG_FALLBACK;
    const data = await resp.json();
    const results = data.results || (data.id ? [data] : []);
    if (results.length > 0 && results[0].default_photo) {
      const photoUrl = results[0].default_photo.medium_url || results[0].default_photo.url;
      if (photoUrl && !isUnverifiedStockUrl(photoUrl)) {
        return photoUrl.replace('square', 'medium').replace('small', 'medium');
      }
    }
  } catch (err) {
    console.warn('Failed to fetch species default photo from iNaturalist:', err);
  }
  return SVG_FALLBACK;
}
