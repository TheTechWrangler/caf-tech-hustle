import type { GameState, LoanType, LoanCadence, Loan, LoanDefinition } from "./types";
import { difficultyConfig, roll, id } from "./utils";

export function loanRequirementLabels(requirements: LoanDefinition["requirements"]): string[] {
  const labels: string[] = [];
  if (requirements.reputation) labels.push(`Rep ${requirements.reputation}`);
  if (requirements.communityTrust) labels.push(`Trust ${requirements.communityTrust}`);
  if (requirements.completedRequests) labels.push(`${requirements.completedRequests} requests`);
  if (requirements.maxLoans) labels.push(`Max ${requirements.maxLoans} active loans`);
  return labels;
}

export function activeLoanCountByType(state: GameState, type: LoanType): number {
  return state.loans.filter((loan) => loan.type === type).length;
}

export function loanUnlocked(state: GameState, definition: LoanDefinition): boolean {
  const requirements = definition.requirements;
  return (
    (requirements.reputation ?? 0) <= state.reputation &&
    (requirements.communityTrust ?? 0) <= state.communityTrust &&
    (requirements.completedRequests ?? 0) <= state.completedRequests &&
    (requirements.maxLoans ?? 99) > state.loans.length &&
    activeLoanCountByType(state, definition.type) < definition.maxActive
  );
}

export function effectiveLoanInterest(state: GameState, definition: LoanDefinition): number {
  const config = difficultyConfig(state.difficulty);
  const loanStack = state.loans.length * 0.025;
  const creditPenalty = Math.max(0, 70 - state.creditScore) / 200;
  const chaos = state.difficulty === "Chaos Mode" ? roll(-2, 5) / 100 : 0;
  return Math.max(0.04, definition.baseInterest * config.loanInterest + loanStack + creditPenalty + chaos);
}

export function nextLoanDueDay(day: number, cadence: LoanCadence): number {
  return day + (cadence === "Weekly" ? 7 : 28);
}

export function createLoan(state: GameState, definition: LoanDefinition): Loan {
  const interestRate = effectiveLoanInterest(state, definition);
  const remainingBalance = Math.round(definition.amount * (1 + interestRate));
  const payment = Math.max(10, Math.round(definition.basePayment * difficultyConfig(state.difficulty).loanInterest));
  return {
    id: id("loan"),
    type: definition.type,
    amount: definition.amount,
    interestRate,
    payment,
    cadence: definition.cadence,
    remainingBalance,
    nextDueDay: nextLoanDueDay(state.day, definition.cadence),
    missedPayments: 0
  };
}
