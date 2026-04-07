from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from utils.tts_processor import generate_speech

router = APIRouter(
    prefix="/api/tts",
    tags=["tts"]
)

class TTSRequest(BaseModel):
    text: str
    voice: str = "en-US-AriaNeural"

@router.post("/")
async def text_to_speech(request: TTSRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    try:
        audio_bytes = await generate_speech(request.text, request.voice)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
