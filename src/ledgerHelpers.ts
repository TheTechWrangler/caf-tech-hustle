import type { GameState, DailyLedgerEntry } from "./types";

export function ledgerEntryFor(day: number, startingCash: number): DailyLedgerEntry {
  return {
    day,
    startingCash,
    income: 0,
    expenses: 0,
    endingCash: startingCash
  };
}

export function ensureLedgerDay(state: Pick<GameState, "day" | "cash" | "ledger">): DailyLedgerEntry[] {
  const existing = state.ledger ?? [];
  if (existing.some((entry) => entry.day === state.day)) return existing;
  return [...existing, ledgerEntryFor(state.day, state.cash)];
}

export function withCashChange(state: GameState, delta: number, label?: string): GameState {
  if (delta === 0) {
    return {
      ...state,
      ledger: ensureLedgerDay(state).map((entry) => entry.day === state.day ? { ...entry, endingCash: state.cash } : entry)
    };
  }
  const nextCash = Math.max(0, state.cash + delta);
  const actualDelta = nextCash - state.cash;
  const ledger = ensureLedgerDay(state).map((entry) => {
    if (entry.day !== state.day) return entry;
    const transactions = label
      ? [...(entry.transactions ?? []), { amount: actualDelta, label }]
      : entry.transactions;
    return {
      ...entry,
      income: entry.income + Math.max(0, actualDelta),
      expenses: entry.expenses + Math.max(0, -actualDelta),
      endingCash: nextCash,
      ...(transactions !== undefined ? { transactions } : {})
    };
  });
  return { ...state, cash: nextCash, ledger };
}

export function startLedgerDay(state: GameState, day: number): GameState {
  const ledger = ensureLedgerDay(state)
    .map((entry) => entry.day === state.day ? { ...entry, endingCash: state.cash } : entry)
    .filter((entry, index, entries) => entries.findIndex((candidate) => candidate.day === entry.day) === index);
  return {
    ...state,
    day,
    ledger: [...ledger, ledgerEntryFor(day, state.cash)].slice(-60)
  };
}
