from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from utils.grammar_processor import correct_text_stage1

router = APIRouter(
    prefix="/api/text",
    tags=["text"]
)

class TextPayload(BaseModel):
    text: str
    language: str = "en-US"

@router.post("/")
async def process_text(request: Request, payload: TextPayload):
    # Safety Layer: length checks
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    if len(payload.text) > 2000:
        raise HTTPException(status_code=400, detail="Text exceeds max length of 2000 characters.")
        
    original_text = payload.text
    
    # Stage 1
    stage1_text = correct_text_stage1(original_text)
    
    # Stage 2
    language_router = request.app.state.language_router
    stage2_result = language_router.process(payload.language, stage1_text)
    stage2_text = stage2_result.get("stage2_text", stage1_text)
    
    return {
        "status": "success",
        "recognized_text": original_text,
        "stage1_corrected": stage1_text,
        "stage2_corrected": stage2_text
    }
