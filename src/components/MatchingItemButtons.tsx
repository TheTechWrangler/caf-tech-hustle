import React from "react";
import type { InventoryItem } from "../types";

interface MatchingItemButtonsProps {
  items: InventoryItem[];
  empty: string;
  onUse?: (item: InventoryItem) => void;
  action?: string;
}

export function MatchingItemButtons({ items, empty, onUse, action = "Use matching item" }: MatchingItemButtonsProps) {
  const unique = items.filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index).slice(0, 6);
  if (!unique.length) return <small>{empty}</small>;
  return (
    <div className="opsMatchList">
      {unique.map((item) => (
        <button key={item.id} onClick={() => onUse?.(item)} disabled={!onUse}>
          {onUse ? `${action}: ${item.name}` : item.name}
        </button>
      ))}
    </div>
  );
}
