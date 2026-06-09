// Parses a free-text location string into { lat, lon }.
// Supports:
//   - Lat/Lon pairs: "32.1, 34.8" or "34.8 32.1"
//   - UTM coordinates: "36 north 667000 3552000", "36N 667000 3552000", "667000 3552000 36N"

import proj4 from 'proj4';

const LAT_LON_PATTERN = /[-+]?\d+(?:\.\d+)?/g;

const UTM_ZONE_FIRST_PATTERN =
    /^(\d{1,2})\s*([C-HJ-NP-X]|NORTH|SOUTH|N|S)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/;

const UTM_ZONE_LAST_PATTERN =
    /^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d{1,2})\s*([C-HJ-NP-X]|NORTH|SOUTH|N|S)$/;

const SOUTH_BANDS = 'CDEFGHJKLM';
const NORTH_BANDS = 'NPQRSTUVWX';

export const parseLocationToLatLon = (inputText) => {
    if (typeof inputText !== 'string' || !inputText.trim()) {
        return null;
    }

    const text = inputText.trim();

    return tryParseUtm(text) || tryParseLatLon(text) || null;
};

const tryParseLatLon = (text) => {
    const nums = text.match(LAT_LON_PATTERN);
    if (!nums || nums.length !== 2) return null;

    const a = Number(nums[0]);
    const b = Number(nums[1]);

    if (isValidLat(a) && isValidLon(b)) return { lat: a, lon: b };
    if (isValidLon(a) && isValidLat(b)) return { lat: b, lon: a };

    return null;
};

const tryParseUtm = (text) => {
    const normalized = text
        .trim()
        .toUpperCase()
        .replace(/,/g, ' ')
        .replace(/\s+/g, ' ');

    // 36N 667000 3552000 / 36 N 667000 3552000 / 36 NORTH 667000 3552000
    let m = normalized.match(UTM_ZONE_FIRST_PATTERN);
    if (m) {
        return utmToLatLon(Number(m[1]), m[2], Number(m[3]), Number(m[4]));
    }

    // 667000 3552000 36N / 667000 3552000 36 N
    m = normalized.match(UTM_ZONE_LAST_PATTERN);
    if (m) {
        return utmToLatLon(Number(m[3]), m[4], Number(m[1]), Number(m[2]));
    }

    return null;
};

const utmToLatLon = (zone, hemi, easting, northing) => {
    if (!Number.isInteger(zone) || zone < 1 || zone > 60) return null;

    const hemisphere = normalizeHemisphere(hemi);
    if (!hemisphere) return null;

    const utmProj = `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs${
        hemisphere === 'S' ? ' +south' : ''
    }`;

    try {
        const [lon, lat] = proj4(utmProj, 'EPSG:4326', [easting, northing]);
        if (!isValidLat(lat) || !isValidLon(lon)) return null;
        return { lat, lon };
    } catch (e) {
        return null;
    }
};

const normalizeHemisphere = (hemi) => {
    const h = String(hemi).toUpperCase();
    if (h === 'N' || h === 'NORTH') return 'N';
    if (h === 'S' || h === 'SOUTH') return 'S';
    if (SOUTH_BANDS.includes(h)) return 'S';
    if (NORTH_BANDS.includes(h)) return 'N';
    return null;
};

const isValidLat = (x) => Number.isFinite(x) && x >= -90 && x <= 90;
const isValidLon = (x) => Number.isFinite(x) && x >= -180 && x <= 180;
