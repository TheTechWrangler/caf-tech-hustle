import { HeartHandshake } from "lucide-react";
import type { GameState, GrantDefinition, StorageStatus } from "../types";
import { statusClass } from "../utils";
import { grantStateFor } from "../gameHelpers";
import { grantCatalog } from "../data";
import { PanelTitle } from "./PanelTitle";

export function GrantsPanel({
  game,
  onApply
}: {
  game: GameState;
  onApply: (grant: GrantDefinition) => void;
}) {
  return (
    <section className="grantsPanel">
      <PanelTitle heading={<><HeartHandshake size={19} /> Grants</>} sub="Funding applications" />
      <div className="grantList">
        {grantCatalog.map((grant) => {
          const state = grantStateFor(game, grant.id);
          const pending = state.status === "Pending Review";
          const cooling = state.cooldownRemaining > 0 && !pending;
          const available = !pending && !cooling;
          return (
            <article className={`grantCard ${statusClass(state.status as StorageStatus)}`} key={grant.id}>
              <div>
                <strong>{grant.name}</strong>
                <span>{state.status}{pending ? ` (${state.daysRemaining}d)` : cooling ? ` (${state.cooldownRemaining}d)` : ""}</span>
              </div>
              <p>{grant.description}</p>
              <div className="requestMeta">
                <span>${grant.payoutRange[0]}-${grant.payoutRange[1]}</span>
                <span>Review {grant.reviewDays}d</span>
                <span>Cooldown {grant.cooldownDays}d</span>
              </div>
              <small>{grant.guidance}</small>
              {state.lastMessage ? <small className={state.lastResult === "Approved" ? "grantGood" : "grantBad"}>{state.lastMessage}</small> : null}
              <button onClick={() => onApply(grant)} disabled={!available}>
                {pending ? "Pending" : cooling ? "Cooling Down" : "Apply"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
