from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from .db import init_db
from .routers import auth, item

# Create FastAPI app
app = FastAPI()

# Initialize database
init_db()

# Register routers
app.include_router(auth.router)
app.include_router(item.router)

@app.get("/")
def root():
    """
    Root endpoint to verify the application is running.
    This is a simple health check endpoint.
    """
    return {"ok": True, "msg": "FastAPI Charity MVP running"}