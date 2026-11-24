/**
 * Delivery distance calculation and COD pricing logic
 * Rules:
 *   - Distance 0 to 25 KM: ₹80 extra
 *   - Distance > 25 KM:    ₹300 extra
 *   - Only applied to Cash on Delivery (COD)
 */

export interface DistanceCalculationResult {
  distanceKm: number;
  durationText: string;
  codCharge: number;
  storeAddress: string;
  destinationFormatted: string;
  provider: 'google' | 'nominatim_osrm' | 'haversine_postal' | 'fallback_estimate';
}

export interface DeliveryAddressInput {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Configurable Store Location (User Store: Tiwariganj, Lucknow, UP 226028)
export const DEFAULT_STORE_ADDRESS =
  process.env.STORE_LOCATION_ADDRESS ||
  'Tiwariganj, Lucknow, Uttar Pradesh 226028, India';

// Coordinates for store location (Tiwariganj, Lucknow, UP)
const STORE_LAT = parseFloat(process.env.STORE_LAT || '26.8928');
const STORE_LNG = parseFloat(process.env.STORE_LNG || '81.0664');

/**
 * Determine COD charge based strictly on distance.
 * 0 - 25 KM:  ₹80
 * > 25 KM:    ₹300
 */
export function getCodChargeForDistance(distanceKm: number): number {
  if (distanceKm <= 25) {
    return 80;
  }
  return 300;
}

/**
 * Haversine formula to compute great circle distance between two points in km
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineDistance = R * c;
  // Apply 1.25 road curvature factor for real driving approximation
  return Math.round(straightLineDistance * 1.25 * 10) / 10;
}

/**
 * Fallback estimation using known postal code prefixes in India
 * Store is at Tiwariganj, Lucknow 226028
 */
function estimateDistanceByPostalCode(
  postalCode?: string,
  city?: string,
  state?: string
): number {
  const pin = (postalCode || '').trim().replace(/\s+/g, '');
  const cityLower = (city || '').toLowerCase();
  const stateLower = (state || '').toLowerCase();

  // 1. Exact or Immediate Tiwariganj / Chinhat PIN 226028
  if (pin === '226028') {
    return 2.5; // <= 25 KM (₹80 COD)
  }

  // 2. Lucknow District PIN Codes (all start with 226)
  if (pin.startsWith('226') || cityLower.includes('lucknow')) {
    const lastThree = parseInt(pin.slice(3), 10) || 1;
    // Gomti Nagar (226010), Indira Nagar (226016) are 5-9 km
    if (lastThree === 10 || lastThree === 16) return 7.5;
    // Hazratganj (226001), Charbagh (226004) are 11-14 km
    if (lastThree <= 4) return 12.0;
    // Outer Lucknow regions (226020-226030) are 15-22 km (still <= 25km)
    return Math.min(23.5, 6 + (lastThree % 16));
  }

  // 3. Immediate Neighboring District (Barabanki 225xxx border near Tiwariganj)
  if (pin.startsWith('225') || cityLower.includes('barabanki')) {
    return 21.0; // <= 25 KM (₹80 COD)
  }

  // 4. Neighboring cities in Uttar Pradesh (> 25 KM => ₹300 COD)
  if (pin.startsWith('208') || cityLower.includes('kanpur')) return 88.0; // Kanpur ~88km
  if (pin.startsWith('224') || cityLower.includes('ayodhya') || cityLower.includes('faizabad')) return 120.0;
  if (pin.startsWith('221') || cityLower.includes('varanasi')) return 290.0;
  if (pin.startsWith('211') || cityLower.includes('prayagraj') || cityLower.includes('allahabad')) return 195.0;
  if (pin.startsWith('248') || cityLower.includes('dehradun')) return 540.0;
  if (stateLower.includes('uttar pradesh')) return 110.0;

  // 5. Delhi NCR (~530 km from Lucknow)
  if (pin.startsWith('110') || cityLower.includes('delhi')) return 525.0;
  if (pin.startsWith('2013') || cityLower.includes('noida')) return 510.0;
  if (pin.startsWith('122') || cityLower.includes('gurgaon')) return 540.0;

  // 6. Rest of India (> 25 KM)
  if (pin.startsWith('400') || cityLower.includes('mumbai')) return 1380.0;
  if (pin.startsWith('560') || cityLower.includes('bangalore')) return 1870.0;
  if (pin.startsWith('700') || cityLower.includes('kolkata')) return 980.0;

  // Default outside Lucknow distance
  return 85.0;
}

/**
 * Calculate distance using Google Maps Distance Matrix API
 */
async function calculateGoogleMapsDistance(
  destination: string,
  apiKey: string
): Promise<{ distanceKm: number; durationText: string } | null> {
  try {
    const origin = encodeURIComponent(DEFAULT_STORE_ADDRESS);
    const dest = encodeURIComponent(destination);
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${dest}&key=${apiKey}&units=metric`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();

    if (
      data.status === 'OK' &&
      data.rows?.[0]?.elements?.[0]?.status === 'OK'
    ) {
      const element = data.rows[0].elements[0];
      const distanceMeters = element.distance.value;
      const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
      const durationText = element.duration.text;
      return { distanceKm, durationText };
    }
  } catch (err) {
    console.warn('Google Maps Distance Matrix call failed:', err);
  }
  return null;
}

/**
 * Primary delivery distance calculator
 */
export async function calculateDeliveryDistance(
  address: DeliveryAddressInput
): Promise<DistanceCalculationResult> {
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country || 'India',
  ].filter(Boolean);

  const destinationFormatted = parts.join(', ');

  // 1. Try Google Maps API if key exists
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleApiKey && destinationFormatted) {
    const googleResult = await calculateGoogleMapsDistance(
      destinationFormatted,
      googleApiKey
    );
    if (googleResult) {
      return {
        distanceKm: googleResult.distanceKm,
        durationText: googleResult.durationText,
        codCharge: getCodChargeForDistance(googleResult.distanceKm),
        storeAddress: DEFAULT_STORE_ADDRESS,
        destinationFormatted,
        provider: 'google',
      };
    }
  }

  // 2. Try Nominatim Geocoding + Haversine
  if (address.postalCode || address.city) {
    try {
      const query = address.postalCode
        ? `${address.postalCode}, India`
        : `${address.city}, ${address.state || ''}, India`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            'User-Agent': 'CustomPrintStore/1.0 (contact@printstyle.store)',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (Array.isArray(geoData) && geoData.length > 0) {
          const lat = parseFloat(geoData[0].lat);
          const lon = parseFloat(geoData[0].lon);
          const distanceKm = calculateHaversineDistance(
            STORE_LAT,
            STORE_LNG,
            lat,
            lon
          );
          const hours = Math.round((distanceKm / 40) * 10) / 10;
          const durationText =
            distanceKm <= 25
              ? `${Math.max(30, Math.round(distanceKm * 2.5))} mins`
              : `${Math.ceil(hours * 24)} hours`;

          return {
            distanceKm,
            durationText,
            codCharge: getCodChargeForDistance(distanceKm),
            storeAddress: DEFAULT_STORE_ADDRESS,
            destinationFormatted,
            provider: 'nominatim_osrm',
          };
        }
      }
    } catch {
      // Nominatim failed or offline, fall through to deterministic estimation
    }
  }

  // 3. Fallback deterministic estimation using PIN Code / City
  const distanceKm = estimateDistanceByPostalCode(
    address.postalCode,
    address.city,
    address.state
  );
  const durationText =
    distanceKm <= 25 ? 'Same Day / Next Day' : '2-4 Business Days';

  return {
    distanceKm,
    durationText,
    codCharge: getCodChargeForDistance(distanceKm),
    storeAddress: DEFAULT_STORE_ADDRESS,
    destinationFormatted: destinationFormatted || 'Customer Delivery Address',
    provider: 'fallback_estimate',
  };
}
