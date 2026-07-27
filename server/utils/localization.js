/**
 * Localizes a data object (or array of objects) based on the requested language.
 * Follows the requirement: Return translated content, fallback to English if missing.
 * Optimized for recursive localization of complex structures (Galleries, Itineraries).
 * 
 * @param {Object|Array} data - The data to localize
 * @param {string} lang - The requested language code ('en' or 'am')
 * @returns {Object|Array} - The localized data
 */
const localize = (data, lang = 'en') => {
  if (!data) return data;

  // Handle arrays (e.g., list of tours or itinerary segments)
  if (Array.isArray(data)) {
    return data.map(item => localize(item, lang));
  }

  // Handle objects
  if (typeof data === 'object') {
    // We create a shallow copy first. Use JSON parse/stringify for deep copy if needed, 
    // but here we want to keep references to non-localized primitives.
    const localizedObj = { ...data };

    // 1. Localize known direct fields
    const fieldsToLocalize = ['title', 'name', 'description'];

    fieldsToLocalize.forEach(field => {
      if (localizedObj[field] && typeof localizedObj[field] === 'object' && (localizedObj[field].en || localizedObj[field].am)) {
        const val = localizedObj[field];
        // Requirement: Fallback to English if missing
        localizedObj[field] = val[lang] || val['en'] || '';
      }
    });

    // 2. Specialized Recursion for Itineraries and nested structures
    for (const key in localizedObj) {
      const val = localizedObj[key];
      
      // If it's an array (like itinerary), recurse into each element
      if (Array.isArray(val)) {
        localizedObj[key] = val.map(item => localize(item, lang));
      } 
      // If it's an object and looks like it might have translatable fields, recurse
      else if (val && typeof val === 'object' && !val._bsontype) { // Avoid recursing into MongoDB ObjectIds
        localizedObj[key] = localize(val, lang);
      }
    }

    return localizedObj;
  }

  return data;
};

module.exports = { localize };
