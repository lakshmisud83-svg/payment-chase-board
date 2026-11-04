import { createClient } from "@supabase/supabase-js";
import Board from "./board";
import { resolveBoardState, stateCopy } from "../lib/board-state.mjs";

export const dynamic = "force-dynamic";

export default async function Page() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  let rows = null;
  let error = null;

  if (url && key) {
    try {
      const supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const result = await supabase
        .from("chase_rows")
        .select("*")
        .order("created_at", { ascending: true });

      if (result.error) {
        error = result.error.message;
      } else {
        rows = result.data;
      }
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
    }
  }

  const state = resolveBoardState({ url, key, rows, error });
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (state.kind === "ready") {
    return <Board rows={rows} today={today} />;
  }

  const copy = stateCopy(state);

  return (
    <main className="page">
      <header className="masthead">
        <p className="eyebrow">PhysioDesk &middot; Hyderabad</p>
        <h1>Payment chase</h1>
        <p className="lede">
          Every home visit patient whose money is still pending, whose session
          was missed, or whose feedback was never asked for.
        </p>
      </header>

      <section className="panel" aria-live="polite">
        <h2>{copy.heading}</h2>
        <p>{copy.body}</p>
        <p className="detail">{copy.detail}</p>
      </section>

      <p className="foot">
        This page only shows this message because it has nothing else to show.
        It is not the board.
      </p>
    </main>
  );
}
