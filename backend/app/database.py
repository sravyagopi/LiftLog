from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import uuid

SQLALCHEMY_DATABASE_URL = "sqlite:///./liftlog.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_uuid():
    return str(uuid.uuid4())


# ── Models ──────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    exercises = relationship("Exercise", back_populates="user", cascade="all, delete")
    templates = relationship("WorkoutTemplate", back_populates="user", cascade="all, delete")
    sessions = relationship("WorkoutSession", back_populates="user", cascade="all, delete")


class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="exercises")
    template_exercises = relationship("TemplateExercise", back_populates="exercise")
    workout_sets = relationship("WorkoutSet", back_populates="exercise")


class WorkoutTemplate(Base):
    __tablename__ = "workout_templates"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)

    user = relationship("User", back_populates="templates")
    template_exercises = relationship(
        "TemplateExercise", back_populates="template",
        cascade="all, delete", order_by="TemplateExercise.order_index"
    )
    sessions = relationship("WorkoutSession", back_populates="template")


class TemplateExercise(Base):
    __tablename__ = "template_exercises"
    id = Column(String, primary_key=True, default=generate_uuid)
    template_id = Column(String, ForeignKey("workout_templates.id"), nullable=False)
    exercise_id = Column(String, ForeignKey("exercises.id"), nullable=False)
    order_index = Column(Integer, default=0)

    template = relationship("WorkoutTemplate", back_populates="template_exercises")
    exercise = relationship("Exercise", back_populates="template_exercises")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    template_id = Column(String, ForeignKey("workout_templates.id"), nullable=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    is_complete = Column(Integer, default=0)

    user = relationship("User", back_populates="sessions")
    template = relationship("WorkoutTemplate", back_populates="sessions")
    sets = relationship("WorkoutSet", back_populates="session", cascade="all, delete")


class WorkoutSet(Base):
    __tablename__ = "workout_sets"
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("workout_sessions.id"), nullable=False)
    exercise_id = Column(String, ForeignKey("exercises.id"), nullable=False)
    set_number = Column(Integer, nullable=False)
    weight = Column(Float, nullable=False)
    reps = Column(Integer, nullable=False)

    session = relationship("WorkoutSession", back_populates="sets")
    exercise = relationship("Exercise", back_populates="workout_sets")


def create_tables():
    Base.metadata.create_all(bind=engine)
