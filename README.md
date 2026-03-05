# 🏋️ LiftLog — Gym Workout Tracker

A full-stack workout tracker with a FastAPI backend and mobile-first React frontend.

---
## Frontend File Structure

```
frontend/
├── index.html                    ← Shell: loads CSS + JS in order
└── src/
    ├── styles/
    │   ├── base.css              ← CSS variables, reset, layout, nav bar
    │   ├── components.css        ← Buttons, cards, inputs, modals, tabs, badges
    │   └── screens.css           ← Auth, workout logger, history, profile styles
    │
    ├── api/
    │   └── client.js             ← apiFetch wrapper + all API calls (api.exercises.*, etc.)
    │
    ├── context/
    │   └── AppContext.js         ← AppCtx, useApp(), formatDate(), formatDuration()
    │
    ├── components/
    │   ├── LineChart.js          ← SVG weight progression chart
    │   ├── TabBar.js             ← Bottom navigation bar (5 tabs)
    │   └── Modal.js              ← Reusable bottom-sheet modal
    │
    ├── screens/
    │   ├── AuthScreen.js         ← Login / Register
    │   ├── HomeScreen.js         ← Dashboard, start workout, quick actions
    │   ├── ExercisesScreen.js    ← Exercise CRUD (add, edit, delete)
    │   ├── TemplatesScreen.js    ← Template builder (add/remove exercises)
    │   ├── WorkoutScreen.js      ← Live logging (sets, weight×reps, previous data)
    │   ├── ProgressScreen.js     ← Per-exercise chart + table
    │   ├── HistoryScreen.js      ← Past sessions list + detail view
    │   └── ProfileScreen.js      ← User stats + Sign Out
    │
    └── App.js                    ← Root: auth gate, screen router, context provider
```
---

## Backend File Structure

```
backend/
├── requirements.txt
├── start.sh
└── app/
    ├── main.py                   ← FastAPI app, CORS, router registration
    ├── database.py               ← SQLAlchemy models + SQLite setup
    ├── auth.py                   ← JWT tokens, bcrypt, get_current_user
    ├── schemas/
    │   └── schemas.py            ← Pydantic request/response models
    └── routes/
        ├── auth.py               ← POST /auth/register, /auth/login, GET /auth/me
        ├── exercises.py          ← CRUD /exercises
        ├── templates.py          ← CRUD /templates + exercise management
        ├── workouts.py           ← Start, log, complete, history, previous sets
        └── progress.py           ← GET /progress/exercise/{id}
```

---

## Quick Start

### 1. Start the Backend

```bash
cd backend
chmod +x start.sh
./start.sh
```

Or manually:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**
Interactive docs at **http://localhost:8000/docs**

### 2. Open the Frontend

Open `frontend/index.html` directly in your browser, **or** serve it:

```bash
cd frontend
python3 -m http.server 3000
# Then open http://localhost:3000
```

> **Note**: The frontend defaults to `http://localhost:8000` as the API base.
> To change this, edit `API_BASE` in `src/api/client.js`.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT token |
| GET | `/auth/me` | Current user info |

### Exercises
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exercises` | List all exercises |
| POST | `/exercises` | Create exercise |
| PUT | `/exercises/{id}` | Update exercise |
| DELETE | `/exercises/{id}` | Delete exercise |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/templates` | List workout templates |
| POST | `/templates` | Create template |
| PUT | `/templates/{id}` | Rename template |
| DELETE | `/templates/{id}` | Delete template |
| POST | `/templates/{id}/exercises` | Add exercise to template |
| DELETE | `/templates/{id}/exercises/{ex_id}` | Remove exercise |

### Workouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/workouts/start` | Start a new session |
| GET | `/workouts/active` | Get active session |
| POST | `/workouts/{id}/sets` | Log a set |
| PUT | `/workouts/{id}/sets/{set_id}` | Edit a set |
| DELETE | `/workouts/{id}/sets/{set_id}` | Delete a set |
| POST | `/workouts/{id}/complete` | Finish workout |
| GET | `/workouts/history` | Past workouts |
| GET | `/workouts/{id}` | Session detail |
| GET | `/workouts/previous/{exercise_id}` | Last session's sets for an exercise |

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/progress/exercise/{id}` | Weight progression chart data |

---

## Features

- ✅ JWT Authentication (register / login)
- ✅ Exercise CRUD (name, category, notes)
- ✅ Workout template builder (add/remove/reorder exercises)
- ✅ Live workout logging (sets with weight × reps)
- ✅ Previous session data shown while logging
- ✅ Workout completion with summary screen
- ✅ Workout history with session detail view
- ✅ Exercise progress charts (max weight over time)
- ✅ Mobile-first UI (works great on iPhone via browser)
- ✅ Dark theme with bottom tab navigation

---

## Database Schema

```
users              → id, username, password_hash, created_at
exercises          → id, user_id, name, category, notes
workout_templates  → id, user_id, name
template_exercises → id, template_id, exercise_id, order_index
workout_sessions   → id, user_id, template_id, start_time, end_time, is_complete
workout_sets       → id, session_id, exercise_id, set_number, weight, reps
```

SQLite database stored at `backend/liftlog.db`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Uvicorn |
| ORM | SQLAlchemy 2.0 |
| Auth | JWT via python-jose + bcrypt |
| Database | SQLite (upgradeable to PostgreSQL) |
| Frontend | Vanilla React 18 (no build step) |
| Styling | Custom CSS (mobile-first) |
