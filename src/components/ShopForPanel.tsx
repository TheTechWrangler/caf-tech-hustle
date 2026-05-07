import React from "react";
import { Binoculars, FlaskConical, HeartHandshake, ShoppingCart, Sparkles, Star, Wrench } from "lucide-react";
import type { ShopForNeed } from "../types";

interface ShopForPanelProps {
  needs: ShopForNeed[];
}

export function ShopForPanel({ needs }: ShopForPanelProps) {
  const requestNeeds = needs.filter((need) => need.section === "Requests").slice(0, 4);
  const buyerNeeds = needs.filter((need) => need.section === "Buyers").slice(0, 4);
  const labNeeds = needs.filter((need) => need.section === "Lab").slice(0, 4);
  const nextAction = requestNeeds.length
    ? {
      title: "Find request items",
      detail: "Prioritize community requests before shopping for resale value."
    }
    : labNeeds.length
      ? {
        title: "Find lab gear",
        detail: "Grab useful parts for upgrades when the price and condition make sense."
      }
      : buyerNeeds.length
        ? {
          title: "Hunt buyer value",
          detail: "Look for clean resale matches and keep storage moving."
        }
        : {
          title: "Scout the Market",
          detail: "New deals refresh daily. Buy smart, then repair in Operations."
        };
  const sections = [
    { title: "Requests", subtitle: "needed now", icon: <HeartHandshake size={16} />, needs: requestNeeds, empty: "No missing request items.", tone: "request" },
    { title: "Buyers", subtitle: "value targets", icon: <Star size={16} />, needs: buyerNeeds, empty: "No special buyer demand right now.", tone: "buyer" },
    { title: "Lab", subtitle: "upgrade parts", icon: <FlaskConical size={16} />, needs: labNeeds, empty: "Lab has matching gear ready.", tone: "lab" }
  ];
  return (
    <aside className="shopForPanel">
      <div className="shopForTitle">
        <strong>Market Guide</strong>
        <span>live needs</span>
      </div>
      <section className="shopForActionCard">
        <div className="shopForActionIcon"><Binoculars size={22} /></div>
        <div>
          <span>Next Best Action</span>
          <strong>{nextAction.title}</strong>
          <p>{nextAction.detail}</p>
        </div>
      </section>
      <section className="shopForLoop" aria-label="The hustle loop">
        <div className="shopForLoopTitle"><Sparkles size={14} /> The Hustle Loop</div>
        <div className="shopForLoopSteps">
          <span><ShoppingCart size={14} /> Buy</span>
          <b>{">"}</b>
          <span><Wrench size={14} /> Repair</span>
          <b>{">"}</b>
          <span><HeartHandshake size={14} /> Sell / Donate</span>
          <b>{">"}</b>
          <span><Star size={14} /> Grow</span>
        </div>
      </section>
      <div className="shopForSections">
        <div className="shopForSectionHeader">Needed Right Now</div>
        {sections.map((section) => (
          <section className={`shopForSection ${section.tone}`} key={section.title}>
            <div className="shopForSectionTitle">
              {section.icon}
              <div>
                <strong>{section.title}</strong>
                <small>{section.subtitle}</small>
              </div>
            </div>
            <div className="shopForNeedList">
              {section.needs.length ? section.needs.map((need) => (
                <span className="shopForNeed" key={need.id}>
                  <b>{need.label}</b>
                  <em>{need.detail}</em>
                </span>
              )) : <span className="shopForNeed muted">{section.empty}</span>}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
