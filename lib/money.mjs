export function paiseToRupees(paise) {
  return Math.round(Number(paise || 0)) / 100;
}

export function formatRupees(paise) {
  const rupees = paiseToRupees(paise);
  return (
    "\u20b9" +
    rupees.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  );
}

export function boardTotals(rows) {
  const totals = {
    atRisk: 0,
    promised: 0,
    collected: 0,
    lost: 0,
    toChase: 0,
    promisedCount: 0,
  };

  for (const row of rows || []) {
    const amount = Number(row.amount_paise || 0);
    if (row.status === "pending") {
      totals.atRisk += amount;
      totals.toChase += 1;
    } else if (row.status === "promised") {
      totals.atRisk += amount;
      totals.promised += amount;
      totals.toChase += 1;
      totals.promisedCount += 1;
    } else if (row.status === "paid") {
      totals.collected += amount;
    } else if (row.status === "lost") {
      totals.lost += amount;
    }
  }

  return totals;
}

export function splitRows(rows) {
  const toChase = [];
  const settled = [];
  for (const row of rows || []) {
    if (row.status === "paid" || row.status === "lost") settled.push(row);
    else toChase.push(row);
  }
  return { toChase, settled };
}

export function formatDay(value) {
  if (!value) return "";
  const date = new Date(value + "T00:00:00");
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
