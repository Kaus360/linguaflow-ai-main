from fastapi import APIRouter, UploadFile, File, HTTPException
from utils.audio_processing import process_audio_vad_noise_reduction

router = APIRouter(
    prefix="/api/audio",
    tags=["audio"]
)

@router.post("/")
async def upload_audio(file: UploadFile = File(...)):
    if not file.content_type.startswith("audio/") and not file.content_type.startswith("video/"):
        # Web browsers sometimes send blob with different mime types, be lenient for now or force in frontend
        pass
        
    audio_bytes = await file.read()
    
    # Process audio (VAD & Noise Reduction)
    processed_audio = process_audio_vad_noise_reduction(audio_bytes)
    
    # Return a success message for now. In Phase 3 we pass it to ASR.
    return {
        "status": "success",
        "message": "Audio received and processed (Noise Reduction + VAD).",
        "original_size": len(audio_bytes),
        "processed_size": len(processed_audio)
    }
