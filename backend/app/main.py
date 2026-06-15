from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import upload, reports

app = FastAPI(title="Audit MVP API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(reports.router, prefix="/api", tags=["reports"])


@app.get("/health")
def health():
    return {"status": "ok"}
