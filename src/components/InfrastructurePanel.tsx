import { Building2 } from "lucide-react";
import type { GameState, InfrastructureDefinition, InventoryItem } from "../types";
import { infrastructureProgress, infrastructureTierInfo, mapUpgradePhase, capBlockMessage, labProgress, labMilestone, infrastructureStats } from "../utils";
import { infrastructureUnlocked, infrastructureCapReason, requirementLabels, matchingStorageForTypes, infrastructureItemTypesNeeded, unmetInfrastructureRequirements } from "../gameHelpers";
import { infrastructureCatalog } from "../data";
import { infrastructureTiers } from "../constants";
import { activeItemCount } from "../inventoryHelpers";
import { MilestoneList } from "./MilestoneList";
import { PanelTitle } from "./PanelTitle";

export function InfrastructurePanel({
  game,
  stats,
  hostingUsed,
  avgUptime,
  onBuyUpgrade,
  onStageItem
}: {
  game: GameState;
  stats: ReturnType<typeof infrastructureStats>;
  hostingUsed: number;
  avgUptime: number;
  onBuyUpgrade: (facility: InfrastructureDefinition) => void;
  onStageItem: (facility: InfrastructureDefinition, item: InventoryItem) => void;
}) {
  const progress = infrastructureProgress(game);
  const tier = infrastructureTierInfo(progress);
  const phase = mapUpgradePhase(game);
  const capReached = progress >= phase.cap && phase.cap < 100;
  return (
    <>
      <PanelTitle heading={<><Building2 size={19} /> Infrastructure</>} sub={`Infra ${progress}% / Cap ${phase.cap}%`} />
      <div className="labProgressBox">
        <div>
          <strong>Infrastructure Tier: {tier.current.name}</strong>
          <span>Upkeep ${stats.upkeep}/wk | Map cap {phase.cap}%</span>
        </div>
        <div className="labProgressTrack" aria-label={`Progress to next infrastructure tier ${tier.progressToNext}%`}>
          <span style={{ width: `${tier.progressToNext}%` }} />
        </div>
        <div className="labTierDetails">
          <span>Progress to Next Tier: {tier.progressToNext}%</span>
          <span>Next Tier: {tier.next?.name ?? "Complete"}</span>
          <span>Unlocks: {tier.next?.unlocks ?? tier.current.unlocks}</span>
          <span>Map Gate: {phase.reason}</span>
          {capReached ? <span className="capWarning">{capBlockMessage("Infrastructure", phase.cap)} {phase.next}</span> : <span>Next Cap: {phase.next}</span>}
        </div>
      </div>
      <MilestoneList title="Infrastructure Milestones" tiers={infrastructureTiers} progress={progress} cap={phase.cap} />
      <div className="infraMeter">
        <span>Total Lab Build {labProgress(game)}%</span>
        <span>Infrastructure {progress}%</span>
        <span>Lab Tier {labMilestone(labProgress(game))}</span>
        <span>Storage {activeItemCount(game.inventory)}/{stats.storageCapacity}</span>
        <span>Repair {game.repairsToday}/{stats.repairQueue}</span>
        <span>Hosting {hostingUsed}/{stats.hostingCapacity}</span>
        <span>Uptime {avgUptime}%</span>
      </div>
      {game.hostedServices.length ? (
        <div className="hostedStrip">
          {game.hostedServices.map((service) => (
            <span key={service.id}>{service.title}: {Math.round(service.uptime)}%</span>
          ))}
        </div>
      ) : null}
      <div className="infraList">
        {infrastructureCatalog.map((facility) => {
          const level = game.ownedInfrastructure[facility.name] ?? 0;
          const unlocked = infrastructureUnlocked(game, facility);
          const maxed = level >= facility.maxLevel;
          const reqs = requirementLabels(facility.requirements);
          const capReason = infrastructureCapReason(game, facility.name);
          return (
            <article className={`infraCard ${capReason ? "locked" : level ? "owned" : unlocked ? "available" : "locked"}`} key={facility.name}>
              <div>
                <strong>{facility.name}</strong>
                <span>{level ? `Level ${level}/${facility.maxLevel}` : unlocked ? "Available" : "Locked"}</span>
              </div>
              <p>{facility.description}</p>
              <div className="infraBonuses">
                <span>Upkeep ${facility.upkeep}</span>
                <span>Store +{facility.storageBonus}</span>
                <span>Repair +{facility.repairBonus}</span>
                <span>Host +{facility.hostingBonus}</span>
                <span>Reliability +{facility.reliabilityBonus}</span>
              </div>
              {!unlocked ? (
                <div className="unmetReqs">
                  <small className="unmetReqsLabel">Still needed:</small>
                  {unmetInfrastructureRequirements(game, facility.requirements).map((row, i) => (
                    <small key={i} className="unmetReqRow">– {row}</small>
                  ))}
                </div>
              ) : (
                reqs.length ? <small>Req: {reqs.join(" | ")}</small> : <small>Req: none</small>
              )}
              {capReason ? <small className="capWarning">{capReason}</small> : null}
              {infrastructureItemTypesNeeded(facility).map((need) => {
                const matches = matchingStorageForTypes(game.inventory, need.types).slice(0, 3);
                if (!matches.length) return null;
                return (
                  <div key={need.label} className="labStorageChoices">
                    {matches.map((item) => (
                      <button key={item.id} onClick={() => onStageItem(facility, item)} title={`Use ${item.name} for ${facility.name}`}>
                        Use {item.name} from Storage
                      </button>
                    ))}
                  </div>
                );
              })}
              <button
                onClick={() => onBuyUpgrade(facility)}
                disabled={Boolean(capReason) || !unlocked || maxed}
                title={capReason || (unlocked ? `${level ? "Upgrade" : "Build"} ${facility.name}.` : "Meet listed requirements first.")}
              >
                {maxed ? "Max" : level ? "Upgrade" : "Build"}
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}
