import type { GameState, DistrictName } from "../types";
import { infrastructureProgress, mapUpgradePhase } from "../utils";
import { dataCenterRequirements, districtRequirementRows, districtUnlockHint, completedHostingDefinitions } from "../gameHelpers";
import { districtCatalog } from "../data";
import { districtLocations } from "../constants";
import { PanelTitle } from "./PanelTitle";

export function DistrictsPanel({ unlockedDistricts, districtProgress: _districtProgress, labProgressValue, game, selectedDistrict, onSelectDistrict }: {
  unlockedDistricts: DistrictName[];
  districtProgress: Record<DistrictName, number>;
  labProgressValue: number;
  game: GameState;
  selectedDistrict: DistrictName;
  onSelectDistrict: (district: DistrictName) => void;
}) {
  const infraProgress = infrastructureProgress(game);
  const phase = mapUpgradePhase(game);
  const dataCenter = dataCenterRequirements(game);
  return (
    <section className="panel districts">
      <PanelTitle heading="[ Community Map ]" sub={`${unlockedDistricts.length}/${districtCatalog.length} districts`} subClassName="districtCount" />
      <div className="mapProgressSummary">
        <span>{phase.name}</span>
        <span>Lab cap {phase.cap}%</span>
        <span>Infrastructure cap {phase.cap}%</span>
        <span>Lab {labProgressValue}%</span>
        <span>Infrastructure {infraProgress}%</span>
      </div>
      <div className="districtMapGrid">
        {districtCatalog.map((district) => {
          const unlocked = unlockedDistricts.includes(district.name);
          const isSelected = district.name === selectedDistrict;
          const locs = districtLocations[district.name];
          const requirements = districtRequirementRows(district, game, labProgressValue);
          return (
            <button
              key={district.name}
              className={`districtMapCard${unlocked ? " unlocked" : " locked"}${isSelected ? " selected" : ""}`}
              onClick={() => onSelectDistrict(district.name)}
              title={unlocked ? (locs ? locs.join(", ") : district.description) : districtUnlockHint(district, game, labProgressValue)}
            >
              <span className="districtMapName">{district.name}</span>
              <span className={`districtMapStatus${unlocked ? "" : " locked"}`}>{unlocked ? "OPEN" : "LOCKED"}</span>
              <span className="districtMapDescription">{district.description}</span>
              {!unlocked ? (
                <span className="districtRequirements">
                  <span className="districtReqLabel">Still needed:</span>
                  {requirements.filter((req) => !req.met).map((req) => (
                    <span key={req.label}>– {req.label}</span>
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <section className={`dataCenterBox ${game.dataCenterUnlocked ? "unlocked" : "locked"}`}>
        <div>
          <strong>DATA CENTER</strong>
          <span>{game.dataCenterUnlocked ? "UNLOCKED" : "LOCKED"}</span>
        </div>
        <p>
          {game.dataCenterUnlocked
            ? "CAF can now take on regional-scale hosting, AI, and infrastructure projects."
            : "Final-stage hook for rack server builds, GPU cluster projects, multi-tenant hosting, major contracts, security, backups, and outage systems."}
        </p>
        <div className="requestMeta">
          <span className={dataCenter.fullMap ? "met" : ""}>Full map {dataCenter.fullMap ? "met" : `${unlockedDistricts.length}/${districtCatalog.length}`}</span>
          <span className={dataCenter.labReady ? "met" : ""}>Lab {dataCenter.lab}/100%</span>
          <span className={dataCenter.infrastructureReady ? "met" : ""}>Infrastructure {dataCenter.infra}/100%</span>
          <span className={dataCenter.activeHostingReady ? "met" : ""}>Hosting contracts {completedHostingDefinitions(game).length}/3</span>
        </div>
      </section>
    </section>
  );
}
