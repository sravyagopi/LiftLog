// ═══════════════════════════════════════════════
// src/screens/AuthScreen.js — Login & Register
// ═══════════════════════════════════════════════

const { useState: useAuthState } = React;

function AuthScreen() {
  const { refreshUser } = useApp();
  const [tab,      setTab]      = useAuthState("login");
  const [username, setUsername] = useAuthState("");
  const [password, setPassword] = useAuthState("");
  const [error,    setError]    = useAuthState("");
  const [loading,  setLoading]  = useAuthState(false);

  async function handleSubmit() {
    if (!username || !password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");
    try {
      const res = tab === "login"
        ? await api.login(username, password)
        : await api.register(username, password);
      setToken(res.access_token);
      await refreshUser();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return React.createElement(
    "div",
    { className: "screen auth-bg safe-top" },

    // Logo
    React.createElement("div", { className: "auth-logo" }, "LIFT"),
    React.createElement("div", { className: "auth-logo", style: { color: "var(--text)", marginTop: -10 } }, "LOG"),
    React.createElement("div", { className: "auth-tagline" }, "Track every rep. Own every PR."),

    // Form
    React.createElement(
      "div",
      { className: "auth-form" },

      // Tabs
      React.createElement(
        "div",
        { className: "auth-tabs" },
        React.createElement("div", { className: `auth-tab ${tab === "login" ? "active" : ""}`,    onClick: () => setTab("login")    }, "Sign In"),
        React.createElement("div", { className: `auth-tab ${tab === "register" ? "active" : ""}`, onClick: () => setTab("register") }, "Create Account")
      ),

      error && React.createElement("div", { className: "error-msg" }, error),

      React.createElement(
        "div", { className: "input-group" },
        React.createElement("label", { className: "input-label" }, "Username"),
        React.createElement("input", {
          className: "input",
          placeholder: "your_username",
          value: username,
          onChange: e => setUsername(e.target.value),
          onKeyDown: e => e.key === "Enter" && handleSubmit(),
        })
      ),

      React.createElement(
        "div", { className: "input-group" },
        React.createElement("label", { className: "input-label" }, "Password"),
        React.createElement("input", {
          className: "input",
          type: "password",
          placeholder: "••••••••",
          value: password,
          onChange: e => setPassword(e.target.value),
          onKeyDown: e => e.key === "Enter" && handleSubmit(),
        })
      ),

      React.createElement(
        "div", { style: { marginTop: 8 } },
        React.createElement(
          "button",
          { className: "btn btn-primary", onClick: handleSubmit, disabled: loading },
          loading
            ? React.createElement("span", { className: "spinner" })
            : (tab === "login" ? "Sign In →" : "Create Account →")
        )
      )
    )
  );
}