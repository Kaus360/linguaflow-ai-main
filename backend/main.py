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

from routers import audio, tts, text
from pipelines.language_router import LanguageRouter
from pipelines.english import EnglishPipeline
from pipelines.hindi import HindiPipeline

app.include_router(audio.router)
app.include_router(tts.router)
app.include_router(text.router)

router = LanguageRouter()
router.register_strategy('en-US', EnglishPipeline())
router.register_strategy('hi-IN', HindiPipeline())
app.state.language_router = router

@app.get("/")
def read_root():
    return {"message": "Welcome to LinguaFlow AI API. Systems are online."}

@app.get("/health")
def health_check():
    return {"status": "ok"}
