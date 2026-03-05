from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db, WorkoutSet, WorkoutSession, Exercise
from ..auth import get_current_user
from ..schemas.schemas import ExerciseProgress, ProgressPoint

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/exercise/{exercise_id}", response_model=ExerciseProgress)
def get_exercise_progress(exercise_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ex = db.query(Exercise).filter(Exercise.id == exercise_id, Exercise.user_id == user.id).first()
    if not ex:
        raise HTTPException(404, "Exercise not found")

    rows = (
        db.query(
            WorkoutSession.start_time,
            func.max(WorkoutSet.weight).label("max_weight"),
            func.sum(WorkoutSet.reps).label("total_reps"),
            func.count(WorkoutSet.id).label("sets")
        )
        .join(WorkoutSet, WorkoutSession.id == WorkoutSet.session_id)
        .filter(
            WorkoutSession.user_id == user.id,
            WorkoutSession.is_complete == 1,
            WorkoutSet.exercise_id == exercise_id
        )
        .group_by(WorkoutSession.id)
        .order_by(WorkoutSession.start_time)
        .all()
    )

    data = [ProgressPoint(date=r.start_time, max_weight=r.max_weight, total_reps=r.total_reps, sets=r.sets) for r in rows]
    return ExerciseProgress(exercise_id=exercise_id, exercise_name=ex.name, data=data)