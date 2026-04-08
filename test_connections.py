import sys
sys.path.append("./backend")
import asyncio
from utils.grammar_processor import correct_text_stage1
from pipelines.english import EnglishPipeline
from pipelines.hindi import HindiPipeline
from utils.tts_processor import generate_speech

def test_stage1():
    print("Testing LanguageTool (Stage 1)...")
    res = correct_text_stage1("I goes to school.")
    assert "go" in res, f"Expected 'go', got '{res}'"
    print("LanguageTool Output:", res)
    print("Stage 1 check passed.\n")

def test_stage2_dataset():
    print("Testing EnglishPipeline Dataset connectivity...")
    pipe = EnglishPipeline()
    assert len(pipe.examples) > 0, "Dataset was not loaded!"
    print(f"Loaded {len(pipe.examples)} examples from dataset.")
    print("Stage 2 dataset connection check passed.\n")

async def test_tts():
    print("Testing Edge TTS connection...")
    audio = await generate_speech("Testing connection.", "en-US-AriaNeural")
    assert len(audio) > 1000, "Audio generation failed, size too small."
    print("TTS backend returned bytes of size:", len(audio))
    print("TTS connection check passed.\n")

if __name__ == "__main__":
    test_stage1()
    test_stage2_dataset()
    asyncio.run(test_tts())
    print("All backend connection tests passed successfully!")
