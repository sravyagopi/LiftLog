// ═══════════════════════════════════════════════
// src/components/TabBar.js — Bottom navigation tab bar
// ═══════════════════════════════════════════════

function TabBar({ screen, navigate }) {
  const tabs = [
    { id: "home",      icon: "🏠", label: "Home"      },
    { id: "exercises", icon: "💪", label: "Exercises"  },
    { id: "templates", icon: "📋", label: "Templates"  },
    { id: "progress",  icon: "📈", label: "Progress"   },
    { id: "profile",   icon: "👤", label: "Profile"    },
  ];

  return React.createElement(
    "div",
    { className: "tab-bar" },
    ...tabs.map(t =>
      React.createElement(
        "div",
        {
          key: t.id,
          className: `tab-item ${screen === t.id ? "active" : ""}`,
          onClick: () => navigate(t.id),
        },
        React.createElement("span", { className: "tab-icon" }, t.icon),
        React.createElement("span", { className: "tab-label" }, t.label)
      )
    )
  );
}