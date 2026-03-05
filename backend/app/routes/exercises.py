from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db, Exercise, generate_uuid
from ..auth import get_current_user
from ..schemas.schemas import ExerciseCreate, ExerciseUpdate, ExerciseOut

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("", response_model=List[ExerciseOut])
def list_exercises(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Exercise).filter(Exercise.user_id == user.id).all()


@router.post("", response_model=ExerciseOut, status_code=201)
def create_exercise(req: ExerciseCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ex = Exercise(id=generate_uuid(), user_id=user.id, **req.model_dump())
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return ex


@router.put("/{exercise_id}", response_model=ExerciseOut)
def update_exercise(exercise_id: str, req: ExerciseUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ex = db.query(Exercise).filter(Exercise.id == exercise_id, Exercise.user_id == user.id).first()
    if not ex:
        raise HTTPException(404, "Exercise not found")
    for k, v in req.model_dump(exclude_none=True).items():
        setattr(ex, k, v)
    db.commit()
    db.refresh(ex)
    return ex


@router.delete("/{exercise_id}", status_code=204)
def delete_exercise(exercise_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ex = db.query(Exercise).filter(Exercise.id == exercise_id, Exercise.user_id == user.id).first()
    if not ex:
        raise HTTPException(404, "Exercise not found")
    db.delete(ex)
    db.commit()