import React from "react";
import type { DailyUpdateData } from "../types";

interface DailyUpdateModalProps {
  data: DailyUpdateData;
  onClose: () => void;
}

export function DailyUpdateModal({ data, onClose }: DailyUpdateModalProps) {
  const cashColor = data.netCash > 0 ? "#6fcf97" : data.netCash < 0 ? "#eb5757" : "#aaa";
  const cashSign = data.netCash > 0 ? "+" : "";

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalPanel dailyUpdateModal" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2 className="modalTitle">Day {data.day} Update</h2>
          <button className="modalClose" onClick={onClose}>✕</button>
        </div>
        <div className="modalBody">
          <div className="dailyUpdateNet">
            <span>Net cash today:</span>
            <span style={{ color: cashColor }}>{cashSign}${Math.abs(data.netCash)}</span>
          </div>
          {data.lines.length > 0 && (
            <ul className="dailyUpdateLines">
              {data.lines.map((line, i) => (
                <li key={i} className={`dailyUpdateLine ${line.kind}`}>
                  <span className="dailyUpdateLineLabel">{line.label}</span>
                  {line.amount !== undefined && (
                    <span className="dailyUpdateLineAmount">
                      {line.amount > 0 ? "+" : ""}{line.amount}
                    </span>
                  )}
                  {line.note && <span className="dailyUpdateLineNote">{line.note}</span>}
                </li>
              ))}
            </ul>
          )}
          {data.newDistricts.length > 0 && (
            <div className="dailyUpdateDistricts">
              {data.newDistricts.map((d) => (
                <div key={d} className="dailyUpdateDistrictUnlock">District unlocked: {d}</div>
              ))}
            </div>
          )}
          {data.newWeeklyReport && (
            <div className="dailyUpdateWeekly">Weekly impact report generated.</div>
          )}
        </div>
        <div className="modalFooter">
          <button className="btnPrimary" onClick={onClose}>Continue</button>
        </div>
      </div>
    </div>
  );
}
