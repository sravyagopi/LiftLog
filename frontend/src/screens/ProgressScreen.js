// ═══════════════════════════════════════════════
// src/screens/ProgressScreen.js — Exercise progress charts
// ═══════════════════════════════════════════════

const { useState: usePrgState, useEffect: usePrgEffect } = React;

function ProgressScreen({ navigate }) {
  const [exercises,     setExercises]     = usePrgState([]);
  const [selected,      setSelected]      = usePrgState(null);
  const [progressData,  setProgressData]  = usePrgState(null);
  const [loading,       setLoading]       = usePrgState(true);
  const [chartLoading,  setChartLoading]  = usePrgState(false);

  usePrgEffect(() => {
    api.exercises.list().then(setExercises).finally(() => setLoading(false));
  }, []);

  async function loadProgress(ex) {
    setSelected(ex);
    setProgressData(null);
    setChartLoading(true);
    const data = await api.progress.exercise(ex.id).catch(() => null);
    setProgressData(data);
    setChartLoading(false);
  }

  function goBack() {
    if (selected) { setSelected(null); setProgressData(null); }
    else navigate("home");
  }

  // ── Exercise detail ──────────────────────────
  if (selected) {
    return React.createElement(
      "div", { className: "screen safe-top" },
      React.createElement(
        "div", { className: "nav-bar" },
        React.createElement("button", { className: "nav-btn", onClick: goBack }, "← Back"),
        React.createElement("div", { className: "nav-sub" }, selected.name)
      ),
      React.createElement(
        "div", { className: "scroll-content" },
        React.createElement(
          "div", { style: { marginTop: 16 } },
          React.createElement(
            "div", { className: "chart-wrap" },
            React.createElement("div", { className: "chart-title" }, "Max Weight (lbs)"),
            chartLoading
              ? React.createElement("div", { style: { textAlign: "center", padding: 20 } }, React.createElement("span", { className: "spinner" }))
              : React.createElement(LineChart, { data: progressData?.data })
          ),

          // Table
          progressData?.data?.length > 0 && React.createElement(
            "div", { className: "card" },
            React.createElement(
              "div", { className: "card-row" },
              React.createElement("div", { className: "card-sub" }, "Date"),
              React.createElement("div", { className: "card-sub" }, "Max Weight"),
              React.createElement("div", { className: "card-sub" }, "Total Reps")
            ),
            ...[...(progressData.data)].reverse().map((d, i) =>
              React.createElement(
                "div", { key: i, className: "card-row" },
                React.createElement("div", { style: { fontFamily: "var(--font-mono)", fontSize: 13 } }, formatDate(d.date)),
                React.createElement("div", { style: { fontWeight: 600 } }, `${d.max_weight} lbs`),
                React.createElement("div", { style: { color: "var(--muted)", fontSize: 13 } }, `${d.total_reps} reps`)
              )
            )
          )
        )
      )
    );
  }

  // ── Exercise list ────────────────────────────
  return React.createElement(
    "div", { className: "screen safe-top" },
    React.createElement(
      "div", { className: "nav-bar" },
      React.createElement("button", { className: "nav-btn", onClick: () => navigate("home") }, "← Back"),
      React.createElement("div", { className: "nav-sub" }, "Progress")
    ),
    React.createElement(
      "div", { className: "scroll-content" },
      React.createElement("div", { className: "section-header" }, "Select an Exercise"),
      loading
        ? React.createElement("div", { style: { textAlign: "center", padding: 40 } }, React.createElement("span", { className: "spinner" }))
        : exercises.length === 0
          ? React.createElement(
              "div", { className: "empty" },
              React.createElement("div", { className: "empty-icon" }, "📈"),
              React.createElement("div", { className: "empty-text" }, "No exercises found.\nCreate some and start logging.")
            )
          : React.createElement(
              "div", { className: "card" },
              ...exercises.map(ex =>
                React.createElement(
                  "div", { key: ex.id, className: "card-row", style: { cursor: "pointer" }, onClick: () => loadProgress(ex) },
                  React.createElement(
                    "div", null,
                    React.createElement("div", { className: "card-title" }, ex.name),
                    ex.category && React.createElement("div", { className: "card-sub" }, ex.category)
                  ),
                  React.createElement("span", { style: { color: "var(--muted)" } }, "→")
                )
              )
            )
    )
  );
}