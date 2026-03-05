from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import create_tables
from .routes import auth, exercises, templates, workouts, progress

app = FastAPI(title="LiftLog API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create DB tables on startup
create_tables()

# Register routers
app.include_router(auth.router)
app.include_router(exercises.router)
app.include_router(templates.router)
app.include_router(workouts.router)
app.include_router(progress.router)


@app.get("/")
def root():
    return {"message": "LiftLog API is running", "docs": "/docs"}
