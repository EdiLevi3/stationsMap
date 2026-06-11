const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const CARTO_LABELS =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png";

export const FALLBACK_CENTER = [31.5, 34.8];
export const FALLBACK_ZOOM = 8;

export const getBounds = (stations) => {
  if (!stations || stations.length === 0) return null;
  const lats = stations.map((s) => s.location.coordinates[1]);
  const lons = stations.map((s) => s.location.coordinates[0]);
  return [
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)],
  ];
};

export const TILE_LAYERS = [
  {
    name: "Streets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    name: "Hybrid",
    url: ESRI_IMAGERY,
    attribution: "Tiles &copy; Esri",
    overlayUrl: CARTO_LABELS,
    overlayAttribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
];

export const STORAGE_KEY = "mapLayerPreference";
export const DEFAULT_LAYER = "Streets";

export const getStoredLayer = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const validNames = TILE_LAYERS.map((l) => l.name);
  if (stored && validNames.includes(stored)) return stored;
  if (stored) localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_LAYER;
};
