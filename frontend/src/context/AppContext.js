// ═══════════════════════════════════════════════
// src/context/AppContext.js — Global app state & helpers
// ═══════════════════════════════════════════════

const { createContext, useContext } = React;

const AppCtx = createContext(null);

function useApp() {
  return useContext(AppCtx);
}

// ── Shared date/duration helpers (used by multiple screens) ──
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDuration(start, end) {
  if (!start || !end) return "—";

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  const diffMinutes = Math.round((endTime - startTime) / 60000);

  if (diffMinutes < 0) return "—";

  if (diffMinutes < 60) return `${diffMinutes}m`;

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return `${hours}h ${minutes}m`;
}