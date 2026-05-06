import { HardDrive } from "lucide-react";
import "./HostingProjectsPanel.css";
import type { GameState, HostingProjectDefinition } from "../types";
import { hostingSlotsUsed, averageUptime, infrastructureStats } from "../utils";
import { hostingProjectStateFor, weeklyHostingIncome, hostingSlotUnlockText, hostingProjectAvailability } from "../gameHelpers";
import { hostingProjectCatalog } from "../data";
import { HostingProjectCard } from "./HostingProjectCard";
import { PanelTitle } from "./PanelTitle";

export function HostingProjectsPanel({
  game,
  stats,
  nextPayoutDay,
  onComplete
}: {
  game: GameState;
  stats: ReturnType<typeof infrastructureStats>;
  nextPayoutDay: number;
  onComplete: (project: HostingProjectDefinition) => void;
}) {
  const usedSlots = hostingSlotsUsed(game.hostedServices);
  const activeProjects = hostingProjectCatalog.filter((project) => {
    const status = hostingProjectStateFor(game, project.id).status;
    return status === "Completed" || status === "Active";
  });
  const availableProjects = hostingProjectCatalog.filter((project) => hostingProjectAvailability(game, project).canComplete);
  const lockedProjects = hostingProjectCatalog.filter((project) => {
    const current = hostingProjectStateFor(game, project.id);
    return current.status === "Inactive" && !hostingProjectAvailability(game, project).canComplete;
  });

  return (
    <>
      <PanelTitle heading={<><HardDrive size={19} /> Hosting Projects</>} sub={`$${weeklyHostingIncome(game)}/wk | payout day ${nextPayoutDay}`} />
      <div className="hostingSummary">
        <span>Active projects {activeProjects.length}</span>
        <span>Weekly payout ${weeklyHostingIncome(game)}</span>
        <span>Next Hosting Payout Day {nextPayoutDay}</span>
        <span>Hosting slots {usedSlots}/{stats.hostingCapacity}</span>
        <span>{hostingSlotUnlockText(game)}</span>
        <span>Average uptime {averageUptime(game.hostedServices)}%</span>
      </div>
      <div className="hostingColumns">
        <section className="hostingColumn">
          <h3>Available</h3>
          {availableProjects.length ? availableProjects.map((project) => (
            <HostingProjectCard
              key={project.id}
              project={project}
              mode="available"
              state={hostingProjectStateFor(game, project.id)}
              availabilityMissing={hostingProjectAvailability(game, project).missing}
              onComplete={onComplete}
            />
          )) : <div className="emptyZone compact">No projects ready. Repair gear, unlock map zones, or build hosting capacity.</div>}
        </section>
        <section className="hostingColumn">
          <h3>Active</h3>
          {activeProjects.length ? activeProjects.map((project) => (
            <HostingProjectCard
              key={project.id}
              project={project}
              mode="active"
              state={hostingProjectStateFor(game, project.id)}
              availabilityMissing={hostingProjectAvailability(game, project).missing}
              onComplete={onComplete}
            />
          )) : <div className="emptyZone compact">No recurring hosting income yet.</div>}
        </section>
        <section className="hostingColumn">
          <h3>Locked</h3>
          {lockedProjects.map((project) => (
            <HostingProjectCard
              key={project.id}
              project={project}
              mode="locked"
              state={hostingProjectStateFor(game, project.id)}
              availabilityMissing={hostingProjectAvailability(game, project).missing}
              onComplete={onComplete}
            />
          ))}
        </section>
      </div>
    </>
  );
}
