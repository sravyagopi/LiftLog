// ═══════════════════════════════════════════════
// src/screens/WorkoutScreen.js — Live workout logging with timer
//   • Timer counts UP from 0:00 from the moment the session starts
//   • Exercises can be added/removed live during the workout
//   • New exercises can be created on the fly
// ═══════════════════════════════════════════════

const { useState: useWkState, useEffect: useWkEffect, useRef: useWkRef } = React;

// ── Format elapsed seconds → "mm:ss" or "h:mm:ss" ──────────────
function formatElapsed(totalSeconds) {
  const h  = Math.floor(totalSeconds / 3600);
  const m  = Math.floor((totalSeconds % 3600) / 60);
  const s  = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function WorkoutScreen({ params, navigate }) {
  const { sessionId, templateId } = params;

  const [session,        setSession]       = useWkState(null);
  const [workoutName,    setWorkoutName]   = useWkState("Workout");
  // activeExercises: ordered list of { id, name, category } objects actually in this session
  const [activeExercises,setActiveExercises] = useWkState([]);
  const [allExercises,   setAllExercises]  = useWkState([]);  // user's full exercise library
  const [prevSets,       setPrevSets]      = useWkState({});  // { exerciseId: [set,...] }
  const [sets,           setSets]          = useWkState({});  // { exerciseId: [set,...] }
  const [loading,        setLoading]       = useWkState(true);
  const [completing,     setCompleting]    = useWkState(false);
  const [done,           setDone]          = useWkState(false);

  // ── Timer: counts up from 0 ──────────────────
  const [elapsed,        setElapsed]       = useWkState(0);
  const [finalDuration,  setFinalDuration] = useWkState(0);
  const timerRef  = useWkRef(null);
  const startRef  = useWkRef(null);  // epoch ms when session actually started

  // ── Add-exercise modal ───────────────────────
  const [showAddEx,      setShowAddEx]     = useWkState(false);
  // New-exercise inline form inside the modal
  const [newExForm,      setNewExForm]     = useWkState({ open: false, name: "", category: "" });

  // ── Boot: load session + start timer from 0 ──
  useWkEffect(() => {
    Promise.all([
      api.workouts.get(sessionId),
      api.templates.list().then(ts => ts.find(t => t.id === templateId)).catch(() => null),
      api.exercises.list(),
    ]).then(([sess, tmpl, allEx]) => {
      setSession(sess);
      setAllExercises(allEx);
      if (tmpl) setWorkoutName(tmpl.name);

      // Build the ordered exercise list from template
      const templateExercises = tmpl ? tmpl.template_exercises.map(te => te.exercise) : [];

      // Group any existing sets (resume support)
      const grouped = {};
      for (const s of sess.sets) {
        if (!grouped[s.exercise_id]) grouped[s.exercise_id] = [];
        grouped[s.exercise_id].push(s);
      }
      setSets(grouped);

      // If resuming, also include any exercises that already have sets but aren't in template
      const extraIds = Object.keys(grouped).filter(id => !templateExercises.find(e => e.id === id));
      const extraExercises = allEx.filter(e => extraIds.includes(e.id));
      setActiveExercises([...templateExercises, ...extraExercises]);

      // Start timer from 0 based on actual session start_time
      const startMs = new Date(sess.start_time).getTime();
      startRef.current = startMs;
      // Count up: elapsed = now - start (already positive, growing)
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);

      // Prefetch previous sets for each template exercise
      templateExercises.forEach(ex => {
        api.workouts.previousSets(ex.id)
          .then(ps => setPrevSets(p => ({ ...p, [ex.id]: ps })))
          .catch(() => {});
      });
    }).finally(() => setLoading(false));

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Add an exercise from library to this workout ──
  function addExerciseToWorkout(ex) {
    if (activeExercises.find(e => e.id === ex.id)) return; // already present
    setActiveExercises(p => [...p, ex]);
    // Fetch previous sets for it
    api.workouts.previousSets(ex.id)
      .then(ps => setPrevSets(p => ({ ...p, [ex.id]: ps })))
      .catch(() => {});
    setShowAddEx(false);
  }

  // ── Create a brand-new exercise and add it ────
  async function createAndAddExercise() {
    if (!newExForm.name.trim()) return;
    try {
      const created = await api.exercises.create({ name: newExForm.name.trim(), category: newExForm.category.trim() || null });
      setAllExercises(p => [...p, created]);
      addExerciseToWorkout(created);
      setNewExForm({ open: false, name: "", category: "" });
      setShowAddEx(false);
    } catch (e) { alert(e.message); }
  }

  // ── Remove exercise from this session's view ──
  function removeExerciseFromWorkout(exId) {
    if (!confirm("Remove this exercise? Any sets logged will still be saved.")) return;
    setActiveExercises(p => p.filter(e => e.id !== exId));
  }

  // ── Set CRUD ─────────────────────────────────
  async function addSet(exId) {
    const exSets = sets[exId] || [];
    const last   = exSets[exSets.length - 1];
    const weight = last ? last.weight : 0;
    const reps   = last ? last.reps   : 8;
    const newSet = await api.workouts.addSet(sessionId, {
      exercise_id: exId,
      set_number: exSets.length + 1,
      weight,
      reps,
    });
    setSets(p => ({ ...p, [exId]: [...(p[exId] || []), newSet] }));
  }

  async function updateSetField(exId, setId, field, value) {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const updated = await api.workouts.updateSet(sessionId, setId, { [field]: num });
    setSets(p => ({ ...p, [exId]: p[exId].map(s => s.id === setId ? updated : s) }));
  }

  async function deleteSet(exId, setId) {
    await api.workouts.deleteSet(sessionId, setId);
    setSets(p => ({ ...p, [exId]: p[exId].filter(s => s.id !== setId) }));
  }

  // ── Finish workout: stop timer, freeze ───────
  async function complete() {
    setCompleting(true);
    try {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      const frozen = Math.floor((Date.now() - startRef.current) / 1000);
      setFinalDuration(frozen);
      setElapsed(frozen);
      const updated = await api.workouts.complete(sessionId);
      setSession(updated);
      setDone(true);
    } catch (e) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
      alert(e.message);
    }
    setCompleting(false);
  }

  // ════════════════════════════════════════════
  // RENDER: Loading
  // ════════════════════════════════════════════
  if (loading) {
    return React.createElement("div", { className: "screen loading-screen" },
      React.createElement("span", { className: "spinner" })
    );
  }

  // ════════════════════════════════════════════
  // RENDER: Completion summary
  // ════════════════════════════════════════════
  if (done) {
    const totalSets = Object.values(sets).reduce((a, arr) => a + arr.length, 0);
    const exCount   = Object.keys(sets).filter(k => sets[k].length > 0).length;
    const h = Math.floor(finalDuration / 3600);
    const m = Math.floor((finalDuration % 3600) / 60);
    const s = finalDuration % 60;
    const durationShort = h > 0 ? `${h}h${m}m` : m > 0 ? `${m}m` : `${s}s`;
    const durationLong  = h > 0 ? `${h} hr ${m} min ${s} sec` : m > 0 ? `${m} min ${s} sec` : `${s} seconds`;

    return React.createElement("div", { className: "screen safe-top" },
      React.createElement("div", { className: "complete-screen" },
        React.createElement("div", { className: "complete-icon" }, "🏆"),
        React.createElement("div", { className: "complete-title" }, "CRUSHED IT"),
        React.createElement("div", { style: { color: "var(--muted)", marginTop: 8, fontSize: 15 } }, workoutName),
        React.createElement("div", { className: "complete-stats" },
          React.createElement("div", { className: "complete-stat" },
            React.createElement("div", { className: "complete-stat-val" }, exCount),
            React.createElement("div", { className: "complete-stat-label" }, "Exercises")
          ),
          React.createElement("div", { className: "complete-stat" },
            React.createElement("div", { className: "complete-stat-val" }, totalSets),
            React.createElement("div", { className: "complete-stat-label" }, "Sets")
          ),
          React.createElement("div", { className: "complete-stat" },
            React.createElement("div", { className: "complete-stat-val" }, durationShort),
            React.createElement("div", { className: "complete-stat-label" }, "Duration")
          )
        ),
        React.createElement("div", { className: "duration-pill" },
          React.createElement("span", { className: "duration-pill-clock" }, formatElapsed(finalDuration)),
          React.createElement("span", { className: "duration-pill-sep" }, "·"),
          React.createElement("span", { className: "duration-pill-text" }, durationLong)
        ),
        React.createElement("button", {
          className: "btn btn-primary",
          style: { marginTop: 24 },
          onClick: () => navigate("home"),
        }, "Back to Home")
      )
    );
  }

  // ════════════════════════════════════════════
  // RENDER: Live logging
  // ════════════════════════════════════════════
  const totalSetsLogged = Object.values(sets).reduce((a, arr) => a + arr.length, 0);
  const availableToAdd  = allExercises.filter(e => !activeExercises.find(a => a.id === e.id));

  return React.createElement("div", { className: "screen safe-top" },

    // ── Nav bar ─────────────────────────────────
    React.createElement("div", { className: "nav-bar" },
      React.createElement("button", {
        className: "nav-btn danger",
        onClick: () => { if (confirm("Quit workout? Progress is saved.")) navigate("home"); },
      }, "Quit"),

      React.createElement("div", { style: { textAlign: "center" } },
        React.createElement("div", { className: "nav-sub" }, workoutName),
        // Timer counts UP from 00:00
        React.createElement("div", { className: "workout-timer" },
          React.createElement("span", { className: "workout-timer-dot" }),
          formatElapsed(elapsed)
        )
      ),

      React.createElement("button", {
        className: "nav-btn accent",
        onClick: complete,
        disabled: completing,
      }, completing ? React.createElement("span", { className: "spinner" }) : "Done ✓")
    ),

    // ── Summary strip ───────────────────────────
    React.createElement("div", { className: "workout-summary-bar" },
      React.createElement("span", null, `${activeExercises.length} exercises`),
      React.createElement("span", { className: "workout-summary-dot" }),
      React.createElement("span", null, `${totalSetsLogged} sets`),
      React.createElement("span", { className: "workout-summary-dot" }),
      React.createElement("span", { style: { color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 600 } },
        formatElapsed(elapsed)
      )
    ),

    // ── Exercise blocks ─────────────────────────
    React.createElement("div", { className: "scroll-content" },

      ...activeExercises.map(ex => {
        const exId   = ex.id;
        const exSets = sets[exId] || [];
        const prev   = prevSets[exId] || [];

        return React.createElement("div", { key: exId, className: "exercise-block" },

          // Header: name + remove + add set
          React.createElement("div", { className: "exercise-block-header" },
            React.createElement("div", null,
              React.createElement("div", { className: "exercise-block-name" }, ex.name),
              ex.category && React.createElement("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 1 } }, ex.category)
            ),
            React.createElement("div", { style: { display: "flex", gap: 6 } },
              React.createElement("button", {
                className: "btn btn-danger btn-sm",
                style: { padding: "6px 10px" },
                onClick: () => removeExerciseFromWorkout(exId),
                title: "Remove exercise",
              }, "✕"),
              React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => addSet(exId) }, "+ Set")
            )
          ),

          // Previous data
          prev.length > 0 && React.createElement("div", null,
            React.createElement("div", { className: "prev-label" }, "Last time"),
            React.createElement("div", { className: "prev-sets" },
              ...prev.map((s, i) =>
                React.createElement("span", { key: i, className: "prev-badge" }, `${s.weight}×${s.reps}`)
              )
            )
          ),

          // Column headers
          exSets.length > 0 && React.createElement("div", { style: { display: "flex", padding: "6px 16px", gap: 8 } },
            React.createElement("span", { style: { width: 24, fontSize: 11, color: "var(--muted)", flexShrink: 0 } }, "#"),
            React.createElement("span", { style: { flex: 1, fontSize: 11, color: "var(--muted)", textAlign: "center" } }, "LBS"),
            React.createElement("span", { style: { fontSize: 11, color: "var(--muted)", width: 16, textAlign: "center" } }, "×"),
            React.createElement("span", { style: { flex: 1, fontSize: 11, color: "var(--muted)", textAlign: "center" } }, "REPS"),
            React.createElement("span", { style: { width: 36, flexShrink: 0 } })
          ),

          // Set rows
          ...exSets.map((s, i) =>
            React.createElement("div", { key: s.id, className: "set-row" },
              React.createElement("span", { className: "set-num" }, i + 1),
              React.createElement("input", { className: "set-input", type: "number", value: s.weight, onChange: e => updateSetField(exId, s.id, "weight", e.target.value) }),
              React.createElement("span", { className: "set-x" }, "×"),
              React.createElement("input", { className: "set-input", type: "number", value: s.reps, onChange: e => updateSetField(exId, s.id, "reps", e.target.value) }),
              React.createElement("button", { className: "btn btn-danger btn-sm btn-icon", onClick: () => deleteSet(exId, s.id) }, "✕")
            )
          ),

          exSets.length === 0 && React.createElement("div", { style: { padding: "12px 16px", color: "var(--muted)", fontSize: 13 } },
            "Tap + Set to start logging"
          )
        );
      }),

      // ── Add Exercise button ─────────────────
      React.createElement("button", {
        className: "btn btn-secondary",
        style: { marginTop: 8, marginBottom: 8 },
        onClick: () => setShowAddEx(true),
      }, "+ Add Exercise")
    ),

    // ════════════════════════════════════════════
    // MODAL: Add exercise to this workout
    // ════════════════════════════════════════════
    showAddEx && React.createElement("div", {
      className: "modal-overlay",
      onClick: e => { if (e.target === e.currentTarget) { setShowAddEx(false); setNewExForm({ open: false, name: "", category: "" }); } },
    },
      React.createElement("div", { className: "modal-sheet" },
        React.createElement("div", { className: "modal-handle" }),
        React.createElement("div", { className: "modal-title" }, "Add Exercise"),

        // ── Inline new-exercise form ──
        newExForm.open
          ? React.createElement("div", { className: "new-ex-form" },
              React.createElement("div", { className: "input-group" },
                React.createElement("label", { className: "input-label" }, "Exercise Name"),
                React.createElement("input", {
                  className: "input",
                  placeholder: "e.g. Cable Row",
                  value: newExForm.name,
                  onChange: e => setNewExForm(p => ({ ...p, name: e.target.value })),
                  autoFocus: true,
                })
              ),
              React.createElement("div", { className: "input-group" },
                React.createElement("label", { className: "input-label" }, "Category (optional)"),
                React.createElement("input", {
                  className: "input",
                  placeholder: "e.g. Back, Chest, Legs",
                  value: newExForm.category,
                  onChange: e => setNewExForm(p => ({ ...p, category: e.target.value })),
                  onKeyDown: e => e.key === "Enter" && createAndAddExercise(),
                })
              ),
              React.createElement("div", { style: { display: "flex", gap: 8 } },
                React.createElement("button", {
                  className: "btn btn-secondary",
                  style: { flex: 1 },
                  onClick: () => setNewExForm({ open: false, name: "", category: "" }),
                }, "Cancel"),
                React.createElement("button", {
                  className: "btn btn-primary",
                  style: { flex: 2 },
                  onClick: createAndAddExercise,
                }, "Create & Add")
              )
            )
          : React.createElement("div", null,
              // Create new button
              React.createElement("button", {
                className: "btn btn-secondary",
                style: { marginBottom: 16 },
                onClick: () => setNewExForm(p => ({ ...p, open: true })),
              }, "✚ Create New Exercise"),

              // Existing exercises list
              availableToAdd.length === 0
                ? React.createElement("div", { style: { color: "var(--muted)", textAlign: "center", padding: "16px 0", fontSize: 13 } },
                    "All exercises already added to this workout"
                  )
                : React.createElement("div", { className: "card" },
                    ...availableToAdd.map(ex =>
                      React.createElement("div", { key: ex.id, className: "card-row", style: { cursor: "pointer" }, onClick: () => addExerciseToWorkout(ex) },
                        React.createElement("div", null,
                          React.createElement("div", { className: "card-title" }, ex.name),
                          ex.category && React.createElement("div", { className: "card-sub" }, ex.category)
                        ),
                        React.createElement("span", { style: { color: "var(--accent)", fontSize: 22, fontWeight: 700 } }, "+")
                      )
                    )
                  )
            )
      )
    )
  );
}