from fastapi import APIRouter, UploadFile, File, HTTPException
from utils.audio_processing import process_audio_vad_noise_reduction

router = APIRouter(
    prefix="/api/audio",
    tags=["audio"]
)

from fastapi import APIRouter, UploadFile, File, HTTPException, Request

@router.post("/")
async def upload_audio(request: Request, file: UploadFile = File(...)):
    if not file.content_type.startswith("audio/") and not file.content_type.startswith("video/"):
        # Web browsers sometimes send blob with different mime types, be lenient for now or force in frontend
        pass
        
    audio_bytes = await file.read()
    
    # Process audio (VAD & Noise Reduction)
    processed_audio = process_audio_vad_noise_reduction(audio_bytes)
    
    from utils.asr_processor import transcribe_audio
    from utils.grammar_processor import correct_text_stage1
    
    # 1. Transcribe audio to text
    recognized_text = transcribe_audio(processed_audio)
    
    # 2. Stage 1: Rule-Based Correction
    stage1_text = correct_text_stage1(recognized_text) if recognized_text else ""
    
    # 3. Stage 2: Contextual LLM Correction via Router
    language_router = request.app.state.language_router
    detected_lang = 'en-US' # default for now
    stage2_result = language_router.process(detected_lang, stage1_text)
    stage2_text = stage2_result.get("stage2_text", stage1_text)

    return {
        "status": "success",
        "recognized_text": recognized_text,
        "stage1_corrected": stage1_text,
        "stage2_corrected": stage2_text
    }
