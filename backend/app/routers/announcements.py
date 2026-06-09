from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from ..database import get_db
from ..auth import get_current_user
from ..schemas import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
from .. import models

router = APIRouter(prefix="/api/announcements", tags=["公告管理"])


@router.get("", response_model=List[AnnouncementResponse])
def list_announcements(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    target_audience: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Announcement).options(
        joinedload(models.Announcement.creator)
    )
    if target_audience:
        query = query.filter(models.Announcement.target_audience == target_audience)
    if is_active is not None:
        query = query.filter(models.Announcement.is_active == is_active)
    return query.order_by(
        models.Announcement.is_pinned.desc(),
        models.Announcement.created_at.desc()
    ).offset(skip).limit(limit).all()


@router.post("", response_model=AnnouncementResponse, status_code=201)
def create_announcement(
    announcement_data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    announcement = models.Announcement(
        **announcement_data.model_dump(),
        created_by=current_user.id
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    # Reload with creator
    db.refresh(announcement)
    announcement = db.query(models.Announcement).options(
        joinedload(models.Announcement.creator)
    ).filter(models.Announcement.id == announcement.id).first()
    return announcement


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
def get_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    announcement = db.query(models.Announcement).options(
        joinedload(models.Announcement.creator)
    ).filter(models.Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="公告不存在")
    return announcement


@router.put("/{announcement_id}", response_model=AnnouncementResponse)
def update_announcement(
    announcement_id: int,
    announcement_data: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    announcement = db.query(models.Announcement).filter(
        models.Announcement.id == announcement_id
    ).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="公告不存在")
    if current_user.role != models.UserRole.admin and announcement.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="权限不足")
    for field, value in announcement_data.model_dump(exclude_unset=True).items():
        setattr(announcement, field, value)
    db.commit()
    announcement = db.query(models.Announcement).options(
        joinedload(models.Announcement.creator)
    ).filter(models.Announcement.id == announcement_id).first()
    return announcement


@router.delete("/{announcement_id}", status_code=204)
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    announcement = db.query(models.Announcement).filter(
        models.Announcement.id == announcement_id
    ).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="公告不存在")
    if current_user.role != models.UserRole.admin and announcement.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="权限不足")
    db.delete(announcement)
    db.commit()
