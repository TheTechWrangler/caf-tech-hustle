import { Save, Trash2 } from "lucide-react";
import type { GameState, SaveSlot, Difficulty } from "../types";
import { difficulties } from "../constants";
import { formatSavedTime, saveSlotSummary } from "../storage";
import { PanelTitle } from "./PanelTitle";

export function SavesPanel({
  game,
  saveSlots,
  newGameDifficulty,
  onSaveSlot,
  onLoadSlot,
  onDeleteSlot,
  onNewDifficultyChange,
  onNewGame
}: {
  game: GameState;
  saveSlots: SaveSlot[];
  newGameDifficulty: Difficulty;
  onSaveSlot: (slotId: number) => void;
  onLoadSlot: (slot: SaveSlot) => void;
  onDeleteSlot: (slotId: number) => void;
  onNewDifficultyChange: (difficulty: Difficulty) => void;
  onNewGame: () => void;
}) {
  return (
    <>
      <PanelTitle heading={<><Save size={19} /> Saves</>} sub={game.difficulty} />
      <div className="newGameBox">
        <select value={newGameDifficulty} onChange={(event) => onNewDifficultyChange(event.target.value as Difficulty)}>
          {difficulties.map((difficulty) => (
            <option key={difficulty} value={difficulty}>{difficulty}</option>
          ))}
        </select>
        <button onClick={onNewGame}>New Game</button>
      </div>
      <div className="saveList">
        {saveSlots.map((slot) => (
          <article className="saveCard" key={slot.id}>
            <div>
              <strong>{slot.name}</strong>
              <span>{formatSavedTime(slot.savedAt)}</span>
            </div>
            <p>{saveSlotSummary(slot)}</p>
            {slot.game ? (
              <div className="requestMeta">
                <span>{slot.game.difficulty}</span>
                <span>Cash ${slot.game.cash}</span>
                <span>Rep {slot.game.reputation}</span>
                <span>Trust {slot.game.communityTrust}</span>
              </div>
            ) : null}
            <div className="saveActions">
              <button onClick={() => onSaveSlot(slot.id)} disabled={slot.id === 0}>Save</button>
              <button onClick={() => onLoadSlot(slot)} disabled={!slot.game}>Load</button>
              <button onClick={() => onDeleteSlot(slot.id)} disabled={!slot.game || slot.id === 0}><Trash2 size={14} /> Delete</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
