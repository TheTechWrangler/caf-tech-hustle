import type { DailyLedgerEntry } from "../types";

function exportLedgerTxt(rows: (DailyLedgerEntry & { endingCash: number })[]) {
  const sorted = [...rows].sort((a, b) => a.day - b.day);
  const lines: string[] = [
    "CAF Tech Hustle — Accounting Journal",
    "=====================================",
    ""
  ];
  for (const entry of sorted) {
    const net = entry.income - entry.expenses;
    lines.push(`Day ${entry.day}`);
    lines.push(`  Starting Cash : $${entry.startingCash}`);
    if (entry.transactions && entry.transactions.length > 0) {
      lines.push("");
      lines.push("  Transactions:");
      for (const tx of entry.transactions) {
        const sign = tx.amount >= 0 ? "+" : "-";
        lines.push(`    ${sign}$${Math.abs(tx.amount).toString().padEnd(8)} ${tx.label}`);
      }
      lines.push("");
    }
    lines.push(`  Income        : +$${entry.income}`);
    lines.push(`  Expenses      : -$${entry.expenses}`);
    lines.push(`  Net           : ${net >= 0 ? "+" : "-"}$${Math.abs(net)}`);
    lines.push(`  Ending Cash   : $${entry.endingCash}`);
    lines.push("");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "caf-accounting-journal.txt";
  a.click();
  URL.revokeObjectURL(url);
}

export function LedgerModal({ ledger, currentCash, onClose }: { ledger: DailyLedgerEntry[]; currentCash: number; onClose: () => void }) {
  const rows = [...ledger]
    .map((entry, index, entries) => index === entries.length - 1 ? { ...entry, endingCash: currentCash } : entry)
    .sort((a, b) => b.day - a.day);
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Accounting Journal">
      <section className="modalPanel ledgerPanel">
        <button className="modalClose" onClick={onClose}>Close</button>
        <button className="modalClose modalCloseSecondary" onClick={() => exportLedgerTxt(rows)}>Export TXT</button>
        <div className="modalHeader">
          <h2>[ ACCOUNTING JOURNAL ]</h2>
          <p className="ledgerIntro">Daily money movement totals. Individual transactions stay in the daily feed.</p>
        </div>
        <div className="modalBody">
          {rows.length === 0 ? (
            <p className="emptyZone">No ledger entries yet.</p>
          ) : (
            <div className="ledgerList">
              {rows.map((entry) => {
                const net = entry.income - entry.expenses;
                return (
                  <article className="ledgerCard" key={entry.day}>
                    <div className="ledgerHeader">
                      <strong>Day {entry.day}</strong>
                      <span className={net >= 0 ? "ledgerPositive" : "ledgerNegative"}>{net >= 0 ? "+" : "-"}${Math.abs(net)}</span>
                    </div>
                    <div className="ledgerGrid">
                      <span>Starting Cash: ${entry.startingCash}</span>
                      <span className="ledgerPositive">Income: +${entry.income}</span>
                      <span className="ledgerNegative">Expenses: -${entry.expenses}</span>
                      <span>Net: {net >= 0 ? "+" : "-"}${Math.abs(net)}</span>
                      <span>Ending Cash: ${entry.endingCash}</span>
                    </div>
                    {entry.transactions && entry.transactions.length > 0 && (
                      <div className="ledgerTransactions">
                        {entry.transactions.map((tx, i) => (
                          <span key={i} className={tx.amount >= 0 ? "ledgerPositive" : "ledgerNegative"}>
                            {tx.amount >= 0 ? "+" : "-"}${Math.abs(tx.amount)} {tx.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
