import React from "react";
import type { HostingProject, HostingProjectDefinition } from "../types";
import { hostingWeeklyPayout } from "../utils";

interface HostingProjectCardProps {
  project: HostingProjectDefinition;
  mode: "available" | "active" | "locked";
  state: HostingProject;
  availabilityMissing: string;
  onComplete: (project: HostingProjectDefinition) => void;
}

export function HostingProjectCard({ project, mode, state, availabilityMissing, onComplete }: HostingProjectCardProps) {
  const assigned = state.equipmentNames?.length ? state.equipmentNames.join(", ") : "none assigned";
  return (
    <article className={`hostingCard ${mode}`}>
      <div className="hostingCardHeader">
        <strong>{project.name}</strong>
        <span>{state.status}</span>
      </div>
      <p>{project.description}</p>
      <div className="requestMeta">
        <span>${hostingWeeklyPayout(project)}/wk</span>
        <span>Setup ${project.setupCost}</span>
        <span>Rep +{project.reputationReward}</span>
        <span>Slots {project.hostingSlots}</span>
        {project.requiredDistrict ? <span>{project.requiredDistrict}</span> : null}
        {project.requiredLabProgress ? <span>Lab {project.requiredLabProgress}%</span> : null}
        {project.requiredInfrastructureProgress ? <span>Infra {project.requiredInfrastructureProgress}%</span> : null}
        {project.requiredReputation ? <span>Rep {project.requiredReputation}</span> : null}
      </div>
      <small>Requires: {project.requiredEquipment.map((req) => req.label).join(" | ")}</small>
      {project.riskNote ? <small>{project.riskNote}</small> : null}
      {mode === "active" ? (
        <small>Equipment kept in service: {assigned}</small>
      ) : null}
      {mode === "available" ? (
        <button onClick={() => onComplete(project)}>Complete Project</button>
      ) : mode === "locked" ? (
        <small className="hostingMissing">Locked: {availabilityMissing}</small>
      ) : null}
    </article>
  );
}
