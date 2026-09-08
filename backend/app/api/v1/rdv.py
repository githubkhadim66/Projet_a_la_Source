from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Appointment
from app.schemas.rdv import RdvCreate, RdvOut, SlotsOut
from app.services import emails

router = APIRouter()

# Créneaux ouverts (identiques à la maquette)
ALL_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"]


@router.get("/slots", response_model=SlotsOut)
def available_slots(day: date, db: Session = Depends(get_db)):
    taken = set(
        db.scalars(select(Appointment.slot).where(Appointment.day == day, Appointment.status == "confirmé"))
    )
    return SlotsOut(day=day, slots=[s for s in ALL_SLOTS if s not in taken])


@router.post("", response_model=RdvOut, status_code=status.HTTP_201_CREATED)
def book(data: RdvCreate, db: Session = Depends(get_db)):
    if data.slot not in ALL_SLOTS:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Créneau inconnu")
    exists = db.scalar(
        select(Appointment).where(
            Appointment.day == data.day, Appointment.slot == data.slot, Appointment.status == "confirmé"
        )
    )
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ce créneau vient d'être réservé")

    appt = Appointment(
        name=data.name,
        company=data.company,
        email=data.email,
        duration_minutes=data.duration_minutes,
        motif=data.motif,
        day=data.day,
        slot=data.slot,
        timezone=data.timezone,
        language=data.language,
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    emails.send_template(
        "rdv_confirmation", appt.email, appt.language,
        name=appt.name, day=appt.day.isoformat(), slot=appt.slot, duration=appt.duration_minutes,
    )
    emails.notify_internal(
        f"Nouveau RDV expert #{appt.id}",
        f"{appt.name} ({appt.company}) · {appt.day} {appt.slot} ({appt.duration_minutes} min)",
    )
    return appt
