import type { GameState, OpsTab, InfrastructureDefinition, LoanDefinition, LabStationName, InventoryItem } from "../types";
import { infrastructureStats } from "../utils";
import { InfrastructurePanel } from "./InfrastructurePanel";
import { BuildLabPanel } from "./BuildLabPanel";
import { LoansPanel } from "./LoansPanel";

export function OpsPanel({
  activeTab,
  onTabChange,
  availableTabs = ["Infrastructure", "Build the Lab", "Loans"],
  game,
  stats,
  hostingUsed,
  avgUptime,
  onBuyUpgrade,
  onTakeLoan,
  onUseStorageForLab,
  onBuyLabEquipment,
  onStageInfrastructureItem,
  onBuyExtraRepair
}: {
  activeTab: OpsTab;
  onTabChange: (tab: OpsTab) => void;
  availableTabs?: OpsTab[];
  game: GameState;
  stats: ReturnType<typeof infrastructureStats>;
  hostingUsed: number;
  avgUptime: number;
  onBuyUpgrade: (facility: InfrastructureDefinition) => void;
  onTakeLoan: (loan: LoanDefinition) => void;
  onUseStorageForLab: (station: LabStationName, itemId: string) => void;
  onBuyLabEquipment: (station: LabStationName) => void;
  onStageInfrastructureItem: (facility: InfrastructureDefinition, item: InventoryItem) => void;
  onBuyExtraRepair: () => void;
}) {
  return (
    <>
      <div className="opsTabs">
        {availableTabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? "selected" : ""} onClick={() => onTabChange(tab)}>
            {tab}
          </button>
        ))}
      </div>
      {activeTab === "Infrastructure" ? (
        <InfrastructurePanel
          game={game}
          stats={stats}
          hostingUsed={hostingUsed}
          avgUptime={avgUptime}
          onBuyUpgrade={onBuyUpgrade}
          onStageItem={onStageInfrastructureItem}
        />
      ) : null}
      {activeTab === "Build the Lab" ? (
        <BuildLabPanel
          game={game}
          stats={stats}
          onUseStorageForLab={onUseStorageForLab}
          onBuyLabEquipment={onBuyLabEquipment}
          onBuyExtraRepair={onBuyExtraRepair}
        />
      ) : null}
      {activeTab === "Loans" ? (
        <LoansPanel game={game} onTakeLoan={onTakeLoan} />
      ) : null}
    </>
  );
}
