import type { GameState, GrantDefinition, GrantStatus } from "./types";
import { grantCatalog } from "./data";
import { clampStat, roll, labProgress, infrastructureStats, averageUptime } from "./utils";
import { donatedDeviceCount, infrastructureLevelTotal } from "./gameHelpers";
import { withCashChange } from "./ledgerHelpers";

export function grantApprovalChance(state: GameState, definition: GrantDefinition): number {
  const progress = labProgress(state);
  const stats = infrastructureStats(state.ownedInfrastructure, state.labStations);
  const impactScore =
    state.reputation * 0.008 +
    state.communityTrust * 0.01 +
    state.completedRequests * 0.018 +
    donatedDeviceCount(state) * 0.012 +
    progress * 0.004 +
    infrastructureLevelTotal(state) * 0.015 +
    state.unlockedDistricts.length * 0.02 +
    state.reportHistory.length * 0.025 +
    stats.hostingCapacity * 0.006 +
    averageUptime(state.hostedServices) * (state.hostedServices.length ? 0.001 : 0);
  const riskPenalty =
    state.stress * 0.012 +
    state.loans.length * 0.025 +
    state.loans.reduce((total, loan) => total + loan.missedPayments, 0) * 0.025;
  const focusBoost =
    definition.id === "micro" ? 0.12 :
      definition.id === "community-tech" ? Math.min(0.16, (state.completedRequests + donatedDeviceCount(state)) * 0.012) :
        definition.id === "futuredevs" ? (state.unlockedDistricts.includes("Schools") ? 0.12 : 0) + progress * 0.0015 :
          definition.id === "senior-safety" ? (state.unlockedDistricts.includes("Senior Center") ? 0.14 : 0) + state.communityTrust * 0.003 :
            definition.id === "infrastructure" ? progress * 0.003 + infrastructureLevelTotal(state) * 0.02 :
              Math.min(0.18, (state.reputation + state.communityTrust + state.completedRequests) * 0.002);
  const [minChance, maxChance] = definition.approvalRange;
  return clampStat(minChance + impactScore + focusBoost - riskPenalty, minChance, Math.min(maxChance, 1 - definition.minimumRejectionChance));
}

export function grantPayout(definition: GrantDefinition): number {
  return roll(definition.payoutRange[0], definition.payoutRange[1]);
}

export function approvedGrantMessage(definition: GrantDefinition): string {
  const messages = [
    "The review board liked CAF's growing community impact.",
    "Strong trust and request history helped the application.",
    "Funding awarded for continued tech access work.",
    `${definition.name} awarded after reviewers saw clear mission momentum.`
  ];
  return `Approved: ${messages[roll(0, messages.length - 1)]}`;
}

export function rejectedGrantMessage(): string {
  const messages = [
    "The application was promising, but funding was limited this cycle.",
    "Reviewers wanted a stronger impact history.",
    "The proposal may be stronger after more community deployments.",
    "Financial sustainability concerns were noted.",
    "The lab appears promising but still early."
  ];
  return `Rejected: ${messages[roll(0, messages.length - 1)]}`;
}

export function processGrantDay(state: GameState): { state: GameState; messages: string[] } {
  let next = state;
  const messages: string[] = [];
  const grants = next.grants.map((grant) => {
    const definition = grantCatalog.find((entry) => entry.id === grant.id);
    if (!definition) return grant;
    if (grant.status === "Pending Review") {
      const daysRemaining = Math.max(0, grant.daysRemaining - 1);
      if (daysRemaining > 0) return { ...grant, daysRemaining };
      const approved = Math.random() < grantApprovalChance(next, definition);
      if (approved) {
        const payout = grantPayout(definition);
        const message = approvedGrantMessage(definition);
        next = {
          ...withCashChange(next, payout, `Grant: ${definition.name}`),
          reputation: next.reputation + (definition.id === "major-foundation" ? 5 : 2),
          communityTrust: next.communityTrust + (definition.id === "micro" ? 1 : 2),
          weeklyStats: {
            ...next.weeklyStats,
            cashEarned: next.weeklyStats.cashEarned + payout,
            grantsApproved: next.weeklyStats.grantsApproved + 1,
            grantIncome: next.weeklyStats.grantIncome + payout
          }
        };
        messages.push(`${message} ${definition.name} paid $${payout}.`);
        return { ...grant, status: "Approved" as GrantStatus, daysRemaining: 0, cooldownRemaining: definition.cooldownDays, lastResult: "Approved" as const, lastMessage: message };
      }
      const message = rejectedGrantMessage();
      next = {
        ...next,
        weeklyStats: {
          ...next.weeklyStats,
          grantsRejected: next.weeklyStats.grantsRejected + 1
        }
      };
      messages.push(`${message} ${definition.name} is on cooldown.`);
      return { ...grant, status: "Rejected" as GrantStatus, daysRemaining: 0, cooldownRemaining: definition.cooldownDays, lastResult: "Rejected" as const, lastMessage: message };
    }
    if (grant.status === "On Cooldown" || grant.status === "Approved" || grant.status === "Rejected") {
      const cooldownRemaining = Math.max(0, grant.cooldownRemaining - 1);
      if (cooldownRemaining === 0) {
        messages.push(`${definition.name} cooldown ended. You can apply again.`);
        return { ...grant, status: "Available" as GrantStatus, cooldownRemaining: 0 };
      }
      return { ...grant, status: "On Cooldown" as GrantStatus, cooldownRemaining };
    }
    return grant;
  });
  return { state: { ...next, grants }, messages };
}
