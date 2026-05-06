import { CreditCard } from "lucide-react";
import type { GameState, LoanDefinition } from "../types";
import { difficultyConfig } from "../utils";
import { loanCatalog } from "../data";
import { loanUnlocked, effectiveLoanInterest, loanRequirementLabels } from "../loanHelpers";
import { PanelTitle } from "./PanelTitle";

export function LoansPanel({
  game,
  onTakeLoan
}: {
  game: GameState;
  onTakeLoan: (loan: LoanDefinition) => void;
}) {
  const weeklyDue = game.loans
    .filter((loan) => loan.cadence === "Weekly")
    .reduce((total, loan) => total + Math.min(loan.payment, loan.remainingBalance), 0);
  const monthlyDue = game.loans
    .filter((loan) => loan.cadence === "Monthly")
    .reduce((total, loan) => total + Math.min(loan.payment, loan.remainingBalance), 0);

  return (
    <>
      <PanelTitle heading={<><CreditCard size={19} /> Loans</>} sub={`Credit ${game.creditScore}`} />
      <div className="infraMeter">
        <span>Active {game.loans.length}</span>
        <span>Weekly due ${weeklyDue}</span>
        <span>Monthly due ${monthlyDue}</span>
      </div>
      <div className="infraList">
        {game.loans.length ? (
          game.loans.map((loan) => (
            <article className="loanCard owned" key={loan.id}>
              <div>
                <strong>{loan.type}</strong>
                <span>{loan.cadence} | due day {loan.nextDueDay}</span>
              </div>
              <p>Balance ${loan.remainingBalance}. Payment ${Math.min(loan.payment, loan.remainingBalance)}. Interest {Math.round(loan.interestRate * 100)}%.</p>
              <small>Missed payments: {loan.missedPayments}</small>
            </article>
          ))
        ) : (
          <div className="emptyZone compact">No active loans.</div>
        )}
        {loanCatalog.map((loan) => {
          const unlocked = loanUnlocked(game, loan);
          const rate = effectiveLoanInterest(game, loan);
          const reqs = loanRequirementLabels(loan.requirements);
          return (
            <article className={`loanCard ${unlocked ? "available" : "locked"}`} key={loan.type}>
              <div>
                <strong>{loan.type}</strong>
                <span>${loan.amount} | {Math.round(rate * 100)}%</span>
              </div>
              <p>{loan.description}</p>
              <div className="infraBonuses">
                <span>{loan.cadence}</span>
                <span>Pay ${Math.round(loan.basePayment * difficultyConfig(game.difficulty).loanInterest)}</span>
                <span>{loan.missedPenalty}</span>
              </div>
              {reqs.length ? <small>Req: {reqs.join(" | ")}</small> : <small>Req: none</small>}
              <button onClick={() => onTakeLoan(loan)} disabled={!unlocked}>Take Loan</button>
            </article>
          );
        })}
      </div>
    </>
  );
}
