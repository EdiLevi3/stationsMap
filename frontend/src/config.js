// Application-wide configuration constants

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004';

// Default UTM coordinate input values
export const DEFAULT_UTM_ZONE = '36';
export const DEFAULT_UTM_HEMISPHERE = 'N';

// Radius circles shown around a searched geo location.
// Each entry defines: key (unique id), radiusMeters, color, and label for the UI checkbox.
export const RADIUS_CIRCLE_CONFIGS = [
    { key: '30km', radiusMeters: 30000, color: 'green', label: '30 km' },
    { key: '60km', radiusMeters: 60000, color: 'orange', label: '60 km' },
    { key: '90km', radiusMeters: 90000, color: 'red', label: '90 km' },
];
