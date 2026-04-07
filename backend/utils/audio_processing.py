import wave
import io

try:
    import numpy as np
    import noisereduce as nr
    import webrtcvad
except ImportError:
    np = None
    nr = None
    webrtcvad = None

def process_audio_vad_noise_reduction(audio_bytes: bytes) -> bytes:
    """
    Apply lightweight noise reduction and VAD for WAV PCM audio.
    Falls back to the original bytes for unsupported formats.
    """
    if not audio_bytes or np is None or nr is None:
        return audio_bytes

    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as wav_in:
            params = wav_in.getparams()
            sample_rate = wav_in.getframerate()
            sample_width = wav_in.getsampwidth()
            channels = wav_in.getnchannels()
            frames = wav_in.readframes(wav_in.getnframes())
    except (wave.Error, EOFError):
        return audio_bytes

    if sample_width != 2:
        return audio_bytes

    try:
        samples = np.frombuffer(frames, dtype=np.int16)
        if channels > 1:
            samples = samples.reshape(-1, channels).mean(axis=1).astype(np.int16)

        reduced = nr.reduce_noise(y=samples.astype(np.float32), sr=sample_rate)
        reduced = np.clip(reduced, -32768, 32767).astype(np.int16)

        voiced = _filter_voiced_frames(reduced, sample_rate)
        processed = voiced if voiced.size else reduced

        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav_out:
            wav_out.setnchannels(1)
            wav_out.setsampwidth(params.sampwidth)
            wav_out.setframerate(sample_rate)
            wav_out.writeframes(processed.tobytes())
        return buffer.getvalue()
    except Exception:
        return audio_bytes


def _filter_voiced_frames(samples, sample_rate: int):
    if webrtcvad is None or sample_rate not in (8000, 16000, 32000, 48000):
        return samples[:0]

    vad = webrtcvad.Vad(2)
    frame_ms = 30
    frame_size = int(sample_rate * frame_ms / 1000)
    voiced_frames = []

    for start in range(0, len(samples) - frame_size + 1, frame_size):
        frame = samples[start:start + frame_size]
        frame_bytes = frame.tobytes()
        if vad.is_speech(frame_bytes, sample_rate):
            voiced_frames.append(frame)

    if not voiced_frames:
        return samples[:0]

    return np.concatenate(voiced_frames)
