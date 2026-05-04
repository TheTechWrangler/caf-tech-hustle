import React from "react";
import type { ShopForNeed } from "../types";

interface ShopForPanelProps {
  needs: ShopForNeed[];
}

export function ShopForPanel({ needs }: ShopForPanelProps) {
  const requestNeeds = needs.filter((need) => need.section === "Requests").slice(0, 4);
  const buyerNeeds = needs.filter((need) => need.section === "Buyers").slice(0, 4);
  const labNeeds = needs.filter((need) => need.section === "Lab").slice(0, 4);
  return (
    <aside className="shopForPanel">
      <div className="shopForTitle">
        <strong>Shop For</strong>
        <span>live needs</span>
      </div>
      <div className="shopForSections">
        <div className="shopForSection">
          <strong>Needed for Requests</strong>
          {requestNeeds.length ? requestNeeds.map((need) => (
            <span key={need.id}>{need.label} <em>{need.detail}</em></span>
          )) : <span className="muted">No missing request items.</span>}
        </div>
        <div className="shopForSection">
          <strong>Wanted by Buyers</strong>
          {buyerNeeds.length ? buyerNeeds.map((need) => (
            <span key={need.id}>{need.label} <em>{need.detail}</em></span>
          )) : <span className="muted">No special buyer demand right now.</span>}
        </div>
        <div className="shopForSection">
          <strong>Useful for Lab</strong>
          {labNeeds.length ? labNeeds.map((need) => (
            <span key={need.id}>{need.label} <em>{need.detail}</em></span>
          )) : <span className="muted">Lab has matching gear ready.</span>}
        </div>
      </div>
    </aside>
  );
}
