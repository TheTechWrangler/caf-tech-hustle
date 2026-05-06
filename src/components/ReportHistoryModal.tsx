import type { WeeklyReport } from "../types";
import "./ReportHistoryModal.css";

function exportImpactHistoryTxt(reports: WeeklyReport[]) {
  const lines: string[] = [
    "CAF Tech Hustle — Impact History",
    "=================================",
    ""
  ];
  for (const r of reports) {
    const net = r.cashEarned - r.cashSpent;
    lines.push(`Week ${r.week} — Day ${r.day}`);
    lines.push(`  "${r.flavor}"`);
    lines.push(`  Donated       : ${r.donated}`);
    lines.push(`  Requests      : ${r.requestsFulfilled}`);
    lines.push(`  Sold          : ${r.itemsSold}`);
    lines.push(`  Scrapped      : ${r.itemsScrapped}`);
    lines.push(`  Repairs       : ${r.repairsSucceeded} succeeded / ${r.repairsFailed} failed / ${r.repairsJunked} junked`);
    lines.push(`  Grants        : $${r.grantIncome}`);
    lines.push(`  Hosting       : $${r.hostingIncome}`);
    lines.push(`  Net Cash      : ${net >= 0 ? "+" : "-"}$${Math.abs(net)}`);
    lines.push("");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "caf-impact-history.txt";
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportHistoryModal({ reports, onClose }: { reports: WeeklyReport[]; onClose: () => void }) {
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Impact Report History">
      <section className="modalPanel reportHistory">
        <button className="modalClose" onClick={onClose}>Close</button>
        <button className="modalClose modalCloseSecondary" onClick={() => exportImpactHistoryTxt(reports)}>Export TXT</button>
        <div className="modalHeader">
          <h2>[ IMPACT HISTORY ]</h2>
        </div>
        <div className="modalBody">
          {reports.length === 0 ? (
            <p className="emptyZone">No reports yet. Complete a full week first.</p>
          ) : (
            reports.map((r) => (
              <article key={`${r.week}-${r.day}`} className="historyReportCard">
                <strong>Week {r.week} — Day {r.day}</strong>
                <p>"{r.flavor}"</p>
                <span>Donated {r.donated} | Requests {r.requestsFulfilled} | Sold {r.itemsSold} | Scrapped {r.itemsScrapped} | Repairs {r.repairsSucceeded}/{r.repairsFailed}/{r.repairsJunked} | Grants ${r.grantIncome} | Hosting ${r.hostingIncome} | Net ${r.cashEarned - r.cashSpent}</span>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
