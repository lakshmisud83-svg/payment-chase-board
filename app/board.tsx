"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  boardTotals,
  formatDay,
  formatRupees,
  splitRows,
} from "../lib/money.mjs";
import { getBrowserClient } from "../lib/supabase-browser.mjs";

function reasons(row) {
  const list = [];
  if (row.reason_pending_money)
    list.push({ label: "Money pending", className: "money" });
  if (row.reason_missed_session)
    list.push({ label: "Session missed", className: "missed" });
  if (row.reason_feedback_not_asked)
    list.push({ label: "Feedback not asked", className: "feedback" });
  return list;
}

function Amount({ paise }) {
  const zero = Number(paise || 0) === 0;
  return (
    <div className={"amount" + (zero ? " zero" : "")}>
      <span className="amount-value">{formatRupees(paise)}</span>
      <span className="amount-label">
        {zero ? "no money at risk" : "at risk"}
      </span>
    </div>
  );
}

export default function Board({ rows, today }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);
  const [markError, setMarkError] = useState("");

  const totals = boardTotals(rows);
  const { toChase, settled } = splitRows(rows);

  async function mark(id, outcome) {
    setBusyId(id);
    setMarkError("");
    try {
      const supabase = getBrowserClient();
      const { error } = await supabase.rpc("mark_outcome", {
        p_row_id: id,
        p_outcome: outcome,
      });
      if (error) {
        setMarkError(error.message);
        return;
      }
      router.refresh();
    } catch (caught) {
      setMarkError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="page">
      <header className="masthead">
        <p className="eyebrow">PhysioDesk &middot; Hyderabad</p>
        <h1>Payment chase</h1>
        <p className="lede">
          Every home visit patient whose money is still pending, whose session
          was missed, or whose feedback was never asked for. {today}.
        </p>
      </header>

      <section className="totals" aria-label="Totals">
        <div className="stat primary">
          <span className="stat-label">At risk</span>
          <span className="stat-value">{formatRupees(totals.atRisk)}</span>
          <span className="stat-note">
            across {totals.toChase} {totals.toChase === 1 ? "patient" : "patients"}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Promised</span>
          <span className="stat-value">{formatRupees(totals.promised)}</span>
          <span className="stat-note">
            {totals.promisedCount} {totals.promisedCount === 1 ? "promise" : "promises"} to keep
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Collected</span>
          <span className="stat-value">{formatRupees(totals.collected)}</span>
          <span className="stat-note">settled so far</span>
        </div>
      </section>

      <div className="strip">
        <span>
          <strong>{toChase.length}</strong> on the board
        </span>
        <span>
          <strong>{formatRupees(totals.lost)}</strong> written off
        </span>
        <span>Amounts in rupees. Every row is one open item.</span>
      </div>

      {markError ? (
        <p className="banner" role="alert">
          That mark did not save: {markError}. Nothing moved, so you can try
          again.
        </p>
      ) : null}

      <div className="section-head">
        <h2>To chase</h2>
        <span>All rows, nothing hidden</span>
      </div>

      {toChase.length === 0 ? (
        <section className="panel">
          <h2>Nothing left to chase</h2>
          <p>
            Every patient is settled. New pending items will appear here as
            soon as they are added.
          </p>
        </section>
      ) : (
        <ul className="board">
          {toChase.map((row) => (
            <li className="row" key={row.id}>
              <div className="who">
                <p className="name">{row.patient_name}</p>
                <p className="meta">
                  {row.area}
                  {row.phone ? " \u00b7 " + row.phone : ""}
                </p>
                <div className="chips">
                  {reasons(row).map((reason) => (
                    <span className={"chip " + reason.className} key={reason.label}>
                      {reason.label}
                    </span>
                  ))}
                  {row.status === "promised" ? (
                    <span className="chip promised-for">
                      Promised{row.promised_for ? " \u00b7 " + formatDay(row.promised_for) : ""}
                    </span>
                  ) : null}
                </div>
              </div>

              <Amount paise={row.amount_paise} />

              <div className="actions">
                <button
                  className="btn paid"
                  disabled={busyId === row.id}
                  onClick={() => mark(row.id, "paid")}
                >
                  Paid
                </button>
                <button
                  className="btn promised"
                  disabled={busyId === row.id}
                  onClick={() => mark(row.id, "promised")}
                >
                  Promised
                </button>
                <button
                  className="btn lost"
                  disabled={busyId === row.id}
                  onClick={() => mark(row.id, "lost")}
                >
                  Lost
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="section-head">
        <h2>Settled and closed</h2>
        <span>{settled.length} {settled.length === 1 ? "row" : "rows"}</span>
      </div>

      {settled.length === 0 ? (
        <p className="meta">Nothing has been marked paid or lost yet.</p>
      ) : (
        <ul className="board settled">
          {settled.map((row) => (
            <li className="row" key={row.id}>
              <div className="who">
                <p className="name">{row.patient_name}</p>
                <p className="meta">
                  {row.area}
                  {row.phone ? " \u00b7 " + row.phone : ""}
                </p>
                <div className="chips">
                  {reasons(row).map((reason) => (
                    <span className={"chip " + reason.className} key={reason.label}>
                      {reason.label}
                    </span>
                  ))}
                </div>
              </div>

              <Amount paise={row.amount_paise} />

              <div className="actions">
                <span className={"status " + row.status}>
                  {row.status === "paid" ? "Paid" : "Lost"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="foot">
        Marking a call moves the row and changes the totals at the top
        immediately. That is the whole page.
      </p>
    </main>
  );
}
