import { Building2 } from "lucide-react";
import type { GameState, LabStationName } from "../types";
import { labProgress, labTierInfo, mapUpgradePhase, capBlockMessage, infrastructureStats } from "../utils";
import { labCapReason, availableLabItems, processedItemCount } from "../gameHelpers";
import { labStationCatalog } from "../data";
import { labTiers } from "../constants";
import { activeItemCount } from "../inventoryHelpers";
import { MilestoneList } from "./MilestoneList";
import { PanelTitle } from "./PanelTitle";

export function BuildLabPanel({
  game,
  stats,
  onUseStorageForLab,
  onBuyLabEquipment,
  onBuyExtraRepair
}: {
  game: GameState;
  stats: ReturnType<typeof infrastructureStats>;
  onUseStorageForLab: (station: LabStationName, itemId: string) => void;
  onBuyLabEquipment: (station: LabStationName) => void;
  onBuyExtraRepair: () => void;
}) {
  const progress = labProgress(game);
  const tier = labTierInfo(progress);
  const phase = mapUpgradePhase(game);
  const capReached = progress >= phase.cap && phase.cap < 100;
  const stationLevels = labStationCatalog.reduce((total, station) => total + (game.labStations[station.name] ?? 0), 0);

  return (
    <>
      <PanelTitle heading={<><Building2 size={19} /> Build the Lab</>} sub={`Lab ${progress}% / Cap ${phase.cap}%`} />
      <p className="missionLine">Tech comes in so it can go back out or build the lab.</p>
      <div className="labProgressBox">
        <div>
          <strong>Lab Tier: {tier.current.name}</strong>
          <span>Total build {progress}% | Map cap {phase.cap}%</span>
        </div>
        <div className="labProgressTrack" aria-label={`Progress to next lab tier ${tier.progressToNext}%`}>
          <span style={{ width: `${tier.progressToNext}%` }} />
        </div>
        <div className="labTierDetails">
          <span>Progress to Next Tier: {tier.progressToNext}%</span>
          <span>Next Tier: {tier.next?.name ?? "Complete"}</span>
          <span>Unlocks: {tier.next?.unlocks ?? tier.current.unlocks}</span>
          <span>Map Gate: {phase.reason}</span>
          {capReached ? <span className="capWarning">{capBlockMessage("Lab", phase.cap)} {phase.next}</span> : <span>Next Cap: {phase.next}</span>}
        </div>
      </div>
      <MilestoneList title="Lab Milestones" tiers={labTiers} progress={progress} cap={phase.cap} />
      <div className="infraMeter">
        <span>{stationLevels}/{labStationCatalog.reduce((total, station) => total + station.maxLevel, 0)} station levels</span>
        <span>Repairs {game.repairsToday}/{stats.repairQueue}</span>
        <span>Storage {activeItemCount(game.inventory)}/{stats.storageCapacity}</span>
        <span>Hosting {stats.hostingCapacity}</span>
        <span>Processed {processedItemCount(game)}</span>
      </div>
      {(() => {
        const purchased = game.extraRepairsPurchasedThisWeek ?? 0;
        const COSTS = [25, 45, 75];
        const nextCost = purchased < 3 ? COSTS[purchased] : null;
        return (
          <div className="extraRepairRow">
            <span>Contract repair help: {purchased}/3 used this week</span>
            {nextCost !== null ? (
              <button onClick={onBuyExtraRepair} disabled={game.cash < nextCost}>
                Hire help (${nextCost}) — frees 1 repair slot today
              </button>
            ) : (
              <span className="capWarning">Maxed for this week. Resets next week.</span>
            )}
          </div>
        );
      })()}
      <div className="stationGrid">
        {labStationCatalog.map((station) => {
          const level = game.labStations[station.name] ?? 0;
          const maxed = level >= station.maxLevel;
          const usableItems = availableLabItems(game, station);
          const assignments = game.labAssignments.filter((assignment) => assignment.station === station.name);
          const capReason = labCapReason(game, station.name);
          return (
            <article className={`stationCard ${capReason ? "locked" : maxed ? "maxed" : level ? "upgraded" : "empty"}`} key={station.name}>
              <div>
                <strong>{station.name}</strong>
                <span>{maxed ? "Maxed" : level ? `Level ${level}` : "Empty"}</span>
              </div>
              <p>{station.description}</p>
              <div className="infraBonuses">
                {station.benefits.map((benefit) => <span key={benefit}>{benefit}</span>)}
              </div>
              <small>
                Assigned: {assignments.length ? assignments.map((assignment) => assignment.itemName).join(", ") : "none"}
              </small>
              {capReason ? <small className="capWarning">{capReason}</small> : null}
              <div className="labActions">
                <div className="labStorageChoices">
                  {usableItems.length ? usableItems.slice(0, 4).map((usableItem) => (
                    <button
                      key={usableItem.id}
                      onClick={() => onUseStorageForLab(station.name, usableItem.id)}
                      disabled={Boolean(capReason) || maxed}
                      title={capReason || `Confirm using ${usableItem.name} from Storage for ${station.name}.`}
                    >
                      Use {usableItem.name}
                    </button>
                  )) : (
                    <button disabled title="Need a cleaned/tested compatible item in Storage.">Use From Storage</button>
                  )}
                  {usableItems.length > 4 ? <small>+{usableItems.length - 4} more compatible item{usableItems.length - 4 === 1 ? "" : "s"} in storage.</small> : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
