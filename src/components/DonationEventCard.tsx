import React from "react";
import { Gift } from "lucide-react";
import type { SurpriseDonation } from "../types";
import { donationConditions } from "../constants";
import { actionEnergyCost } from "../utils";

interface DonationEventCardProps {
  donation: SurpriseDonation;
  energy: number;
  onAccept: () => void;
  onSort: () => void;
  onDecline: () => void;
}

export function DonationEventCard({ donation, energy, onAccept, onSort, onDecline }: DonationEventCardProps) {
  const counts = donationConditions.map((condition) => ({
    condition,
    count: donation.items.filter((item) => item.condition === condition).length
  })).filter((entry) => entry.count > 0);
  const unknownCount = donation.items.filter((item) => item.condition === "Unknown").length;
  const previewItems = donation.items.slice(0, 8);

  return (
    <article className={`donationCard ${donation.tier.toLowerCase()}`}>
      <div className="donationTitle">
        <Gift size={22} />
        <div>
          <strong>{donation.donor}</strong>
          <span>{donation.tier} donation | {donation.items.length} items</span>
        </div>
      </div>
      <p>{donation.flavor}</p>
      <div className="conditionLine">
        {counts.map(({ condition, count }) => (
          <span key={condition}>{condition}: {count}</span>
        ))}
      </div>
      <div className="donationPreview">
        {previewItems.map((item) => (
          <span key={item.id}>{item.name} ({item.condition})</span>
        ))}
        {donation.items.length > previewItems.length ? <span>+{donation.items.length - previewItems.length} more</span> : null}
      </div>
      <div className="donationActions">
        <button onClick={onAccept} className="acceptDonation">Accept All</button>
        <button onClick={onSort} disabled={unknownCount === 0 || energy < actionEnergyCost(2)}>
          Sort First -{actionEnergyCost(2)} Energy
        </button>
        <button onClick={onDecline}>Decline</button>
      </div>
    </article>
  );
}
