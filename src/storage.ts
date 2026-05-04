import type { GameState, SaveSlot, OperationsLayout } from "./types";
import {
  saveStorageKey, dailyAutosaveStorageKey, operationsLayoutStorageKey,
  saveSlotCount, defaultOperationsLayout
} from "./constants";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function defaultSaveSlots(): SaveSlot[] {
  return Array.from({ length: saveSlotCount }, (_value, index) => ({
    id: index + 1,
    name: `Slot ${index + 1}`,
    savedAt: null,
    game: null
  }));
}

export function writeSaveSlots(slots: SaveSlot[]) {
  try {
    window.localStorage.setItem(saveStorageKey, JSON.stringify(slots));
  } catch {
    // Local saves are a convenience layer; the game remains playable if storage is blocked.
  }
}

export function writeDailyAutosave(game: GameState): SaveSlot | null {
  try {
    const autosave: SaveSlot = {
      id: 0,
      name: "Daily Autosave",
      savedAt: new Date().toISOString(),
      game
    };
    window.localStorage.setItem(dailyAutosaveStorageKey, JSON.stringify(autosave));
    return autosave;
  } catch {
    return null;
  }
}

export function latestSavedSlot(slots: SaveSlot[]) {
  return slots
    .filter((slot) => slot.game && slot.savedAt)
    .sort((a, b) => Date.parse(b.savedAt ?? "") - Date.parse(a.savedAt ?? ""))[0];
}

export function saveSlotSummary(slot: SaveSlot) {
  if (!slot.game) return "Empty";
  return `Day ${slot.game.day} | $${slot.game.cash} | Rep ${slot.game.reputation} | Trust ${slot.game.communityTrust}`;
}

export function formatSavedTime(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function normalizeOperationsSizes(value: unknown, fallback: [number, number, number], min: number): [number, number, number] {
  if (!Array.isArray(value) || value.length !== 3) return fallback;
  const raw = value.map((entry, index) => typeof entry === "number" && Number.isFinite(entry) ? entry : fallback[index]);
  const total = raw.reduce((sum, entry) => sum + Math.max(min, entry), 0) || 100;
  const normalized = raw.map((entry) => Math.max(min, (Math.max(min, entry) / total) * 100));
  const normalizedTotal = normalized.reduce((sum, entry) => sum + entry, 0) || 100;
  return [
    Math.round((normalized[0] / normalizedTotal) * 1000) / 10,
    Math.round((normalized[1] / normalizedTotal) * 1000) / 10,
    Math.round((normalized[2] / normalizedTotal) * 1000) / 10
  ];
}

export function normalizeOperationsLayout(value: unknown): OperationsLayout {
  if (!isRecord(value)) return defaultOperationsLayout;
  return {
    columns: normalizeOperationsSizes(value.columns, defaultOperationsLayout.columns, 18),
    rows: normalizeOperationsSizes(value.rows, defaultOperationsLayout.rows, 14)
  };
}

export function readOperationsLayout(): OperationsLayout {
  if (typeof localStorage === "undefined") return defaultOperationsLayout;
  try {
    return normalizeOperationsLayout(JSON.parse(localStorage.getItem(operationsLayoutStorageKey) ?? "null"));
  } catch {
    return defaultOperationsLayout;
  }
}

export function writeOperationsLayout(layout: OperationsLayout) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(operationsLayoutStorageKey, JSON.stringify(layout));
  } catch {
    // Layout preference persistence is best-effort.
  }
}
