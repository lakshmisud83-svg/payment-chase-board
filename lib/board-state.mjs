export function resolveBoardState({ url, key, rows, error }) {
  const missing = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    return { kind: "missing", missing };
  }
  if (error) {
    const message =
      typeof error === "string" ? error : error.message || "Unknown error";
    return { kind: "failed", message };
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return { kind: "empty" };
  }
  return { kind: "ready" };
}

export function stateCopy(state) {
  if (state.kind === "missing") {
    return {
      heading: "A setting is missing",
      body:
        "The page cannot reach its database because " +
        state.missing.join(" and ") +
        " is not set.",
      detail:
        "Add " +
        state.missing.join(" and ") +
        " to .env.local, then restart the dev server.",
    };
  }
  if (state.kind === "failed") {
    return {
      heading: "The board could not load",
      body:
        "The request to Supabase failed, so the board cannot show any rows.",
      detail: state.message,
    };
  }
  if (state.kind === "empty") {
    return {
      heading: "The board is empty",
      body:
        "Supabase answered, and there are no patients on the board yet.",
      detail:
        "This is not an error. Add a row to chase_rows and it will appear here.",
    };
  }
  return null;
}
