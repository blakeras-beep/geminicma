import asyncio
import os
import httpx
import logging
import xml.etree.ElementTree as ET
from typing import List, Optional
from datetime import datetime
from uuid import uuid4
from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import google.generativeai as genai
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Configure logging for Railway console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# DB Setup
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
DB_URI = DATABASE_URL or "sqlite:///./app_data.db"

engine = create_engine(DB_URI, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Schemas
class AssignmentDB(Base):
    __tablename__ = "assignments"
    id = Column(String, primary_key=True, index=True)
    sandlinCommunity = Column(String)
    builderName = Column(String)
    detectedName = Column(String)
    alignmentScore = Column(Integer)
    distanceMiles = Column(Float)
    status = Column(String)

class CompetitorDB(Base):
    __tablename__ = "competitors"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    builder = Column(String)
    lastScraped = Column(String)
    priceMin = Column(Integer)
    priceMax = Column(Integer)
    alignmentScore = Column(Integer)

class AlertDB(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True, index=True)
    competitorId = Column(String)
    competitorName = Column(String)
    type = Column(String)
    severity = Column(String)
    message = Column(Text)
    date = Column(String)

app = FastAPI(title="Sandlin CMA Backend")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    logger.info("API Startup: Database tables verified.")

# Gemini Setup
API_KEY = os.getenv("API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

# Global State
class AgentStatus(BaseModel):
    phase: str
    progress: int
    message: str
    itemsProcessed: int
    totalItems: int

agent_state = AgentStatus(phase="idle", progress=0, message="Ready", itemsProcessed=0, totalItems=0)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# API Endpoints
@app.get("/api/health")
async def health():
    return {"status": "ok", "db": "connected", "timestamp": datetime.now().isoformat()}

@app.get("/api/agent/status")
async def get_status():
    return agent_state

@app.post("/api/agent/run")
async def start_run(background_tasks: BackgroundTasks):
    agent_state.phase = "scout"
    agent_state.message = "Agent search initiated..."
    return {"status": "started"}

@app.get("/api/scout/assignments")
async def get_assignments(db: Session = Depends(get_db)):
    return db.query(AssignmentDB).all()

@app.get("/api/competitors")
async def get_competitors(db: Session = Depends(get_db)):
    return db.query(CompetitorDB).all()

@app.get("/api/alerts")
async def get_alerts(db: Session = Depends(get_db)):
    return db.query(AlertDB).all()

# Static File Serving
# We handle the 'dist' folder created by Vite build
if os.path.exists("dist"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
    
    @app.get("/{path:path}")
    async def serve_spa(request: Request, path: str):
        # Serve the file if it exists, otherwise fallback to index.html for SPA routing
        full_path = os.path.join("dist", path)
        if os.path.isfile(full_path):
            return FileResponse(full_path)
        return FileResponse("dist/index.html")
else:
    # Fallback for local development if dist doesn't exist
    @app.get("/")
    async def root_fallback():
        return FileResponse("index.html")
    
    @app.get("/{path:path}")
    async def local_fallback(path: str):
        if os.path.isfile(path):
            return FileResponse(path)
        return FileResponse("index.html")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)