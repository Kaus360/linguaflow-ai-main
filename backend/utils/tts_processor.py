import edge_tts

async def generate_speech(text: str, voice: str = "en-US-AriaNeural") -> bytes:
    """
    Generates speech audio bytes using edge-tts.
    """
    if not text.strip():
        return b""
    
    communicate = edge_tts.Communicate(text, voice)
    audio_data = bytearray()
    
    try:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data.extend(chunk["data"])
        return bytes(audio_data)
    except Exception as e:
        print(f"TTS error: {e}")
        return b""
