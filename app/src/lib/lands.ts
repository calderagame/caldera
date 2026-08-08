/** Must match CalderaGame — IDs are 1..LAND_COUNT (never 0). */
export const LAND_COUNT = 7;
export const LAND_ID_MIN = 1;

export type Continent = {
  id: number;
  code: string;
  name: string;
  lat: number;
  lon: number;
  radiusDeg: number;
  accent: string;
};

export const CONTINENTS: Continent[] = [
  { id: 1, code: "EMB", name: "Ember", lat: 8, lon: 22, radiusDeg: 28, accent: "#FF6A00" },
  { id: 2, code: "ASH", name: "Ashfall", lat: -82, lon: 0, radiusDeg: 22, accent: "#D84A05" },
  { id: 3, code: "RDG", name: "Ridge", lat: 40, lon: 95, radiusDeg: 34, accent: "#FF8A3D" },
  { id: 4, code: "BSN", name: "Basin", lat: 52, lon: 20, radiusDeg: 18, accent: "#C43E04" },
  { id: 5, code: "CRN", name: "Crown", lat: 48, lon: -100, radiusDeg: 30, accent: "#E85A10" },
  { id: 6, code: "FRG", name: "Forge", lat: -15, lon: -58, radiusDeg: 26, accent: "#FF6A00" },
  { id: 7, code: "SPR", name: "Spire", lat: -23, lon: 138, radiusDeg: 22, accent: "#D84A05" },
];

export const LAND_COLORS = {
  void: "#070707",
  ocean: "#0a0a0a",
  land: "#161616",
  copper: "#FF6A00",
  gold: "#FF8A3D",
  green: "#54D27A",
  blue: "#D84A05",
  orange: "#FF6A00",
  red: "#B33A1A",
  type: "#F3F1EC",
} as const;

export function continentAccent(id: number): string {
  return getContinent(id)?.accent ?? LAND_COLORS.land;
}

export const OWNER_PALETTE = [
  LAND_COLORS.copper,
  LAND_COLORS.gold,
  LAND_COLORS.green,
  LAND_COLORS.blue,
  "#FF8A3D",
] as const;

export function landWeight(landId: number) {
  return 80 + (landId % 41);
}

export function ownerColor(owner: string | undefined): string {
  if (!owner || owner === "0x0000000000000000000000000000000000000000") {
    return LAND_COLORS.land;
  }
  const n = Number.parseInt(owner.slice(2, 10), 16);
  return OWNER_PALETTE[n % OWNER_PALETTE.length];
}

export function getContinent(id: number): Continent | undefined {
  return CONTINENTS.find((c) => c.id === id);
}

export function formatLandId(id: number) {
  return getContinent(id)?.name ?? `Land ${id}`;
}

export function formatLandCode(id: number) {
  return getContinent(id)?.code ?? `L-${id}`;
}

export function isValidLandId(id: number) {
  return id >= LAND_ID_MIN && id <= LAND_COUNT;
}

export type TerritoryStatus = "owned" | "contested" | "neutral" | "burning";

export function territoryStatus(
  owner: string | undefined,
  seizeCount: number,
): TerritoryStatus {
  if (!owner || owner === "0x0000000000000000000000000000000000000000") {
    return "neutral";
  }
  if (seizeCount >= 5) return "burning";
  if (seizeCount >= 2) return "contested";
  return "owned";
}
