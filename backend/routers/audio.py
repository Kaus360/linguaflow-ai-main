from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from utils.audio_processing import process_audio_vad_noise_reduction

router = APIRouter(
    prefix="/api/audio",
    tags=["audio"]
)

@router.post("/")
async def upload_audio(request: Request, file: UploadFile = File(...), language: str = Form("en-US")):
    # Safety Layer: File size limiting (Max 10MB) to prevent DOS
    file.file.seek(0, 2)
    file_size = file.file.tell()
    if file_size > 10 * 1024 * 1024: # 10MB
        raise HTTPException(status_code=400, detail="Payload too large. Limit is 10MB.")
    file.file.seek(0)

    content_type = file.content_type or ""
    if not content_type.startswith(("audio/", "video/")):
        raise HTTPException(status_code=400, detail="Uploaded file must be audio or video.")
        
    audio_bytes = await file.read()
    
    # Process audio (VAD & Noise Reduction)
    processed_audio = process_audio_vad_noise_reduction(audio_bytes)
    
    from utils.asr_processor import transcribe_audio
    from utils.grammar_processor import correct_text_stage1
    
    # 1. Transcribe audio to text
    recognized_text = transcribe_audio(processed_audio, language=language)
    
    # 2. Stage 1: Rule-Based Correction
    stage1_text = correct_text_stage1(recognized_text) if recognized_text else ""
    
    # 3. Stage 2: Contextual LLM Correction via Router
    language_router = request.app.state.language_router
    stage2_result = language_router.process(language, stage1_text)
    stage2_text = stage2_result.get("stage2_text", stage1_text)

    return {
        "status": "success",
        "recognized_text": recognized_text,
        "stage1_corrected": stage1_text,
        "stage2_corrected": stage2_text
    }
