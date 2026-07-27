/**
 * Predefined message templates for recommendation explanations
 */
const templates = {
  INTEREST: [
    "Matches your interest in {{category}}.",
    "Specifically picked because you enjoy {{category}} tours.",
    "A great fit for your love of {{category}}.",
  ],
  LOCATION: [
    "Located in your preferred region of {{woreda}}.",
    "Conveniently close to destinations you've visited in {{woreda}}.",
    "Explore more of what {{woreda}} has to offer.",
  ],
  BUDGET: [
    "Perfectly fits your typical budget range.",
    "Great value based on your previous bookings.",
    "Alings with your preferred spending level.",
  ],
  RATING: [
    "Exceptionally high ratings from other travelers.",
    "A community favorite with top-tier reviews.",
    "Highly recommended by the Kambata Zone community.",
  ],
  POPULARITY: [
    "Currently trending among the community.",
    "One of our most-booked experiences right now.",
    "A popular choice that fellow travelers are loving.",
  ],
  FRESHNESS: [
    "New discovery: Recently added to the platform.",
    "Be among the first to explore this new tour!",
    "Fresh inventory: A new experience we think you'll love.",
  ],
  DEFAULT: [
    "A highly rated experience we think you'll enjoy.",
    "Specially selected for you based on platform trends.",
  ],
  // Negative Factors (Helpful transparency for why it's not at the top)
  PRICE_HIGH: [
    "might be slightly outside your typical budget range",
    "is priced higher than your previous bookings",
  ],
  DURATION_LONG: [
    "is optimized for a longer adventure than your typical preference",
    "offers a more extended experience than your usual trip length",
  ],
  LOW_RATING: [
    "is currently rated slightly lower by the community than our top picks",
    "has reviews that are currently developing towards our recommended threshold",
  ],
  INTEREST_MISMATCH: [
    "focuses on {{category}} tours, which is a bit different from your favorites",
    "offers a {{category}} experience, while you usually prefer other types",
  ],
  LOCATION_MISMATCH: [
    "operates in {{woreda}}, which is outside your primary exploration zone",
    "is located in {{woreda}}, inviting you to a different part of the region",
  ],
  LOW_POPULARITY: [
    "is a quieter gem with less platform visibility than our trending tours",
    "is currently being discovered by fewer travelers than our best-sellers",
  ],
};

/**
 * Get a human-readable explanation from templates
 * @param {string} category - The factor category
 * @param {Object} context - Optional data for interpolation (e.g. { category: 'Adventure' })
 */
const getTemplate = (category, context = {}) => {
  const categoryTemplates = templates[category] || templates.DEFAULT;
  const randomIndex = Math.floor(Math.random() * categoryTemplates.length);
  let template = categoryTemplates[randomIndex];

  // Simple interpolation: replace {{key}} with context[key]
  Object.keys(context).forEach((key) => {
    template = template.replace(`{{${key}}}`, context[key]);
  });

  return template;
};

module.exports = {
  getTemplate,
};
