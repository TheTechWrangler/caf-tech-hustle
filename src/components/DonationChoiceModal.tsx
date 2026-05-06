import type { GameState, InventoryItem, DonationDestination, FutureDonationDestination } from "../types";
import { conditionFromStatus, hostingWeeklyPayout } from "../utils";
import { itemFairValue, itemResaleEstimate, scrapValue, infrastructureItemTypesNeeded } from "../gameHelpers";
import { canDonateItem, donateButtonReason, bulkItemValue } from "../inventoryHelpers";
import { PanelTitle } from "./PanelTitle";

function donationDestinationDetail(destination: DonationDestination, game: GameState, item: InventoryItem): string {
  if (destination.kind === "request") {
    const request = destination.request;
    return `Specific request. Trust +${request.trustReward}, Rep +${request.reputationReward}${request.cashDonation ? `, $${request.cashDonation} gift` : ""}.`;
  }
  if (destination.kind === "lab") {
    const level = destination.station.maxLevel;
    return `Accepted types: ${destination.station.acceptedTypes.join(", ")}. Trust +2, Rep +2. Max level ${level}.`;
  }
  if (destination.kind === "infrastructure") {
    const needs = infrastructureItemTypesNeeded(destination.facility).map((need) => need.label).join(" | ");
    return `${needs || "Progresses infrastructure readiness"}. Trust +2, Rep +2.`;
  }
  if (destination.kind === "hosting") return `Completes hosting if setup cash/slots are ready. Pays $${hostingWeeklyPayout(destination.project)}/wk.`;
  const committed = game.inventory.filter((stored) => stored.status === "Reserved" && stored.source === `Bulk Buy: ${destination.lot.label}`);
  const progressAfter = committed.some((stored) => stored.id === item.id) ? committed.length : committed.length + 1;
  if (progressAfter >= destination.lot.minItems) {
    const payoutItems = committed.some((stored) => stored.id === item.id) ? committed : [...committed, item];
    const payout = payoutItems.reduce((sum, stored) => sum + bulkItemValue(stored), 0);
    return `Final item: completes ${destination.lot.label} and pays $${payout}.`;
  }
  return `Progress ${progressAfter}/${destination.lot.minItems}. ${destination.lot.minItems - progressAfter} more needed.`;
}

export function DonationChoiceModal({
  game,
  item,
  destinations,
  futureDestinations,
  onClose,
  onChoose
}: {
  game: GameState;
  item: InventoryItem;
  destinations: DonationDestination[];
  futureDestinations: FutureDonationDestination[];
  onClose: () => void;
  onChoose: (destinationId: string) => void;
}) {
  const generalRep = Math.max(1, Math.ceil(item.rep / 2));
  const generalDisabled = !canDonateItem(item);
  const generalReason = generalDisabled ? donateButtonReason(item) : `General donation completed. Trust +1, Rep +${generalRep}.`;
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Donation destination">
      <section className="modalPanel donationChoiceModal">
        <button className="modalClose" onClick={onClose}>Close</button>
        <PanelTitle heading="Donate / Use Item" sub={item.name} />
        <div className="donationItemSummary">
          <strong>{item.name}</strong>
          <span>{item.type} | {item.condition ?? conditionFromStatus(item.status)} | {item.status}</span>
          <span>Fair ${itemFairValue(item)} | Resale ${itemResaleEstimate(item)} | Scrap ${scrapValue(item)}</span>
        </div>
        <div className="donationOptions">
          <button className="donationOption" onClick={() => onChoose("general")} disabled={generalDisabled} title={generalReason}>
            <strong>General Donate</strong>
            <span>{generalReason}</span>
          </button>
          {destinations.length ? destinations.map((destination) => (
            <button className="donationOption" key={destination.id} onClick={() => onChoose(destination.id)}>
              <strong>{destination.label}</strong>
              <span>{donationDestinationDetail(destination, game, item)}</span>
            </button>
          )) : null}
          {futureDestinations.map((destination) => (
            <button className="donationOption future" key={destination.id} disabled title={destination.reason}>
              <strong>{destination.label}</strong>
              <span>Locked: {destination.reason}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
