from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import traceback

# Config Logging
logging.basicConfig(
    filename='backend.log',
    level=logging.ERROR,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="LinguaFlow AI Backend", description="Audio processing and dual-stage grammar correction pipeline.")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Error: {exc}\n{traceback.format_exc()}")
    return JSONResponse(status_code=500, content={"message": "Internal Server Error. Please see backend.log."})

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
from pipelines.punjabi import PunjabiPipeline
from pipelines.marathi import MarathiPipeline
from pipelines.bengali import BengaliPipeline

app.include_router(audio.router)
app.include_router(tts.router)
app.include_router(text.router)

router = LanguageRouter()
router.register_strategy('en-US', EnglishPipeline())
router.register_strategy('hi-IN', HindiPipeline())
router.register_strategy('pa-IN', PunjabiPipeline())
router.register_strategy('mr-IN', MarathiPipeline())
router.register_strategy('bn-IN', BengaliPipeline())
app.state.language_router = router

@app.get("/")
def read_root():
    return {"message": "Welcome to LinguaFlow AI API. Systems are online."}

@app.get("/health")
def health_check():
    return {"status": "ok"}
