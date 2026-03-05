// ═══════════════════════════════════════════════
// src/api/client.js — API base layer + all endpoint calls
// ═══════════════════════════════════════════════

const API_BASE = "http://192.168.0.179:8000";

// ── Token helpers ──────────────────────────────
function getToken()    { return localStorage.getItem("liftlog_token"); }
function setToken(t)   { localStorage.setItem("liftlog_token", t); }
function clearToken()  { localStorage.removeItem("liftlog_token"); }

// ── Core fetch wrapper ─────────────────────────
async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

// ── API object ─────────────────────────────────
const api = {
  // Auth
  register: (u, p) =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ username: u, password: p }) }),
  login: (u, p) =>
    apiFetch("/auth/login",    { method: "POST", body: JSON.stringify({ username: u, password: p }) }),
  me: () => apiFetch("/auth/me"),

  // Exercises
  exercises: {
    list:   ()      => apiFetch("/exercises"),
    create: (d)     => apiFetch("/exercises",      { method: "POST",   body: JSON.stringify(d) }),
    update: (id, d) => apiFetch(`/exercises/${id}`,{ method: "PUT",    body: JSON.stringify(d) }),
    delete: (id)    => apiFetch(`/exercises/${id}`,{ method: "DELETE" }),
  },

  // Templates
  templates: {
    list:           ()        => apiFetch("/templates"),
    create:         (d)       => apiFetch("/templates",                           { method: "POST",   body: JSON.stringify(d) }),
    update:         (id, d)   => apiFetch(`/templates/${id}`,                     { method: "PUT",    body: JSON.stringify(d) }),
    delete:         (id)      => apiFetch(`/templates/${id}`,                     { method: "DELETE" }),
    addExercise:    (id, d)   => apiFetch(`/templates/${id}/exercises`,           { method: "POST",   body: JSON.stringify(d) }),
    removeExercise: (id, exId)=> apiFetch(`/templates/${id}/exercises/${exId}`,   { method: "DELETE" }),
  },

  // Workouts
  workouts: {
    start:       (tid)         => apiFetch("/workouts/start",                  { method: "POST", body: JSON.stringify({ template_id: tid }) }),
    active:      ()            => apiFetch("/workouts/active"),
    addSet:      (sid, d)      => apiFetch(`/workouts/${sid}/sets`,            { method: "POST", body: JSON.stringify(d) }),
    updateSet:   (sid, setId, d)=>apiFetch(`/workouts/${sid}/sets/${setId}`,   { method: "PUT",  body: JSON.stringify(d) }),
    deleteSet:   (sid, setId)  => apiFetch(`/workouts/${sid}/sets/${setId}`,   { method: "DELETE" }),
    complete:    (sid)         => apiFetch(`/workouts/${sid}/complete`,        { method: "POST" }),
    history:     ()            => apiFetch("/workouts/history"),
    get:         (id)          => apiFetch(`/workouts/${id}`),
    previousSets:(exId)        => apiFetch(`/workouts/previous/${exId}`),
  },

  // Progress
  progress: {
    exercise: (id) => apiFetch(`/progress/exercise/${id}`),
  },
};