from pathlib import Path
from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlmodel import Session, select

from ..db import get_session
from ..model import Item, User
from .auth import get_current_user

router = APIRouter()

# Set the directory for HTML template files
TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"
templates = Jinja2Templates(directory=str(TEMPLATE_DIR))


@router.get("/items", response_class=HTMLResponse)
def items_page(request: Request, session: Session = Depends(get_session)):
    """
    Requirement 3: The system stores and retrieves user data
    - Reads Item records from DB
    - Shows items list with user info
    """
    user = get_current_user(request, session)
    items = session.exec(select(Item)).all()
    return templates.TemplateResponse("items.html", {"request": request, "items": items, "user": user})

@router.post("/items/create", response_class=HTMLResponse)
def create_item(
    request: Request,
    name: str = Form(...),
    qty: int = Form(0),
    desc: str = Form(""),
    session: Session = Depends(get_session),
):
    """
    Requirement 3: The system stores and retrieves user data
    - Only members can create items
    - Saves item into DB
    """
    user = get_current_user(request, session)
    if not user or user.role != "member":
        return RedirectResponse(url="/login", status_code=303)

    item = Item(name=name, qty=qty, description=desc, owner_id=user.id)
    session.add(item)
    session.commit()
    session.refresh(item)

    return RedirectResponse(url="/items", status_code=303)