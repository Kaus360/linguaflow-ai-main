from .base_pipeline import LanguagePipeline
from utils.grammar_processor import correct_text_stage2_local
import requests
import os
import json

class HindiPipeline(LanguagePipeline):
    def __init__(self):
        self.examples = []
        try:
            dataset_path = os.path.join(os.path.dirname(__file__), '..', 'datasets', 'hindi_examples.json')
            if os.path.exists(dataset_path):
                with open(dataset_path, 'r', encoding='utf-8') as f:
                    self.examples = json.load(f)
        except Exception as e:
            print(f"Failed to load dataset: {e}")

    def execute(self, text: str) -> dict:
        if not text.strip():
            return {"language": "hi-IN", "stage2_text": ""}
        
        safe_text = text.replace('\n', ' ')[:1000]
        local_text = correct_text_stage2_local(safe_text, "hi-IN")
        api_key = os.getenv('HF_API_KEY', '').strip()
        if not api_key or api_key == 'hf_dummy_key' or api_key.startswith('your_'):
            return {"language": "hi-IN", "stage2_text": local_text}
        
        API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-large"
        headers = {"Authorization": f"Bearer {api_key}"}
        
        examples_str = ""
        for ex in self.examples[:3]:
            examples_str += f"Incorrect: {ex['incorrect']}\nCorrect: {ex['correct']}\n\n"
            
        prompt = f"Correct the grammar and semantics of the following Hindi sentence.\n{examples_str}Incorrect: '{safe_text}'\nCorrect:"
        payload = {"inputs": prompt}
        
        try:
            response = requests.post(API_URL, headers=headers, json=payload, timeout=10)
            if response.status_code == 200:
                output = response.json()
                if isinstance(output, list) and 'generated_text' in output[0]:
                    corrected_text = output[0]['generated_text']
                    return {"language": "hi-IN", "stage2_text": corrected_text}
            
            print(f"LLM API failed with code {response.status_code}: {response.text}")
            return {"language": "hi-IN", "stage2_text": local_text}
        except Exception as e:
            print(f"Error calling LLM: {e}")
            return {"language": "hi-IN", "stage2_text": local_text}
