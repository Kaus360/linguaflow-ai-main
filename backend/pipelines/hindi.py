from .base_pipeline import LanguagePipeline

class HindiPipeline(LanguagePipeline):
    def execute(self, text: str) -> dict:
        if not text.strip():
            return {"language": "hi-IN", "stage2_text": ""}
        
        # Fallback for now without full model integration
        return {"language": "hi-IN", "stage2_text": text}
