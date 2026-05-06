import type { InventoryItem, GameState, StorageStatus, BulkLotDefinition, CommunityRequest } from "./types";
import { readyStatuses, intakeBacklogStatuses } from "./constants";
import { isInactiveStatus, isReadyStatus, isItemType, clampStat, conditionFromStatus } from "./utils";
import { itemFairValue } from "./gameHelpers";
import { itemQuality } from "./repairHelpers";
import { bulkLotGroups, mixedBulkLot } from "./data";

export function sellOfferValue(item: InventoryItem, state: Pick<GameState, "reputation" | "communityTrust" | "difficulty">): number {
  const fair = itemFairValue(item);
  const difficultyBump = state.difficulty === "Easy" ? 0.02 : state.difficulty === "Hard" ? -0.06 : state.difficulty === "Chaos Mode" ? 0 : 0;
  const trustBump = Math.min(0.1, (state.reputation + state.communityTrust) / 620);
  const readyBump = item.status === "Ready to Sell" ? 0.02 : item.status === "Ready to Donate" ? -0.08 : -0.12;
  return Math.max(1, Math.round(fair * clampStat(0.82 + difficultyBump + trustBump + readyBump, 0.75, 0.95)));
}

// Bulk Buyers: lower per-item value than Business Sales, but only for lots.
// Parts lots can absorb needs-repair gear; normal lots want processed, sellable items.
export function bulkItemValue(item: InventoryItem): number {
  const fair = itemFairValue(item);
  const factor = item.status === "Ready to Sell" || item.condition === "Refurbished" ? 0.85 : item.status === "Needs Repair" ? 0.65 : 0.74;
  return Math.max(1, Math.round(fair * factor));
}

export function businessSaleReason(item: InventoryItem): string {
  if (item.status === "Junked") return "This item is permanently junked. Scrap it for parts.";
  if (isInactiveStatus(item.status)) return `This item is already ${item.status}.`;
  if (item.status !== "Ready to Sell" && item.status !== "Tested") return "Business buyers only want cleaned and tested ready items.";
  const condition = item.condition ?? conditionFromStatus(item.status);
  if (condition === "Broken" || condition === "Needs Parts" || condition === "Unknown") return "Use Bulk Buyers or Scrap for lower-quality items.";
  const quality = itemQuality(item);
  if (quality === "Poor") return "Use Bulk Buyers or Scrap for lower-quality items.";
  return "Ready for Business Sales.";
}

// Items eligible for Business Sales: cleaned, tested, business-ready single items.
export function isBusinessSaleEligible(item: InventoryItem): boolean {
  return businessSaleReason(item) === "Ready for Business Sales.";
}

// Items eligible for normal Bulk Buyers lots: processed and sellable.
export function isBulkEligible(item: InventoryItem): boolean {
  return item.status === "Tested" || item.status === "Ready to Sell" || item.status === "Ready to Donate";
}

export function isPartsLotEligible(item: InventoryItem): boolean {
  return isBulkEligible(item) || item.status === "Needs Repair";
}

export function bulkLotEligibleItems(items: InventoryItem[], lot: BulkLotDefinition): InventoryItem[] {
  return items.filter((item) => {
    if (isInactiveStatus(item.status)) return false;
    if (lot.types && !lot.types.includes(item.type)) return false;
    return lot.partsOnly ? isPartsLotEligible(item) : isBulkEligible(item);
  });
}

export function activeItemCount(inventory: InventoryItem[]): number {
  return inventory.filter((item) => !isInactiveStatus(item.status)).length;
}

export function intakeBacklogCount(inventory: InventoryItem[]): number {
  return inventory.filter((item) => intakeBacklogStatuses.includes(item.status)).length;
}

export function eligibleStatusOptions(item: InventoryItem): StorageStatus[] {
  if (item.status === "Tested") return ["Tested", "Ready to Donate", "Ready to Sell", "Reserved"];
  if (isReadyStatus(item.status)) return ["Ready to Donate", "Ready to Sell", "Reserved"];
  return [item.status];
}

export function matchingItems(state: GameState, request: CommunityRequest): InventoryItem[] {
  if (request.kind !== "item" || !isItemType(request.need)) return [];
  return state.inventory
    .filter((item) => item.type === request.need && isReadyStatus(item.status))
    .sort((a, b) => readyStatuses.indexOf(a.status) - readyStatuses.indexOf(b.status));
}

export function canDonateItem(item: InventoryItem): boolean {
  return item.status === "Tested" || item.status === "Ready to Donate" || item.status === "Ready to Sell";
}

export function cleanButtonReason(item: InventoryItem, state: GameState): string {
  if (item.status === "Deployed to Community") return "This item is already deployed.";
  if (item.status === "Assigned to Lab") return "This item is assigned to the lab.";
  if (item.status === "Scrapped") return "Scrapped items cannot be cleaned.";
  if (item.status !== "Incoming" && item.status !== "Needs Cleaning") return "Item is already cleaned.";
  if (state.energy < 1) return "Not enough energy.";
  return "Clean intake item. Uses 1 energy.";
}

export function testButtonReason(item: InventoryItem, state: GameState): string {
  if (item.status === "Deployed to Community") return "This item is already deployed.";
  if (item.status === "Assigned to Lab") return "This item is assigned to the lab.";
  if (item.status === "Scrapped") return "Scrapped items cannot be tested.";
  if (item.status === "Incoming" || item.status === "Needs Cleaning") return "Clean before testing.";
  if (item.status !== "Cleaned") return "Item already tested.";
  if (state.energy < 1) return "Not enough energy.";
  return "Test cleaned item. Uses 1 energy.";
}

export function donateButtonReason(item: InventoryItem): string {
  if (item.status === "Deployed to Community") return "Already deployed.";
  if (item.status === "Assigned to Lab") return "Assigned to lab.";
  if (item.status === "Junked") return "This item is permanently junked. Scrap it for parts.";
  if (item.status === "Scrapped") return "Already scrapped.";
  if (item.status === "Reserved") return "Already assigned.";
  if (item.status === "Incoming" || item.status === "Needs Cleaning" || item.status === "Cleaned") return "Clean and test first.";
  if (item.status === "Needs Repair") return "Repair before donating.";
  if (item.status === "Tested" || isReadyStatus(item.status)) return "Donate to community.";
  return "Repair before donating.";
}

export function sellButtonReason(item: InventoryItem): string {
  if (item.status === "Deployed to Community") return "Already deployed.";
  if (item.status === "Assigned to Lab") return "Assigned to lab.";
  if (item.status === "Junked") return "This item is permanently junked. Scrap it for parts.";
  if (item.status === "Scrapped") return "Already scrapped.";
  if (item.status === "Incoming" || item.status === "Needs Cleaning" || item.status === "Cleaned") return "Clean and test first.";
  if (item.status === "Needs Repair") return "Repair before selling.";
  if (item.status === "Tested") return "Sell now (mark Ready to Sell first for better price).";
  if (item.status === "Ready to Sell") return "Sell this item.";
  if (item.status === "Ready to Donate" || item.status === "Reserved") return "Mark Ready to Sell first.";
  return "Test before selling.";
}

export function scrapButtonReason(item: InventoryItem): string {
  if (item.status === "Deployed to Community") return "Already deployed.";
  if (item.status === "Assigned to Lab") return "Assigned to lab.";
  if (item.status === "Scrapped") return "Already scrapped.";
  if (item.status === "Junked") return "This item is permanently junked. Scrap it for parts.";
  return "Scrap for parts cash.";
}

export function isReservedStorageItem(item: InventoryItem) {
  return item.status === "Reserved" || item.status === "Assigned to Lab" || item.source?.startsWith("Bulk Buy:");
}

export function stableStorageItemsForDisplay(items: InventoryItem[]) {
  return [
    ...items.filter((item) => !isReservedStorageItem(item)),
    ...items.filter(isReservedStorageItem)
  ];
}

export function bulkLotForItem(item: InventoryItem) {
  return [...bulkLotGroups, mixedBulkLot].find((lot) => bulkLotEligibleItems([item], { ...lot, minItems: 1 }).length > 0) ?? null;
}

