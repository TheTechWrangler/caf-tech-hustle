import type { WeeklyReport } from "../types";

export function WeeklyReportModal({ report, onClose }: { report: WeeklyReport; onClose: () => void }) {
  const net = report.cashEarned - report.cashSpent;
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Weekly Impact Report">
      <section className="modalPanel weeklyReport">
        <div className="reportHeader">
          <h2>[ WEEK {report.week} IMPACT REPORT ]</h2>
          <span>Day {report.day}</span>
        </div>
        <p className="reportFlavor">"{report.flavor}"</p>
        <div className="reportGrid">
          <div className="reportSection">
            <strong>OUTGOING</strong>
            <span>Donated: {report.donated}</span>
            <span>Requests fulfilled: {report.requestsFulfilled}</span>
            <span>Items sold: {report.itemsSold}</span>
            <span>Scrapped / recycled: {report.itemsScrapped}</span>
            <span>Assigned to lab: {report.itemsAssignedToLab}</span>
          </div>
          <div className="reportSection">
            <strong>FINANCIALS</strong>
            <span>Cash earned: ${report.cashEarned}</span>
            <span>Cash spent: ${report.cashSpent}</span>
            <span>Hosting income: ${report.hostingIncome}</span>
            <span>Net: {net >= 0 ? "+" : ""}{net}</span>
          </div>
          <div className="reportSection">
            <strong>FUNDING</strong>
            <span>Grants applied: {report.grantsApplied}</span>
            <span>Grants approved: {report.grantsApproved}</span>
            <span>Grants rejected: {report.grantsRejected}</span>
            <span>Grant income: ${report.grantIncome}</span>
          </div>
          <div className="reportSection">
            <strong>REPAIRS</strong>
            <span>Successful repairs: {report.repairsSucceeded}</span>
            <span>Failed repairs: {report.repairsFailed}</span>
            <span>Junked repairs: {report.repairsJunked}</span>
          </div>
          <div className="reportSection">
            <strong>GROWTH</strong>
            <span>Rep gained: +{report.reputationGained}</span>
            <span>Trust gained: +{report.trustGained}</span>
            <span>Lab progress: +{report.labProgressGained}%</span>
          </div>
          {(report.hostedServicesActive > 0 || report.loansActive > 0) ? (
            <div className="reportSection">
              <strong>OPERATIONS</strong>
              {report.hostedServicesActive > 0 ? <span>Hosted services: {report.hostedServicesActive} ({report.avgUptime}% uptime)</span> : null}
              {report.loansActive > 0 ? <span>Active loans: {report.loansActive}</span> : null}
            </div>
          ) : null}
        </div>
        <button className="primary" onClick={onClose}>[ Continue ]</button>
      </section>
    </div>
  );
}
