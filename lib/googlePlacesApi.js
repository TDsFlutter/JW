/**
 * Google Places API (New) — Server-only client.
 *
 * Fetches place details and reviews from the official REST endpoint:
 *   GET https://places.googleapis.com/v1/places/{PLACE_ID}
 *
 * Uses the X-Goog-FieldMask header to request only the fields we need,
 * keeping billing costs minimal.
 *
 * @module lib/googlePlacesApi
 */

const PLACES_API_BASE = 'https://places.googleapis.com/v1/places';

/**
 * Fields we request from the Google Places API (New).
 * - displayName        → business name
 * - rating             → overall star rating
 * - userRatingCount    → total number of reviews
 * - reviews            → array of review objects
 * - googleMapsUri      → link to the Google Maps listing
 */
const FIELD_MASK = [
  'displayName',
  'rating',
  'userRatingCount',
  'reviews',
  'googleMapsUri',
].join(',');

/**
 * Fetch place details + reviews from the Google Places API (New).
 *
 * @param {string} placeId  — Google Place ID (e.g. "ChIJ...")
 * @param {string} apiKey   — Google Maps API key with Places API (New) enabled
 * @returns {Promise<{ business: object, reviews: object[] }>}
 */
export async function fetchPlaceReviews(placeId, apiKey) {
  if (!placeId) throw new Error('GOOGLE_PLACE_ID is not configured.');
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not configured.');

  const url = `${PLACES_API_BASE}/${placeId}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    // No caching — this runs server-side in a cron/sync endpoint.
    cache: 'no-store',
  });

  // ---- Error handling ----
  if (!res.ok) {
    const status = res.status;
    let errorBody = '';
    try {
      errorBody = await res.text();
    } catch (_) {
      // ignore parse errors
    }

    if (status === 403) {
      throw new Error(
        `Google Places API returned 403 Forbidden. ` +
        `Ensure your API key has the "Places API (New)" enabled in the Google Cloud Console. ` +
        `Response: ${errorBody}`
      );
    }
    if (status === 429) {
      throw new Error(
        `Google Places API rate limit exceeded (429). Try again later. Response: ${errorBody}`
      );
    }
    if (status === 400) {
      throw new Error(
        `Google Places API bad request (400). Check your Place ID. Response: ${errorBody}`
      );
    }

    throw new Error(
      `Google Places API error (${status}): ${errorBody}`
    );
  }

  const data = await res.json();

  // ---- Normalize business info ----
  const business = {
    placeId,
    businessName: data.displayName?.text || data.displayName || 'Unknown Business',
    rating: data.rating || 0,
    totalReviews: data.userRatingCount || 0,
    googleMapsUri: data.googleMapsUri || '',
  };

  // ---- Normalize reviews ----
  const reviews = (data.reviews || []).map((review) => ({
    placeId,
    authorName: review.authorAttribution?.displayName || 'Anonymous',
    authorPhotoUri: review.authorAttribution?.photoUri || '',
    authorUri: review.authorAttribution?.uri || '',
    rating: review.rating || 0,
    text: review.text?.text || '',
    languageCode: review.text?.languageCode || 'en',
    publishTime: review.publishTime ? new Date(review.publishTime) : new Date(),
    relativeTime: review.relativePublishTimeDescription || '',
  }));

  return { business, reviews };
}
