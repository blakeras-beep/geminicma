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

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

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

# Endpoints
@app.get("/")
async def root():
    logger.info("Root endpoint hit")
    return {
        "status": "online", 
        "message": "Sandlin CMA Backend is running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/agent/status")
async def get_status():
    return agent_state

@app.post("/api/agent/run")
async def start_run(background_tasks: BackgroundTasks):
    # (Agent logic remains same but simplified for connectivity test)
    agent_state.phase = "scout"
    agent_state.message = "Agent started via API"
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)