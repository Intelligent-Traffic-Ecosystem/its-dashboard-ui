import type { RoadSegment } from "./types";

export interface CameraLocation {
  cameraId: string;
  label: string;
  shortLabel: string;
  lat: number;
  lng: number;
  weight: number;
  vehicleCount: number;
  congestionScore: number;
}

/** 8 Colombo camera locations — mirrors mapFeatureMapper.js coordinates in the BFF */
export const CAMERA_LOCATIONS: CameraLocation[] = [
  {
    cameraId: "cam_01",
    label: "Galle Road – Bambalapitiya",
    shortLabel: "Galle Rd",
    lat: 6.89,
    lng: 79.8553,
    weight: 0.78,
    vehicleCount: 215,
    congestionScore: 78,
  },
  {
    cameraId: "cam_02",
    label: "Kandy Road – Kelaniya Junction",
    shortLabel: "Kandy Rd",
    lat: 6.9549,
    lng: 79.9213,
    weight: 0.55,
    vehicleCount: 148,
    congestionScore: 55,
  },
  {
    cameraId: "cam_03",
    label: "Colombo Fort – Main Street",
    shortLabel: "Fort",
    lat: 6.9344,
    lng: 79.8428,
    weight: 0.62,
    vehicleCount: 175,
    congestionScore: 62,
  },
  {
    cameraId: "cam_04",
    label: "Nugegoda Junction – High Level Rd",
    shortLabel: "Nugegoda",
    lat: 6.8726,
    lng: 79.8989,
    weight: 0.71,
    vehicleCount: 198,
    congestionScore: 71,
  },
  {
    cameraId: "cam_05",
    label: "Rajagiriya Flyover",
    shortLabel: "Rajagiriya",
    lat: 6.9083,
    lng: 79.9022,
    weight: 0.48,
    vehicleCount: 132,
    congestionScore: 48,
  },
  {
    cameraId: "cam_06",
    label: "Maharagama Junction – A4",
    shortLabel: "Maharagama",
    lat: 6.8472,
    lng: 79.9261,
    weight: 0.35,
    vehicleCount: 96,
    congestionScore: 35,
  },
  {
    cameraId: "cam_07",
    label: "Borella – D.S. Senanayake Mawatha",
    shortLabel: "Borella",
    lat: 6.9108,
    lng: 79.8699,
    weight: 0.44,
    vehicleCount: 121,
    congestionScore: 44,
  },
  {
    cameraId: "cam_08",
    label: "Wellawatte – Galle Road South",
    shortLabel: "Wellawatte",
    lat: 6.8729,
    lng: 79.8588,
    weight: 0.66,
    vehicleCount: 183,
    congestionScore: 66,
  },
];

export const ROAD_SEGMENTS: RoadSegment[] = [
  {
    id: "RS-001",
    name: "Galle Road (Col 4–6)",
    congestionPct: 78,
    level: "heavy",
    avgSpeedKmh: 22,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "RS-002",
    name: "High Level Road (Nugegoda)",
    congestionPct: 71,
    level: "heavy",
    avgSpeedKmh: 25,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "RS-003",
    name: "Kandy Road (Kelaniya)",
    congestionPct: 55,
    level: "moderate",
    avgSpeedKmh: 38,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "RS-004",
    name: "Baseline Road (Rajagiriya)",
    congestionPct: 48,
    level: "moderate",
    avgSpeedKmh: 45,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "RS-005",
    name: "Marine Drive (Fort–Bambalapitiya)",
    congestionPct: 62,
    level: "heavy",
    avgSpeedKmh: 30,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "RS-006",
    name: "D.S. Senanayake Mawatha (Borella)",
    congestionPct: 44,
    level: "moderate",
    avgSpeedKmh: 50,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "RS-007",
    name: "A4 Maharagama–Pannipitiya",
    congestionPct: 35,
    level: "moderate",
    avgSpeedKmh: 62,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "RS-008",
    name: "Wellawatte – Galle Road South",
    congestionPct: 66,
    level: "heavy",
    avgSpeedKmh: 28,
    lastUpdated: new Date().toISOString(),
  },
];
