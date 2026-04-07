# LinguaFlow ASR & Grammar Corrector Roadmap

- **Phase 1: Foundation & Restructuring**
  - Extract Vite/React code into `/frontend`.
  - Initialize FastAPI in `/backend`.
  - Set up CORS, initial configs, and create `ROADMAP.md`.

- **Phase 2: Audio Capture & Pre-processing (Stage 1)**
  - Implement Frontend Microphone Recording (`SpeechInput.tsx`).
  - Implement Backend endpoint `/api/audio`.
  - Add Node Reduction and VAD (Voice Activity Detection) logic.

- **Phase 3: ASR & Stage 1 Rule-Based Correction (Stages 2 & 3)**
  - Integrate Google ASR with backend.
  - Integrate `language-tool-python` for rule-based grammar/spelling normalization.

- **Phase 4: Two-Stage LLM Correction & Modular Languages (Stage 4)**
  - Build the Strategy Pattern (`LanguageRouter`, `english.py`, `hindi.py`, etc.).
  - Integrate the LLM (T5/Mamba inference via Free API) for Stage 2 contextual correction.

- **Phase 5: TTS & Full Stack Integration (Stage 5)**
  - Integrate Edge-TTS for speak-back.
  - Connect all frontend UI elements (`/output`, `/playback`) to the backend.
