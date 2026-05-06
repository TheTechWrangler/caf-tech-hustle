import type { GameState, DistrictName, LocationName } from "./types";
import { shopLocations, coreMarketLocations, districtLocations } from "./constants";
import { districtCatalog } from "./data";
import { progressMeets } from "./utils";

export function districtMarketStores(district: DistrictName): LocationName[] {
  return (districtLocations[district] ?? []).filter((location) => shopLocations.includes(location));
}

export function marketLocationsForDistricts(unlockedDistricts: DistrictName[]): LocationName[] {
  const seen = new Set<LocationName>();
  const unlockedMarketLocations: LocationName[] = [];
  districtCatalog.forEach((district) => {
    if (!unlockedDistricts.includes(district.name)) return;
    districtMarketStores(district.name).forEach((location) => {
      if (seen.has(location)) return;
      seen.add(location);
      unlockedMarketLocations.push(location);
    });
  });
  return unlockedMarketLocations.length ? unlockedMarketLocations : coreMarketLocations.filter((location) => shopLocations.includes(location));
}

export function locationToDistrict(location: LocationName): DistrictName {
  for (const [district, locs] of Object.entries(districtLocations) as [DistrictName, LocationName[]][]) {
    if (locs.includes(location)) return district;
  }
  return "Neighborhood";
}

export function districtForMarketLocation(location: LocationName): DistrictName {
  const district = districtCatalog.find((entry) => districtMarketStores(entry.name).includes(location));
  return district?.name ?? locationToDistrict(location);
}

export function unlockedDistrictsWithoutMarketStores(unlockedDistricts: DistrictName[]): DistrictName[] {
  return districtCatalog
    .filter((district) => unlockedDistricts.includes(district.name))
    .filter((district) => district.name !== "Garage" && districtMarketStores(district.name).length === 0)
    .map((district) => district.name);
}

export function checkDistrictUnlocks(state: GameState, prog: number): { newDistricts: DistrictName[]; messages: string[] } {
  const newDistricts: DistrictName[] = [];
  const messages: string[] = [];
  for (const district of districtCatalog) {
    if (state.unlockedDistricts.includes(district.name)) continue;
    const req = district.unlockRequirements;
    if (req.communityTrust !== undefined && state.communityTrust < req.communityTrust) continue;
    if (req.reputation !== undefined && state.reputation < req.reputation) continue;
    if (req.completedRequests !== undefined && state.completedRequests < req.completedRequests) continue;
    if (req.labProgress !== undefined && !progressMeets(prog, req.labProgress)) continue;
    newDistricts.push(district.name);
    messages.push(`[ DISTRICT UNLOCKED ] ${district.name}: ${district.unlockMessage}`);
  }
  return { newDistricts, messages };
}
