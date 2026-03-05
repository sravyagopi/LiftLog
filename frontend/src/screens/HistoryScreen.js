// ═══════════════════════════════════════════════
// src/screens/HistoryScreen.js
//   • "Today" section shown at top when there are sessions today
//   • Older sessions grouped by date below
// ═══════════════════════════════════════════════

const { useState: useHxState, useEffect: useHxEffect } = React;

// ── Is a timestamp from today (local time)? ──
function isToday(isoString) {
  const d   = new Date(isoString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  );
}

// ── Format a date as "Mon, Mar 5" ────────────
function formatDateLong(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

function HistoryScreen({ navigate }) {
  const [history,       setHistory]       = useHxState([]);
  const [exercises,     setExercises]     = useHxState({});  // id → exercise
  const [selected,      setSelected]      = useHxState(null);
  const [sessionDetail, setSessionDetail] = useHxState(null);
  const [loading,       setLoading]       = useHxState(true);

  useHxEffect(() => {
    Promise.all([api.workouts.history(), api.exercises.list()])
      .then(([h, e]) => {
        setHistory(h);
        const map = {};
        e.forEach(ex => { map[ex.id] = ex; });
        setExercises(map);
      })
      .finally(() => setLoading(false));
  }, []);

  async function loadDetail(item) {
    setSelected(item);
    setSessionDetail(null);
    const detail = await api.workouts.get(item.id);
    setSessionDetail(detail);
  }

  // ════════════════════════════════════════════
  // RENDER: Session detail
  // ════════════════════════════════════════════
  if (selected) {
    const grouped = {};
    if (sessionDetail) {
      for (const s of sessionDetail.sets) {
        if (!grouped[s.exercise_id]) grouped[s.exercise_id] = [];
        grouped[s.exercise_id].push(s);
      }
    }

    return React.createElement("div", { className: "screen safe-top" },
      React.createElement("div", { className: "nav-bar" },
        React.createElement("button", { className: "nav-btn", onClick: () => { setSelected(null); setSessionDetail(null); } }, "← Back"),
        React.createElement("div", { className: "nav-sub" }, selected.template_name || "Workout")
      ),
      React.createElement("div", { className: "scroll-content" },
        // Chips row
        React.createElement("div", { style: { marginTop: 12, marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" } },
          React.createElement("span", { className: "chip" }, `📅 ${formatDateLong(selected.start_time)}`),
          React.createElement("span", { className: "chip" }, `⏱ ${formatDuration(selected.start_time, selected.end_time)}`),
          React.createElement("span", { className: "chip" }, `${selected.set_count} sets`)
        ),

        !sessionDetail
          ? React.createElement("div", { style: { textAlign: "center", padding: 40 } }, React.createElement("span", { className: "spinner" }))
          : Object.keys(grouped).length === 0
            ? React.createElement("div", { className: "empty" },
                React.createElement("div", { className: "empty-icon" }, "📭"),
                React.createElement("div", { className: "empty-text" }, "No sets were logged in this session.")
              )
            : Object.keys(grouped).map(exId => {
                const ex = exercises[exId];
                return React.createElement("div", { key: exId, className: "exercise-block", style: { marginBottom: 10 } },
                  React.createElement("div", { className: "exercise-block-header" },
                    React.createElement("div", null,
                      React.createElement("div", { className: "exercise-block-name" }, ex?.name || "Unknown Exercise"),
                      ex?.category && React.createElement("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 1 } }, ex.category)
                    ),
                    React.createElement("span", { className: "chip" }, `${grouped[exId].length} sets`)
                  ),
                  ...grouped[exId].map((s, i) =>
                    React.createElement("div", { key: s.id, className: "set-row" },
                      React.createElement("span", { className: "set-num" }, i + 1),
                      React.createElement("span", { style: { flex: 1, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 16 } }, `${s.weight} lbs`),
                      React.createElement("span", { className: "set-x" }, "×"),
                      React.createElement("span", { style: { flex: 1, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600 } }, s.reps)
                    )
                  )
                );
              })
      )
    );
  }

  // ════════════════════════════════════════════
  // RENDER: History list
  // ════════════════════════════════════════════

  const todayItems = history.filter(w => isToday(w.start_time));
  const pastItems  = history.filter(w => !isToday(w.start_time));

  // Group past items by date string
  const pastByDate = {};
  pastItems.forEach(w => {
    const key = formatDateLong(w.start_time);
    if (!pastByDate[key]) pastByDate[key] = [];
    pastByDate[key].push(w);
  });

  function WorkoutCard({ item }) {
    return React.createElement("div", {
      key: item.id,
      className: "history-item",
      style: { cursor: "pointer" },
      onClick: () => loadDetail(item),
    },
      React.createElement("div", null,
        React.createElement("div", { className: "history-name" }, item.template_name || "Workout"),
        React.createElement("div", { className: "history-meta" },
          `${item.exercise_count} exercises · ${item.set_count} sets · ${formatDuration(item.start_time, item.end_time)}`
        )
      ),
      React.createElement("span", { className: "history-arrow" }, "→")
    );
  }

  return React.createElement("div", { className: "screen safe-top" },
    React.createElement("div", { className: "nav-bar" },
      React.createElement("button", { className: "nav-btn", onClick: () => navigate("home") }, "← Back"),
      React.createElement("div", { className: "nav-sub" }, "History")
    ),

    React.createElement("div", { className: "scroll-content" },
      loading
        ? React.createElement("div", { style: { textAlign: "center", padding: 40 } }, React.createElement("span", { className: "spinner" }))
        : history.length === 0
          ? React.createElement("div", { className: "empty" },
              React.createElement("div", { className: "empty-icon" }, "🕐"),
              React.createElement("div", { className: "empty-text" }, "No completed workouts yet.\nFinish a session to see it here.")
            )
          : React.createElement("div", null,

              // ── TODAY section ──────────────────
              todayItems.length > 0 && React.createElement("div", null,
                React.createElement("div", { className: "history-date-header" },
                  React.createElement("span", { className: "history-date-label today-label" }, "TODAY"),
                  React.createElement("span", { className: "history-date-count" }, `${todayItems.length} session${todayItems.length > 1 ? "s" : ""}`)
                ),
                React.createElement("div", { className: "card", style: { marginBottom: 20 } },
                  ...todayItems.map(item => React.createElement(WorkoutCard, { key: item.id, item }))
                )
              ),

              // ── PAST sessions grouped by date ──
              Object.keys(pastByDate).map(dateLabel =>
                React.createElement("div", { key: dateLabel },
                  React.createElement("div", { className: "history-date-header" },
                    React.createElement("span", { className: "history-date-label" }, dateLabel),
                    React.createElement("span", { className: "history-date-count" }, `${pastByDate[dateLabel].length} session${pastByDate[dateLabel].length > 1 ? "s" : ""}`)
                  ),
                  React.createElement("div", { className: "card", style: { marginBottom: 16 } },
                    ...pastByDate[dateLabel].map(item => React.createElement(WorkoutCard, { key: item.id, item }))
                  )
                )
              )
            )
    )
  );
}