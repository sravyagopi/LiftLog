// ═══════════════════════════════════════════════
// src/screens/HomeScreen.js — Dashboard / workout launcher
// ═══════════════════════════════════════════════

const { useState: useHomeState, useEffect: useHomeEffect } = React;

function HomeScreen({ navigate }) {
  const { user } = useApp();
  const [templates,      setTemplates]      = useHomeState([]);
  const [activeSession,  setActiveSession]  = useHomeState(null);
  const [loading,        setLoading]        = useHomeState(true);

  useHomeEffect(() => {
    Promise.all([
      api.templates.list().then(setTemplates).catch(() => {}),
      api.workouts.active().then(setActiveSession).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return React.createElement(
      "div", { className: "screen loading-screen" },
      React.createElement("span", { className: "spinner" })
    );
  }

  return React.createElement(
    "div", { className: "screen safe-top" },

    // Nav bar
    React.createElement(
      "div", { className: "nav-bar" },
      React.createElement("div", { className: "nav-title" }, "LIFTLOG"),
      React.createElement("span", { style: { fontSize: 13, color: "var(--muted)" } }, `Hey, ${user?.username} 👋`)
    ),

    React.createElement(
      "div", { className: "scroll-content" },

      // Active workout banner
      activeSession && React.createElement(
        "div", { style: { marginTop: 16 } },
        React.createElement("div", { className: "section-header" }, "⚡ Active Workout"),
        React.createElement(
          "div", {
            className: "card",
            style: { cursor: "pointer" },
            onClick: () => navigate("workout", { sessionId: activeSession.id, templateId: activeSession.template_id }),
          },
          React.createElement(
            "div", { className: "card-row" },
            React.createElement(
              "div", null,
              React.createElement("div", { className: "card-title" }, "Continue Workout"),
              React.createElement("div", { className: "card-sub" }, `${activeSession.sets.length} sets logged`)
            ),
            React.createElement("span", { className: "badge" }, "LIVE")
          )
        )
      ),

      // Workout templates
      React.createElement("div", { className: "section-header" }, "Start a Workout"),
      templates.length === 0
        ? React.createElement(
            "div", { className: "empty" },
            React.createElement("div", { className: "empty-icon" }, "🏋️"),
            React.createElement("div", { className: "empty-text" }, "No templates yet.\nCreate one in Templates to start logging.")
          )
        : templates.map(t =>
            React.createElement(
              "div", {
                key: t.id,
                className: "card",
                style: { marginBottom: 10, cursor: "pointer" },
                onClick: async () => {
                  try {
                    const session = await api.workouts.start(t.id);
                    navigate("workout", { sessionId: session.id, templateId: t.id });
                  } catch (e) { alert(e.message); }
                },
              },
              React.createElement(
                "div", { className: "card-row" },
                React.createElement(
                  "div", null,
                  React.createElement("div", { className: "card-title" }, t.name),
                  React.createElement("div", { className: "card-sub" }, `${t.template_exercises.length} exercise${t.template_exercises.length !== 1 ? "s" : ""}`)
                ),
                React.createElement("span", { style: { fontSize: 22 } }, "▶")
              )
            )
          ),

      // Quick-action grid
      React.createElement("div", { className: "section-header" }, "Quick Actions"),
      React.createElement(
        "div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
        [
          ["💪", "Exercises",  "exercises"],
          ["📋", "Templates",  "templates"],
          ["📈", "Progress",   "progress"],
          ["🕐", "History",    "history"],
        ].map(([icon, label, screen]) =>
          React.createElement(
            "div", { key: screen, className: "card", style: { cursor: "pointer" }, onClick: () => navigate(screen) },
            React.createElement(
              "div", { style: { padding: "18px 16px" } },
              React.createElement("div", { style: { fontSize: 28, marginBottom: 4 } }, icon),
              React.createElement("div", { style: { fontWeight: 600, fontSize: 14 } }, label)
            )
          )
        )
      )
    )
  );
}