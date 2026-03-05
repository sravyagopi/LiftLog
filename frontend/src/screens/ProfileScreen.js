// ═══════════════════════════════════════════════
// src/screens/ProfileScreen.js — User profile & logout
// ═══════════════════════════════════════════════

const { useState: useProfileState, useEffect: useProfileEffect } = React;

function ProfileScreen({ navigate }) {
  const { user, logout } = useApp();
  const [stats,   setStats]   = useProfileState(null);
  const [loading, setLoading] = useProfileState(true);

  // Pull history to show summary stats
  useProfileEffect(() => {
    api.workouts.history()
      .then(history => {
        const totalSets      = history.reduce((a, w) => a + w.set_count, 0);
        const totalWorkouts  = history.length;
        const durations      = history
          .filter(w => w.end_time)
          .map(w => (new Date(w.end_time) - new Date(w.start_time)) / 60000);
        const avgDuration    = durations.length
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0;
        setStats({ totalWorkouts, totalSets, avgDuration });
      })
      .catch(() => setStats({ totalWorkouts: 0, totalSets: 0, avgDuration: 0 }))
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    if (confirm("Sign out of LiftLog?")) logout();
  }

  return React.createElement(
    "div", { className: "screen safe-top" },

    React.createElement(
      "div", { className: "nav-bar" },
      React.createElement("button", { className: "nav-btn", onClick: () => navigate("home") }, "← Back"),
      React.createElement("div", { className: "nav-sub" }, "Profile"),
      React.createElement("div", { style: { width: 48 } })  // spacer to center title
    ),

    React.createElement(
      "div", { className: "scroll-content" },

      // Avatar + username
      React.createElement(
        "div", { style: { marginTop: 24 } },
        React.createElement("div", { className: "profile-avatar" }, "🏋️"),
        React.createElement("div", { className: "profile-username" }, user?.username || ""),
        React.createElement("div", { className: "profile-since" },
          `Member since ${user?.created_at ? formatDate(user.created_at) : "—"}`
        )
      ),

      // Stats cards
      React.createElement("div", { className: "section-header" }, "Your Stats"),
      loading
        ? React.createElement("div", { style: { textAlign: "center", padding: 20 } }, React.createElement("span", { className: "spinner" }))
        : React.createElement(
            "div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 } },
            [
              ["🏆", stats?.totalWorkouts, "Workouts"],
              ["💪", stats?.totalSets,     "Total Sets"],
              ["⏱",  stats?.avgDuration ? `${stats.avgDuration}m` : "—", "Avg Duration"],
            ].map(([icon, val, label]) =>
              React.createElement(
                "div", { key: label, className: "card" },
                React.createElement(
                  "div", { style: { padding: "16px 12px", textAlign: "center" } },
                  React.createElement("div", { style: { fontSize: 24, marginBottom: 4 } }, icon),
                  React.createElement("div", { style: { fontFamily: "var(--font-display)", fontSize: 26, color: "var(--accent)" } }, val ?? "—"),
                  React.createElement("div", { style: { fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px" } }, label)
                )
              )
            )
          ),

      // Quick links
      React.createElement("div", { className: "section-header" }, "Navigate"),
      React.createElement(
        "div", { className: "card", style: { marginBottom: 16 } },
        [
          ["💪", "Exercises",  "exercises"],
          ["📋", "Templates",  "templates"],
          ["📈", "Progress",   "progress"],
          ["🕐", "History",    "history"],
        ].map(([icon, label, screen]) =>
          React.createElement(
            "div", { key: screen, className: "card-row", style: { cursor: "pointer" }, onClick: () => navigate(screen) },
            React.createElement(
              "div", { style: { display: "flex", alignItems: "center", gap: 12 } },
              React.createElement("span", { style: { fontSize: 20 } }, icon),
              React.createElement("div", { className: "card-title" }, label)
            ),
            React.createElement("span", { style: { color: "var(--muted)" } }, "→")
          )
        )
      ),

      // Logout button
      React.createElement("div", { className: "section-header" }, "Account"),
      React.createElement(
        "div", { className: "card", style: { marginBottom: 32 } },
        React.createElement(
          "div", {
            className: "card-row",
            style: { cursor: "pointer" },
            onClick: handleLogout,
          },
          React.createElement(
            "div", { style: { display: "flex", alignItems: "center", gap: 12 } },
            React.createElement("span", { style: { fontSize: 20 } }, "🚪"),
            React.createElement("div", { className: "card-title", style: { color: "var(--danger)" } }, "Sign Out")
          ),
          React.createElement("span", { style: { color: "var(--danger)", fontSize: 16 } }, "→")
        )
      )
    )
  );
}