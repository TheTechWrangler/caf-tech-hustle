import React from "react";

interface MilestoneTier {
  threshold: number;
  name: string;
  unlocks: string;
}

interface MilestoneListProps {
  title: string;
  tiers: MilestoneTier[];
  progress: number;
  cap: number;
}

export function MilestoneList({ title, tiers, progress, cap }: MilestoneListProps) {
  return (
    <div className="milestoneList">
      <strong>{title}</strong>
      <div>
        {tiers.filter((tier) => tier.threshold > 0).map((tier) => (
          <span className={`${progress >= tier.threshold ? "met" : ""}${cap < tier.threshold ? " capped" : ""}`} key={tier.threshold}>
            {tier.threshold}% {tier.name}: {tier.unlocks}
          </span>
        ))}
      </div>
    </div>
  );
}
