import { Session, Correction } from "@/context/AppContext";

const mockCorrections: Correction[] = [
  { id: "c1", original: "i went to the store yesterday", corrected: "I went to the store yesterday.", type: "modification", accepted: null, confidence: 0.95 },
  { id: "c2", original: "she dont know about it", corrected: "She doesn't know about it.", type: "modification", accepted: null, confidence: 0.92 },
  { id: "c3", original: "the informations is correct", corrected: "The information is correct.", type: "modification", accepted: null, confidence: 0.88 },
  { id: "c4", original: "", corrected: "Additionally, the data was verified.", type: "insertion", accepted: null, confidence: 0.72 },
  { id: "c5", original: "very very important thing", corrected: "very important thing", type: "deletion", accepted: null, confidence: 0.85 },
];

export const generateMockSession = (): Session => ({
  id: crypto.randomUUID(),
  timestamp: Date.now(),
  rawText:
    "i went to the store yesterday and she dont know about it. the informations is correct and its a very very important thing that we need to address immediately.",
  correctedText:
    "I went to the store yesterday and she doesn't know about it. The information is correct. Additionally, the data was verified. It's a very important thing that we need to address immediately.",
  language: "English",
  confidence: 0.91,
  corrections: mockCorrections.map((c) => ({ ...c, id: crypto.randomUUID() })),
  latency: 1243,
});

export const supportedLanguages = [
  { code: "en-US", name: "English", flag: "🇺🇸" },
  { code: "hi-IN", name: "Hindi",   flag: "🇮🇳" },
  { code: "pa-IN", name: "Punjabi", flag: "🇮🇳" },
  { code: "mr-IN", name: "Marathi", flag: "🇮🇳" },
  { code: "bn-IN", name: "Bengali", flag: "🇧🇩" },
];

export const pipelineSteps = [
  { label: "Audio Capture", icon: "Mic", description: "Capturing audio input from microphone" },
  { label: "ASR", icon: "Brain", description: "Automatic Speech Recognition — converting speech to text" },
  { label: "Grammar Correction", icon: "SpellCheck", description: "Applying grammar and spelling corrections" },
  { label: "Context Refinement", icon: "Sparkles", description: "Refining text using contextual understanding" },
  { label: "Speak Back", icon: "Volume2", description: "Generating speech output from corrected text" },
  { label: "Output", icon: "FileText", description: "Final output ready for review and export" },
];
