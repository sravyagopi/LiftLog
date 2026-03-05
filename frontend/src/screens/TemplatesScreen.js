// ═══════════════════════════════════════════════
// src/screens/TemplatesScreen.js — Workout template builder
// ═══════════════════════════════════════════════

const { useState: useTplState, useEffect: useTplEffect } = React;

function TemplatesScreen({ navigate }) {
  const [templates,  setTemplates]  = useTplState([]);
  const [exercises,  setExercises]  = useTplState([]);
  const [selected,   setSelected]   = useTplState(null);  // template being viewed/edited
  const [showNew,    setShowNew]    = useTplState(false);
  const [newName,    setNewName]    = useTplState("");
  const [showAddEx,  setShowAddEx]  = useTplState(false);
  const [loading,    setLoading]    = useTplState(true);

  useTplEffect(() => {
    Promise.all([api.templates.list(), api.exercises.list()])
      .then(([t, e]) => { setTemplates(t); setExercises(e); })
      .finally(() => setLoading(false));
  }, []);

  async function createTemplate() {
    if (!newName.trim()) return;
    const t = await api.templates.create({ name: newName.trim() });
    setTemplates(p => [...p, t]);
    setNewName("");
    setShowNew(false);
  }

  async function deleteTemplate(id) {
    if (!confirm("Delete this template?")) return;
    await api.templates.delete(id);
    setTemplates(p => p.filter(t => t.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  async function addExercise(exId) {
    const idx = selected.template_exercises.length;
    const updated = await api.templates.addExercise(selected.id, { exercise_id: exId, order_index: idx });
    setSelected(updated);
    setTemplates(p => p.map(t => t.id === updated.id ? updated : t));
  }

  async function removeExercise(exId) {
    const updated = await api.templates.removeExercise(selected.id, exId);
    setSelected(updated);
    setTemplates(p => p.map(t => t.id === updated.id ? updated : t));
  }

  // ── Detail view ──────────────────────────────
  if (selected) {
    const usedIds = new Set(selected.template_exercises.map(te => te.exercise_id));
    const available = exercises.filter(e => !usedIds.has(e.id));

    return React.createElement(
      "div", { className: "screen safe-top" },
      React.createElement(
        "div", { className: "nav-bar" },
        React.createElement("button", { className: "nav-btn", onClick: () => setSelected(null) }, "← Back"),
        React.createElement("div", { className: "nav-sub" }, selected.name),
        React.createElement("button", { className: "nav-btn accent", onClick: () => setShowAddEx(true) }, "+ Add")
      ),
      React.createElement(
        "div", { className: "scroll-content" },
        React.createElement("div", { className: "section-header" }, `${selected.template_exercises.length} exercises`),
        selected.template_exercises.length === 0
          ? React.createElement(
              "div", { className: "empty" },
              React.createElement("div", { className: "empty-icon" }, "📋"),
              React.createElement("div", { className: "empty-text" }, "No exercises yet.\nTap + Add to build this template.")
            )
          : React.createElement(
              "div", { className: "card" },
              ...selected.template_exercises.map((te, i) =>
                React.createElement(
                  "div", { key: te.id, className: "card-row" },
                  React.createElement(
                    "div", { style: { display: "flex", alignItems: "center", gap: 12 } },
                    React.createElement("span", { style: { fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: 13 } }, i + 1),
                    React.createElement("div", { className: "card-title" }, te.exercise.name)
                  ),
                  React.createElement("button", { className: "btn btn-danger btn-sm", onClick: () => removeExercise(te.exercise_id) }, "✕")
                )
              )
            )
      ),

      // Add exercise modal
      showAddEx && React.createElement(
        Modal,
        { title: "Add Exercise", onClose: () => setShowAddEx(false) },
        available.length === 0
          ? React.createElement("div", { style: { color: "var(--muted)", textAlign: "center", padding: "20px 0" } }, "All exercises already added")
          : available.map(ex =>
              React.createElement(
                "div", {
                  key: ex.id,
                  className: "card",
                  style: { marginBottom: 8, cursor: "pointer" },
                  onClick: () => { addExercise(ex.id); setShowAddEx(false); },
                },
                React.createElement(
                  "div", { className: "card-row" },
                  React.createElement(
                    "div", null,
                    React.createElement("div", { className: "card-title" }, ex.name),
                    ex.category && React.createElement("div", { className: "card-sub" }, ex.category)
                  ),
                  React.createElement("span", { style: { color: "var(--accent)", fontSize: 20 } }, "+")
                )
              )
            )
      )
    );
  }

  // ── List view ────────────────────────────────
  return React.createElement(
    "div", { className: "screen safe-top" },
    React.createElement(
      "div", { className: "nav-bar" },
      React.createElement("button", { className: "nav-btn", onClick: () => navigate("home") }, "← Back"),
      React.createElement("div", { className: "nav-sub" }, "Templates"),
      React.createElement("button", { className: "nav-btn accent", onClick: () => setShowNew(true) }, "+ New")
    ),
    React.createElement(
      "div", { className: "scroll-content" },
      loading
        ? React.createElement("div", { style: { textAlign: "center", padding: 40 } }, React.createElement("span", { className: "spinner" }))
        : templates.length === 0
          ? React.createElement(
              "div", { className: "empty" },
              React.createElement("div", { className: "empty-icon" }, "📋"),
              React.createElement("div", { className: "empty-text" }, "No templates yet.\nCreate your first workout day.")
            )
          : React.createElement(
              "div", { className: "card", style: { marginTop: 16 } },
              ...templates.map(t =>
                React.createElement(
                  "div", { key: t.id, className: "card-row", style: { cursor: "pointer" }, onClick: () => setSelected(t) },
                  React.createElement(
                    "div", null,
                    React.createElement("div", { className: "card-title" }, t.name),
                    React.createElement("div", { className: "card-sub" }, `${t.template_exercises.length} exercise${t.template_exercises.length !== 1 ? "s" : ""}`)
                  ),
                  React.createElement(
                    "div", { style: { display: "flex", gap: 8, alignItems: "center" } },
                    React.createElement("span", { style: { color: "var(--muted)" } }, "→"),
                    React.createElement("button", { className: "btn btn-danger btn-sm", onClick: e => { e.stopPropagation(); deleteTemplate(t.id); } }, "✕")
                  )
                )
              )
            )
    ),

    // New template modal
    showNew && React.createElement(
      Modal,
      { title: "New Template", onClose: () => setShowNew(false) },
      React.createElement(
        "div", { className: "input-group" },
        React.createElement("label", { className: "input-label" }, "Template Name"),
        React.createElement("input", {
          className: "input",
          placeholder: "e.g. Pull Day, Push Day, Legs...",
          value: newName,
          onChange: e => setNewName(e.target.value),
          autoFocus: true,
          onKeyDown: e => e.key === "Enter" && createTemplate(),
        })
      ),
      React.createElement("button", { className: "btn btn-primary", onClick: createTemplate }, "Create Template")
    )
  );
}