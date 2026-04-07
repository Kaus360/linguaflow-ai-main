

# LinguaSense AI — Intelligent Multilingual Speech Correction System

## Design System
- **Dark mode by default** with soft purple/blue gradients
- **Glassmorphism cards** with backdrop blur and subtle borders
- **Smooth micro-animations** (fade-in, scale, pulse on recording)
- **Rounded components**, minimalist typography, high-contrast accessibility
- **Color palette**: Deep navy background, cyan/teal accents, soft violet highlights

## Layout
- **Left sidebar** — collapsible navigation with icons for all pages
- **Main workspace** — central content area
- **Right insights panel** — collapsible, shows context-aware stats
- **Floating action button** — quick-access record button

---

## Pages & Features

### 1. Dashboard
- App branding header (LinguaSense AI + tagline)
- System status cards (API status, model status — mock indicators)
- Supported languages grid (flags + language names)
- Recent sessions list (from localStorage) with timestamps
- Processing pipeline mini-visualization

### 2. Speech Input Workspace
- Large animated record button with pulsing ring animation
- Simulated waveform visualization during "recording"
- Audio level meter (animated bar)
- Auto-detected language badge
- Recording timer (MM:SS)
- Status indicator chip: Idle → Recording → Processing
- Mock recording flow: click to start → click to stop → simulates processing

### 3. Processing Pipeline
- Horizontal stepper: Audio Capture → ASR → Grammar Correction → Context Refinement → Speak Back → Output
- Each step lights up and animates sequentially during simulated processing
- Checkmarks on completed steps, spinner on active step
- Tooltips on each stage explaining what it does

### 4. Text Output Panel
- Split-view layout (left: raw transcription, right: corrected text)
- Color-coded correction highlights (insertions in green, deletions in red, changes in yellow)
- Confidence score badges per sentence
- Accept/Reject buttons per correction
- Copy to clipboard and download transcript buttons
- Mock sample transcription data to demonstrate the UI

### 5. Speak Back Controls
- Audio player bar with Play, Pause, Replay buttons
- Volume slider
- Speed control (0.5x, 1x, 1.5x, 2x)
- Visual indicator showing playback progress
- (Mock — no actual audio, but fully interactive UI)

### 6. Insights Panel (Right sidebar)
- Detected language with flag icon
- Confidence score (circular progress)
- Word error rate estimate
- Processing latency display
- Correction statistics (additions, deletions, modifications count)
- All values populated with realistic mock data

### 7. Export Options
- Download as TXT button
- Download as JSON button
- Download Report (formatted summary)
- All export from localStorage session data

### 8. Settings Panel
- Toggle: Auto speak-back on/off
- Correction intensity slider (Low / Medium / High)
- Theme toggle (Dark/Light)
- Language override dropdown
- Settings persisted in localStorage

## UX Polish
- Toast notifications for actions (copied, exported, recording started/stopped)
- Loading skeleton animations during simulated processing
- Keyboard shortcuts (R to record, Space to play/pause, Escape to stop)
- Tooltips throughout the interface
- Responsive layout — sidebar collapses on mobile, panels stack vertically
- Smooth page transitions with fade-in animations

## Data & State
- All session data stored in localStorage
- Clean React state management with useState/useContext
- Modular component architecture ready for future API integration
- API-ready data structures for speech-to-text, correction, and TTS endpoints

