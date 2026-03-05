from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db, WorkoutSession, WorkoutSet, WorkoutTemplate, Exercise, generate_uuid
from ..auth import get_current_user
from ..schemas.schemas import (
    StartWorkoutRequest, AddSetRequest, UpdateSetRequest,
    WorkoutSessionOut, WorkoutHistoryItem, WorkoutSetOut
)

router = APIRouter(prefix="/workouts", tags=["workouts"])


@router.post("/start", response_model=WorkoutSessionOut, status_code=201)
def start_workout(req: StartWorkoutRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == req.template_id, WorkoutTemplate.user_id == user.id).first()
    if not t:
        raise HTTPException(404, "Template not found")
    session = WorkoutSession(id=generate_uuid(), user_id=user.id, template_id=req.template_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/active", response_model=WorkoutSessionOut)
def get_active_session(db: Session = Depends(get_db), user=Depends(get_current_user)):
    session = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == user.id,
        WorkoutSession.is_complete == 0
    ).order_by(WorkoutSession.start_time.desc()).first()
    if not session:
        raise HTTPException(404, "No active session")
    return session


@router.post("/{session_id}/sets", response_model=WorkoutSetOut, status_code=201)
def add_set(session_id: str, req: AddSetRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id, WorkoutSession.user_id == user.id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    if session.is_complete:
        raise HTTPException(400, "Session already complete")
    ex = db.query(Exercise).filter(Exercise.id == req.exercise_id, Exercise.user_id == user.id).first()
    if not ex:
        raise HTTPException(404, "Exercise not found")
    ws = WorkoutSet(
        id=generate_uuid(),
        session_id=session_id,
        exercise_id=req.exercise_id,
        set_number=req.set_number,
        weight=req.weight,
        reps=req.reps
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return ws


@router.put("/{session_id}/sets/{set_id}", response_model=WorkoutSetOut)
def update_set(session_id: str, set_id: str, req: UpdateSetRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id, WorkoutSession.user_id == user.id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    ws = db.query(WorkoutSet).filter(WorkoutSet.id == set_id, WorkoutSet.session_id == session_id).first()
    if not ws:
        raise HTTPException(404, "Set not found")
    for k, v in req.model_dump(exclude_none=True).items():
        setattr(ws, k, v)
    db.commit()
    db.refresh(ws)
    return ws


@router.delete("/{session_id}/sets/{set_id}", status_code=204)
def delete_set(session_id: str, set_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id, WorkoutSession.user_id == user.id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    ws = db.query(WorkoutSet).filter(WorkoutSet.id == set_id, WorkoutSet.session_id == session_id).first()
    if ws:
        db.delete(ws)
        db.commit()


@router.post("/{session_id}/complete", response_model=WorkoutSessionOut)
def complete_workout(session_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id, WorkoutSession.user_id == user.id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    session.end_time = datetime.utcnow()
    session.is_complete = 1
    db.commit()
    db.refresh(session)
    return session


@router.get("/history", response_model=List[WorkoutHistoryItem])
def get_history(db: Session = Depends(get_db), user=Depends(get_current_user)):
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == user.id,
        WorkoutSession.is_complete == 1
    ).order_by(WorkoutSession.start_time.desc()).limit(50).all()

    result = []
    for s in sessions:
        template_name = s.template.name if s.template else None
        exercise_ids = list(set(ws.exercise_id for ws in s.sets))
        result.append(WorkoutHistoryItem(
            id=s.id,
            template_id=s.template_id,
            template_name=template_name,
            start_time=s.start_time,
            end_time=s.end_time,
            set_count=len(s.sets),
            exercise_count=len(exercise_ids)
        ))
    return result


@router.get("/{session_id}", response_model=WorkoutSessionOut)
def get_session(session_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id, WorkoutSession.user_id == user.id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@router.get("/previous/{exercise_id}", response_model=List[WorkoutSetOut])
def get_previous_sets(exercise_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Get sets from the last completed session that included this exercise."""
    last_session = (
        db.query(WorkoutSession)
        .join(WorkoutSet, WorkoutSession.id == WorkoutSet.session_id)
        .filter(WorkoutSession.user_id == user.id, WorkoutSession.is_complete == 1, WorkoutSet.exercise_id == exercise_id)
        .order_by(WorkoutSession.start_time.desc())
        .first()
    )
    if not last_session:
        return []
    sets = db.query(WorkoutSet).filter(
        WorkoutSet.session_id == last_session.id,
        WorkoutSet.exercise_id == exercise_id
    ).order_by(WorkoutSet.set_number).all()
    return sets