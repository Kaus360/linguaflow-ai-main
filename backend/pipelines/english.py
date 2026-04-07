from .base_pipeline import LanguagePipeline
import requests
import os

class EnglishPipeline(LanguagePipeline):
    def execute(self, text: str) -> dict:
        if not text.strip():
            return {"language": "en-US", "stage2_text": ""}
        
        # SAFETY: strict length limitation and newlines removal for prompt
        safe_text = text.replace('\n', ' ')[:1000]
        
        # Free huggingface Inference API placeholder for Stage 2 LLM
        API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-large"
        headers = {"Authorization": f"Bearer {os.getenv('HF_API_KEY', 'hf_dummy_key')}"}
        
        prompt = f"Correct the grammar and semantics of the following sentence: '{safe_text}'"
        payload = {"inputs": prompt}
        
        try:
            response = requests.post(API_URL, headers=headers, json=payload, timeout=10)
            if response.status_code == 200:
                output = response.json()
                if isinstance(output, list) and 'generated_text' in output[0]:
                    corrected_text = output[0]['generated_text']
                    return {"language": "en-US", "stage2_text": corrected_text}
            
            print(f"LLM API failed with code {response.status_code}: {response.text}")
            return {"language": "en-US", "stage2_text": text}
        except Exception as e:
            print(f"Error calling LLM: {e}")
            return {"language": "en-US", "stage2_text": text}
