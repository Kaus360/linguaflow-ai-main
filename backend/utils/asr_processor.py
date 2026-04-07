import speech_recognition as sr
import io

def transcribe_audio(audio_bytes: bytes, language="en-US") -> str:
    """
    Takes audio bytes (WAV format expected) and returns transcribed text using Google ASR.
    """
    recognizer = sr.Recognizer()
    try:
        # We need a file-like object for speech_recognition
        with sr.AudioFile(io.BytesIO(audio_bytes)) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data, language=language)
            return text
    except sr.UnknownValueError:
        return ""
    except sr.RequestError as e:
        print(f"Could not request results from Google Speech Recognition service; {e}")
        return ""
    except Exception as e:
        print(f"ASR error: {e}")
        return ""
