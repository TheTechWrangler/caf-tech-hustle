import type { GameState, InventoryItem, LabStationName, InfrastructureDefinition, HostingProjectDefinition } from "../types";
import "./OperationsDashboard.css";
import { infrastructureStats, conditionFromStatus, isInactiveStatus, labProgress, hostingWeeklyPayout, statusClass } from "../utils";
import { itemArt } from "../assets/itemArt";
import {
  itemOperationTags, demandMatchesItem,
  availableLabItems, labCapReason,
  infrastructureItemTypesNeeded, matchingStorageForTypes,
  infrastructureCapReason, infrastructureUnlocked, requirementLabels,
  hostingProjectAvailability, hostingProjectStateFor, hostingSlotUnlockText,
  itemFairValue, itemResaleEstimate, scrapValue
} from "../gameHelpers";
import {
  isBusinessSaleEligible, stableStorageItemsForDisplay, bulkLotForItem,
  canDonateItem, cleanButtonReason, testButtonReason,
  donateButtonReason, sellButtonReason, scrapButtonReason
} from "../inventoryHelpers";
import { repairButtonReason, businessOfferForItem } from "../repairHelpers";
import { labStationCatalog, infrastructureCatalog, hostingProjectCatalog } from "../data";
import { MatchingItemButtons } from "./MatchingItemButtons";
import { PanelTitle } from "./PanelTitle";

export function OperationsDashboard({
  game,
  activeItems,
  selectedItemId,
  selectedDemand,
  onSelectItem,
  onSelectDemand,
  onClean,
  onTest,
  onRepair,
  onDonate,
  onSell,
  onScrap,
  onBusinessSale,
  onAddToBulkBuy,
  onUseStorageForLab,
  onBuyLabEquipment,
  onBuyInfrastructure,
  onStageInfrastructureItem,
  onCompleteHosting
}: {
  game: GameState;
  activeItems: InventoryItem[];
  selectedItemId: string | null;
  selectedDemand: string | null;
  onSelectItem: (id: string | null) => void;
  onSelectDemand: (id: string | null) => void;
  onClean: (item: InventoryItem) => void;
  onTest: (item: InventoryItem) => void;
  onRepair: (item: InventoryItem) => void;
  onDonate: (item: InventoryItem) => void;
  onSell: (item: InventoryItem) => void;
  onScrap: (item: InventoryItem) => void;
  onBusinessSale: (item: InventoryItem) => void;
  onAddToBulkBuy: (item: InventoryItem) => void;
  onUseStorageForLab: (station: LabStationName, itemId: string) => void;
  onBuyLabEquipment: (station: LabStationName) => void;
  onBuyInfrastructure: (facility: InfrastructureDefinition) => void;
  onStageInfrastructureItem: (facility: InfrastructureDefinition, item: InventoryItem) => void;
  onCompleteHosting: (project: HostingProjectDefinition) => void;
}) {
  const selectedItem = activeItems.find((item) => item.id === selectedItemId) ?? null;
  const storageItems = stableStorageItemsForDisplay(activeItems);
  const labNeeds = labStationCatalog.filter((station) => (game.labStations[station.name] ?? 0) < station.maxLevel);
  const infraNeeds = infrastructureCatalog.filter((facility) => (game.ownedInfrastructure[facility.name] ?? 0) < facility.maxLevel);
  const hostingNeeds = hostingProjectCatalog.filter((project) => hostingProjectStateFor(game, project.id).status === "Inactive");
  const unifiedNeeds = [
    ...labNeeds.map((station) => {
      const matches = availableLabItems(game, station);
      const capReason = labCapReason(game, station.name);
      const level = game.labStations[station.name] ?? 0;
      return {
        key: `lab:${station.name}`,
        category: "Lab",
        title: station.name,
        status: capReason ? "Locked" : matches.length ? "Ready" : "Partial",
        sort: capReason ? 2 : matches.length ? 0 : 1,
        progress: `L${level}/${station.maxLevel}`,
        requirement: station.acceptedTypes.join(", "),
        benefit: station.benefits.join(" + "),
        locked: capReason,
        matches,
        action: (item: InventoryItem) => onUseStorageForLab(station.name, item.id),
        actionLabel: "Use for Lab"
      };
    }),
    ...infraNeeds.map((facility) => {
      const needs = infrastructureItemTypesNeeded(facility);
      const matches = needs.flatMap((need) => matchingStorageForTypes(activeItems, need.types));
      const capReason = infrastructureCapReason(game, facility.name);
      const unlocked = infrastructureUnlocked(game, facility);
      const level = game.ownedInfrastructure[facility.name] ?? 0;
      const reqText = requirementLabels(facility.requirements).join(" | ");
      const locked = capReason || (!unlocked ? `Locked: ${reqText || "meet Infrastructure requirements first"}` : "");
      return {
        key: `infra:${facility.name}`,
        category: "Infrastructure",
        title: facility.name,
        status: locked ? "Locked" : matches.length ? "Ready" : "Partial",
        sort: locked ? 2 : matches.length ? 0 : 1,
        progress: `L${level}/${facility.maxLevel}`,
        requirement: needs.length ? needs.map((need) => need.label).join(" | ") : (reqText || "cash/map gate"),
        benefit: facility.description,
        locked,
        matches,
        action: (item: InventoryItem) => onStageInfrastructureItem(facility, item),
        actionLabel: "Use for Infrastructure"
      };
    }),
    ...hostingNeeds.map((project) => {
      const availability = hostingProjectAvailability(game, project);
      const matches = project.requiredEquipment.flatMap((need) => matchingStorageForTypes(activeItems, need.types));
      return {
        key: `hosting:${project.id}`,
        category: "Hosting",
        title: project.name,
        status: availability.canComplete ? "Ready" : matches.length ? "Partial" : "Locked",
        sort: availability.canComplete ? 0 : matches.length ? 1 : 2,
        progress: `$${hostingWeeklyPayout(project)}/wk`,
        requirement: project.requiredEquipment.map((need) => need.label).join(" | "),
        benefit: project.riskNote ?? "Recurring weekly hosting revenue.",
        locked: availability.canComplete ? "" : `Locked: ${availability.missing || hostingSlotUnlockText(game)}`,
        matches,
        action: () => onCompleteHosting(project),
        actionLabel: "Complete Hosting"
      };
    })
  ].sort((a, b) => a.sort - b.sort || a.category.localeCompare(b.category));

  return (
    <div className="opsDashboardGrid">
      <aside className="opsStoragePanel">
        <PanelTitle heading="Storage Supply" sub={`${activeItems.length} active`} />
        {selectedItem ? (
          <div className="opsSelectedUse">
            <strong>{selectedItem.name}</strong>
            <span>{itemOperationTags(selectedItem, game).join(" | ") || "No current demand matches"}</span>
          </div>
        ) : null}
        <div className="opsStorageList">
          {storageItems.length ? storageItems.map((item) => {
            const selected = item.id === selectedItemId;
            const highlighted = demandMatchesItem(item, selectedDemand, game);
            const cleanReason = cleanButtonReason(item, game);
            const testReason = testButtonReason(item, game);
            const repairReason = repairButtonReason(item, game, infrastructureStats(game.ownedInfrastructure, game.labStations));
            const bulkLot = bulkLotForItem(item);
            const reservedBulk = item.status === "Reserved" && item.source?.startsWith("Bulk Buy:");
            const donateReason = donateButtonReason(item);
            const sellReason = sellButtonReason(item);
            const scrapReason = scrapButtonReason(item);
            const donationReason = canDonateItem(item)
              ? "Open donation/use options: General Donate, requests, Lab, Infrastructure, Hosting, or Bulk Buy when valid."
              : donateReason;

            // Context-sensitive primary action: Clean → Test → Repair → null
            const canClean  = cleanReason  === "Clean intake item. Uses 1 energy.";
            const canTest   = testReason   === "Test cleaned item. Uses 1 energy.";
            const canRepair = repairReason === "Repairs use 1 repair slot and energy.";
            const primaryLabel  = canClean ? "Clean" : canTest ? "Test" : canRepair ? "Repair" : "Ready";
            const primaryTitle  = canClean ? cleanReason : canTest ? testReason : canRepair ? repairReason : "No processing action available";
            const primaryAction = canClean ? onClean : canTest ? onTest : canRepair ? onRepair : null;
            const canBusinessSale = isBusinessSaleEligible(item);
            const bizOffer = canBusinessSale ? businessOfferForItem(item, game, labProgress(game)) : null;

            return (
              <article className={`opsStorageItem ${selected ? "selected" : ""} ${highlighted ? "highlighted" : ""}`} key={item.id} onClick={() => onSelectItem(selected ? null : item.id)}>
                <div className="opsCardLayout">
                  <div className="opsCardTop">
                    <div className="opsArtZone">
                      {itemArt[item.type]
                        ? <img src={itemArt[item.type]} alt={item.type} className="opsArtThumb" />
                        : null}
                    </div>
                    <div className="opsCardIdentity">
                      <strong className="opsCardName">{item.name}</strong>
                      <div className="opsCardBadges">
                        <span className={`statusPill ${statusClass(item.status)}`}>{item.status}</span>
                        <span className="opsBadge opsBadgeType">{item.type}</span>
                        <span className="opsBadge">{item.condition ?? conditionFromStatus(item.status)}</span>
                      </div>
                    </div>
                  </div>

                  {itemOperationTags(item, game).length > 0 && (
                    <div className="opsTags">
                      {itemOperationTags(item, game).map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                  )}
                  {reservedBulk ? <small className="capWarning">{item.source}</small> : null}

                  <div className="opsValueGrid">
                    <span>Fair <strong>${itemFairValue(item)}</strong></span>
                    <span>Sell <strong>${itemResaleEstimate(item)}</strong></span>
                    <span>Scrap <strong>${scrapValue(item)}</strong></span>
                    <span className={canBusinessSale && bizOffer ? "opsBizValue" : "opsValueMuted"}>
                      Biz <strong>{canBusinessSale && bizOffer ? `$${bizOffer.value}` : "N/A"}</strong>
                    </span>
                  </div>

                  <div className="opsCardActions">
                    <button
                      className="opsPrimary opsActionPrimary"
                      title={primaryTitle}
                      disabled={!primaryAction}
                      onClick={(event) => { event.stopPropagation(); primaryAction?.(item); }}
                    >{primaryLabel}</button>
                    {canBusinessSale && bizOffer ? (
                      <button className="opsBizSale" title={bizOffer.label} onClick={(event) => { event.stopPropagation(); onBusinessSale(item); }}>
                        Biz Sale <strong>${bizOffer.value}</strong>
                      </button>
                    ) : null}
                    <div className="opsActionsSec">
                      <button title={donationReason} onClick={(event) => { event.stopPropagation(); onDonate(item); }}>Donate</button>
                      <button title={sellReason} onClick={(event) => { event.stopPropagation(); onSell(item); }} disabled={item.status !== "Ready to Sell" && item.status !== "Tested"}>Sell</button>
                      <button title={scrapReason} className="rowScrap" onClick={(event) => { event.stopPropagation(); onScrap(item); }} disabled={isInactiveStatus(item.status)}>Scrap</button>
                    </div>
                  </div>
                </div>
              </article>
            );
          }) : <div className="emptyZone">Storage is empty. Source tech from Market or donations.</div>}
        </div>
      </aside>
      <section className="opsUnifiedNeedsPanel">
        <PanelTitle heading="Unified Needs" sub="Lab | Infrastructure | Hosting" />
        <div className="opsDemandBody">
          {unifiedNeeds.map((need) => (
            <article className={`opsDemandCard ${need.status.toLowerCase()}`} key={need.key} onMouseEnter={() => onSelectDemand(need.key)}>
              <div><strong>{need.title}</strong><span>{need.category} | {need.status}</span></div>
              <p>{need.requirement}</p>
              <small>{need.progress} | {need.benefit}</small>
              {need.locked ? <small className="capWarning">{need.locked}</small> : null}
              {need.category === "Hosting" && need.status === "Ready" ? (
                <button onClick={() => need.action(need.matches[0])}>{need.actionLabel}</button>
              ) : need.locked ? (
                <small>Matching storage is useful later, but this destination is not unlocked yet.</small>
              ) : (
                <MatchingItemButtons items={need.matches} empty="No matching storage items yet." onUse={need.action} action={need.actionLabel} />
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
