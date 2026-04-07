from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="LinguaFlow AI Backend", description="Audio processing and dual-stage grammar correction pipeline.")

# Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to LinguaFlow AI API. Systems are online."}

@app.get("/health")
def health_check():
    return {"status": "ok"}
