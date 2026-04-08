# LinguaFlow AI

LinguaFlow AI is a full-stack multilingual speech-to-text and grammar-correction app. It combines a React/Vite frontend with a FastAPI backend for audio capture, ASR routing, rule-based grammar cleanup, optional Hugging Face contextual correction, and text-to-speech playback.

## Highlights

- Multilingual correction flow for English, Hindi, Punjabi, Marathi, and Bengali.
- Speech input with a manual text fallback for reliable demos.
- FastAPI backend with separate routers for audio, text correction, and TTS.
- Strategy-pattern language pipeline with local fallback behavior when no Hugging Face key is configured.
- Sample grammar datasets for few-shot/contextual correction.
- Backend tests covering language routing, correction behavior, and endpoint validation.
- Frontend Vitest setup for UI test coverage.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui-style components, Vitest.
- Backend: FastAPI, Uvicorn, SpeechRecognition, LanguageTool, Edge TTS.
- Tooling: npm scripts, Python virtual environment, sample dataset files.

## Project Structure

```text
frontend/          React/Vite app
backend/           FastAPI app, routers, language pipelines, utilities
backend/datasets/  Small sample correction datasets
test_*.py          Backend and pipeline test scripts
start-backend.js   Local backend launcher used by root npm scripts
```

## Setup

```powershell
npm install
npm --prefix frontend install
python -m venv venv
.\venv\Scripts\pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
npm run dev
```

The frontend runs through Vite and the backend runs on `http://localhost:8000`.

## Environment

`backend/.env.example` documents the optional Hugging Face key:

```text
HF_API_KEY=your_huggingface_api_key_here
```

The application is designed to fall back to local rule/pipeline behavior when the key is absent. Real `.env` files and logs are intentionally ignored by Git.

## Tests

```powershell
.\venv\Scripts\python.exe test_correction_pipeline.py
.\venv\Scripts\python.exe test_security.py
npm --prefix frontend test
```

The correction suite uses the local fallback path when no Hugging Face key is configured. Some lower-level libraries may call local services or package-managed dependencies during setup, so run tests from the project virtual environment.

## Portfolio Notes

This repo is organized to show the parts senior reviewers usually look for: runnable setup, clear architecture boundaries, language-specific strategy classes, safety checks around input size and prompt behavior, and tests that prove the core correction pipeline works without requiring private API keys.
