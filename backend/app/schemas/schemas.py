from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Auth ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: str
    username: str
    created_at: datetime
    class Config:
        from_attributes = True


# ── Exercises ───────────────────────────────────────────────────────────────

class ExerciseCreate(BaseModel):
    name: str
    category: Optional[str] = None
    notes: Optional[str] = None

class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None

class ExerciseOut(BaseModel):
    id: str
    name: str
    category: Optional[str]
    notes: Optional[str]
    class Config:
        from_attributes = True


# ── Templates ───────────────────────────────────────────────────────────────

class TemplateCreate(BaseModel):
    name: str

class TemplateUpdate(BaseModel):
    name: Optional[str] = None

class TemplateExerciseAdd(BaseModel):
    exercise_id: str
    order_index: int = 0

class TemplateExerciseOut(BaseModel):
    id: str
    exercise_id: str
    order_index: int
    exercise: ExerciseOut
    class Config:
        from_attributes = True

class TemplateOut(BaseModel):
    id: str
    name: str
    template_exercises: List[TemplateExerciseOut] = []
    class Config:
        from_attributes = True


# ── Workout Sessions ─────────────────────────────────────────────────────────

class StartWorkoutRequest(BaseModel):
    template_id: str

class AddSetRequest(BaseModel):
    exercise_id: str
    set_number: int
    weight: float
    reps: int

class UpdateSetRequest(BaseModel):
    weight: Optional[float] = None
    reps: Optional[int] = None

class WorkoutSetOut(BaseModel):
    id: str
    exercise_id: str
    set_number: int
    weight: float
    reps: int
    class Config:
        from_attributes = True

class WorkoutSessionOut(BaseModel):
    id: str
    template_id: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    is_complete: int
    sets: List[WorkoutSetOut] = []
    class Config:
        from_attributes = True

class WorkoutHistoryItem(BaseModel):
    id: str
    template_id: Optional[str]
    template_name: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    set_count: int
    exercise_count: int


# ── Progress ─────────────────────────────────────────────────────────────────

class ProgressPoint(BaseModel):
    date: datetime
    max_weight: float
    total_reps: int
    sets: int

class ExerciseProgress(BaseModel):
    exercise_id: str
    exercise_name: str
    data: List[ProgressPoint]