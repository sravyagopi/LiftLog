from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db, WorkoutTemplate, TemplateExercise, Exercise, generate_uuid
from ..auth import get_current_user
from ..schemas.schemas import TemplateCreate, TemplateUpdate, TemplateOut, TemplateExerciseAdd

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=List[TemplateOut])
def list_templates(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(WorkoutTemplate).filter(WorkoutTemplate.user_id == user.id).all()


@router.post("", response_model=TemplateOut, status_code=201)
def create_template(req: TemplateCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = WorkoutTemplate(id=generate_uuid(), user_id=user.id, name=req.name)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.put("/{template_id}", response_model=TemplateOut)
def update_template(template_id: str, req: TemplateUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == template_id, WorkoutTemplate.user_id == user.id).first()
    if not t:
        raise HTTPException(404, "Template not found")
    if req.name:
        t.name = req.name
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{template_id}", status_code=204)
def delete_template(template_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == template_id, WorkoutTemplate.user_id == user.id).first()
    if not t:
        raise HTTPException(404, "Template not found")
    db.delete(t)
    db.commit()


@router.post("/{template_id}/exercises", response_model=TemplateOut)
def add_exercise_to_template(template_id: str, req: TemplateExerciseAdd, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == template_id, WorkoutTemplate.user_id == user.id).first()
    if not t:
        raise HTTPException(404, "Template not found")
    ex = db.query(Exercise).filter(Exercise.id == req.exercise_id, Exercise.user_id == user.id).first()
    if not ex:
        raise HTTPException(404, "Exercise not found")
    te = TemplateExercise(id=generate_uuid(), template_id=template_id, exercise_id=req.exercise_id, order_index=req.order_index)
    db.add(te)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{template_id}/exercises/{exercise_id}", response_model=TemplateOut)
def remove_exercise_from_template(template_id: str, exercise_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == template_id, WorkoutTemplate.user_id == user.id).first()
    if not t:
        raise HTTPException(404, "Template not found")
    te = db.query(TemplateExercise).filter(
        TemplateExercise.template_id == template_id,
        TemplateExercise.exercise_id == exercise_id
    ).first()
    if te:
        db.delete(te)
        db.commit()
    db.refresh(t)
    return t