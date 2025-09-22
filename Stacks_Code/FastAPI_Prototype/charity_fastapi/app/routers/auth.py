from pathlib import Path
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Form, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from jose import jwt, JWTError
from sqlmodel import Session, select

from ..db import get_session
from ..model import User, Item, Transaction

router = APIRouter()

# Set the directory for HTML template files
TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"
templates = Jinja2Templates(directory=str(TEMPLATE_DIR))

# JWT configuration
SECRET_KEY = "CHANGE_ME_IN_PRODUCTION"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12

# JWT Utility
def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    """
    Requirement 1: Authentication using JWT to transfer state.
    Create a JWT token with expiration.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(request: Request, session: Session) -> User | None:
    """
    Requirement 1: Keeps user logged in across requests and refreshes.
    Decode JWT from cookie and return current logged-in user.
    """
    token = request.cookies.get("access_token")
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
        if uid is None:
            return None
    except JWTError:
        return None
    return session.get(User, int(uid))

# Register and Login Pages
@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    """
    Return login/register page.
    """
    return templates.TemplateResponse("login.html", {"request": request, "error": None})

# Login and Register Handlers
@router.post("/auth/register")
def register(
    request: Request,
    response: Response,
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form("beneficiary"),
    session: Session = Depends(get_session),
):
    """
    Requirement 1: Register
    - Checks if email already exists
    - Stores user in database
    - Issues JWT token to keep user logged in
    """
    # If already logged in, return to the login page
    if session.exec(select(User).where(User.email == email)).first():
        return templates.TemplateResponse("login.html", {"request": request, "error": "Email already exists."})

    user = User(email=email, password=password, role=role)
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    resp = RedirectResponse(url="/items", status_code=303)
    resp.set_cookie("access_token", token, httponly=True)
    return resp

@router.post("/auth/login")
def login(
    request: Request,
    response: Response,
    email: str = Form(...),
    password: str = Form(...),
    session: Session = Depends(get_session),
):
    """
    Requirement 1: Login
    - Validates credentials
    - Issues JWT token and persists authentication state
    """
    user = session.exec(select(User).where(User.email == email)).first()
    if not user or user.password != password:
        return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials."})

    token = create_access_token({"sub": str(user.id)})
    resp = RedirectResponse(url="/items", status_code=303)
    resp.set_cookie("access_token", token, httponly=True)
    return resp

@router.post("/auth/logout")
def logout():
    """
    Requirement 1: Logout
    - Removes JWT token by deleting cookie
    """    
    resp = RedirectResponse(url="/login", status_code=303)
    resp.delete_cookie("access_token")
    return resp

@router.post("/auth/change-password")
def change_password(
    request: Request,
    current_password: str = Form(...),
    new_password: str = Form(...),
    confirm_new_password: str = Form(...),
    session: Session = Depends(get_session),
):
    """
    Requirement 1: Administer account
    - Verifies current password
    - Validates new password rules
    - Updates user record in database
    """
    user = get_current_user(request, session)
    if not user:
        return RedirectResponse(url="/login", status_code=303)

    # Verify current password
    if user.password != current_password:
        return RedirectResponse(url="/items?err=pw_current", status_code=303)

    # Basic rules: length, match, not same as current
    if len(new_password) < 6:
        return RedirectResponse(url="/items?err=pw_len", status_code=303)
    if new_password != confirm_new_password:
        return RedirectResponse(url="/items?err=pw_match", status_code=303)
    if new_password == current_password:
        return RedirectResponse(url="/items?err=pw_same", status_code=303)

    # Update and save
    user.password = new_password
    session.add(user)
    session.commit()

    return RedirectResponse(url="/items?ok=pw_changed", status_code=303)

# Beneficiaries can claim tokens
@router.post("/benefit/claim")
def claim_tokens(request: Request, session: Session = Depends(get_session)):
    """
    Requirement 2: Beneficiaries can claim tokens
    - Only beneficiary user can call this
    - Increases token balance by 10
    """    
    user = get_current_user(request, session)
    if not user or user.role != "beneficiary":
        return RedirectResponse(url="/login", status_code=303)
    user.token_balance += 10
    session.add(user)
    session.commit()
    return RedirectResponse(url="/items", status_code=303)

def require_user(request: Request, session: Session) -> User:
    """
    Helper to enforce authentication for protected routes
    """
    user = get_current_user(request, session)
    if not user:
        raise RedirectResponse(url="/login", status_code=303)
    return user

@router.post("/tokens/transfer")
def transfer_tokens(
    request: Request,
    to_email: str = Form(...),
    amount: int = Form(...),
    session: Session = Depends(get_session),
):
    """
    Requirement 2: Transfer tokens
    - Requires JWT (only logged-in user can send)
    - Validates amount and receiver existence
    - Updates sender/receiver balances
    - Stores Transaction record in database
    """
    # Get the current user from JWT stored in cookies
    # If no valid token → user is redirected to login
    sender = get_current_user(request, session)
    if not sender:
        return RedirectResponse("/login", status_code=303)

    # Verify form data
    to_email = to_email.strip().lower()
    # Reject invalid amounts
    if amount <= 0:
        return RedirectResponse("/items?err=amount", status_code=303)
    # Prevent users from sending tokens to themselves
    if sender.email.lower() == to_email:
        return RedirectResponse("/items?err=self", status_code=303)

    # Check that the receiver exists in the database
    receiver = session.exec(select(User).where(User.email == to_email)).first()
    if not receiver:
        return RedirectResponse("/items?err=nouser", status_code=303)

    # Ensure the sender has enough balance
    if sender.token_balance < amount:
        return RedirectResponse("/items?err=balance", status_code=303)

    # Update database
    # Update balances + transaction record
    sender.token_balance -= amount
    receiver.token_balance += amount
    tx = Transaction(sender_id=sender.id, receiver_id=receiver.id, amount=amount)
    # Save all changes in one transaction
    session.add_all([sender, receiver, tx])
    session.commit()

    # Redirect back to /items with success flag
    return RedirectResponse("/items?ok=1", status_code=303)