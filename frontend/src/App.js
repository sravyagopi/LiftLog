// ═══════════════════════════════════════════════
// src/App.js — Root component: auth gate, routing, context provider
// ═══════════════════════════════════════════════

const { useState, useEffect } = React;

// Screens that should NOT show the bottom tab bar
const NO_TAB_SCREENS = new Set(["workout"]);

function App() {
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [screen,      setScreen]      = useState("home");
  const [screenParams,setScreenParams]= useState({});

  // ── Auth helpers ─────────────────────────────
  async function refreshUser() {
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      setUser(null);
      clearToken();
    }
  }

  function logout() {
    clearToken();
    setUser(null);
    setScreen("home");
    setScreenParams({});
  }

  // ── Navigation ───────────────────────────────
  function navigate(s, params = {}) {
    setScreen(s);
    setScreenParams(params);
  }

  // ── Bootstrap: check saved token ─────────────
  useEffect(() => {
    if (getToken()) {
      refreshUser().finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  // ── Loading splash ───────────────────────────
  if (authLoading) {
    return React.createElement(
      "div",
      { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" } },
      React.createElement("span", { className: "spinner" })
    );
  }

  // ── Context value ────────────────────────────
  const ctx = { user, refreshUser, logout, navigate };

  // ── Auth gate ────────────────────────────────
  if (!user) {
    return React.createElement(
      AppCtx.Provider, { value: ctx },
      React.createElement(AuthScreen)
    );
  }

  // ── Screen router ────────────────────────────
  let content;
  switch (screen) {
    case "home":      content = React.createElement(HomeScreen,      { navigate }); break;
    case "exercises": content = React.createElement(ExercisesScreen, { navigate }); break;
    case "templates": content = React.createElement(TemplatesScreen, { navigate }); break;
    case "workout":   content = React.createElement(WorkoutScreen,   { params: screenParams, navigate }); break;
    case "progress":  content = React.createElement(ProgressScreen,  { navigate }); break;
    case "history":   content = React.createElement(HistoryScreen,   { navigate }); break;
    case "profile":   content = React.createElement(ProfileScreen,   { navigate }); break;
    default:          content = React.createElement(HomeScreen,      { navigate });
  }

  return React.createElement(
    AppCtx.Provider, { value: ctx },
    React.createElement(
      "div", { className: "screen" },
      content,
      !NO_TAB_SCREENS.has(screen) && React.createElement(TabBar, { screen, navigate })
    )
  );
}

// ── Mount ───────────────────────────────────────
ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(App)
);