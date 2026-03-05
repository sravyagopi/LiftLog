// ═══════════════════════════════════════════════
// src/screens/ExercisesScreen.js — Exercise CRUD
// ═══════════════════════════════════════════════

const { useState: useExState, useEffect: useExEffect } = React;

function ExercisesScreen({ navigate }) {
  const [exercises,  setExercises]  = useExState([]);
  const [showModal,  setShowModal]  = useExState(false);
  const [editing,    setEditing]    = useExState(null);
  const [form,       setForm]       = useExState({ name: "", category: "", notes: "" });
  const [loading,    setLoading]    = useExState(true);

  useExEffect(() => {
    api.exercises.list().then(setExercises).finally(() => setLoading(false));
  }, []);

  function openAdd()   { setEditing(null); setForm({ name: "", category: "", notes: "" }); setShowModal(true); }
  function openEdit(ex){ setEditing(ex);   setForm({ name: ex.name, category: ex.category || "", notes: ex.notes || "" }); setShowModal(true); }

  async function save() {
    if (!form.name) return;
    try {
      if (editing) {
        const updated = await api.exercises.update(editing.id, form);
        setExercises(prev => prev.map(e => e.id === editing.id ? updated : e));
      } else {
        const created = await api.exercises.create(form);
        setExercises(prev => [...prev, created]);
      }
      setShowModal(false);
    } catch (e) { alert(e.message); }
  }

  async function del(id) {
    if (!confirm("Delete this exercise?")) return;
    await api.exercises.delete(id);
    setExercises(prev => prev.filter(e => e.id !== id));
  }

  return React.createElement(
    "div", { className: "screen safe-top" },

    React.createElement(
      "div", { className: "nav-bar" },
      React.createElement("button", { className: "nav-btn", onClick: () => navigate("home") }, "← Back"),
      React.createElement("div", { className: "nav-sub" }, "Exercises"),
      React.createElement("button", { className: "nav-btn accent", onClick: openAdd }, "+ Add")
    ),

    React.createElement(
      "div", { className: "scroll-content" },
      loading
        ? React.createElement("div", { style: { textAlign: "center", padding: 40 } }, React.createElement("span", { className: "spinner" }))
        : exercises.length === 0
          ? React.createElement(
              "div", { className: "empty" },
              React.createElement("div", { className: "empty-icon" }, "💪"),
              React.createElement("div", { className: "empty-text" }, "No exercises yet.\nTap + Add to create your first.")
            )
          : React.createElement(
              "div", { className: "card", style: { marginTop: 16 } },
              ...exercises.map(ex =>
                React.createElement(
                  "div", { key: ex.id, className: "card-row" },
                  React.createElement(
                    "div", null,
                    React.createElement("div", { className: "card-title" }, ex.name),
                    ex.category && React.createElement("div", { className: "card-sub" }, ex.category)
                  ),
                  React.createElement(
                    "div", { style: { display: "flex", gap: 8 } },
                    React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => openEdit(ex) }, "Edit"),
                    React.createElement("button", { className: "btn btn-danger btn-sm",    onClick: () => del(ex.id)   }, "✕")
                  )
                )
              )
            )
    ),

    // Add / Edit modal
    showModal && React.createElement(
      Modal,
      { title: editing ? "Edit Exercise" : "New Exercise", onClose: () => setShowModal(false) },
      React.createElement(
        "div", { className: "input-group" },
        React.createElement("label", { className: "input-label" }, "Name"),
        React.createElement("input", { className: "input", placeholder: "e.g. Bench Press", value: form.name, onChange: e => setForm(p => ({...p, name: e.target.value})) })
      ),
      React.createElement(
        "div", { className: "input-group" },
        React.createElement("label", { className: "input-label" }, "Category (optional)"),
        React.createElement("input", { className: "input", placeholder: "e.g. Chest, Back, Legs", value: form.category, onChange: e => setForm(p => ({...p, category: e.target.value})) })
      ),
      React.createElement(
        "div", { className: "input-group" },
        React.createElement("label", { className: "input-label" }, "Notes (optional)"),
        React.createElement("input", { className: "input", placeholder: "Cues, form tips...", value: form.notes, onChange: e => setForm(p => ({...p, notes: e.target.value})) })
      ),
      React.createElement("button", { className: "btn btn-primary", onClick: save }, editing ? "Save Changes" : "Create Exercise")
    )
  );
}