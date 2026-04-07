import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface Session {
  id: string;
  timestamp: number;
  rawText: string;
  correctedText: string;
  language: string;
  confidence: number;
  corrections: Correction[];
  latency: number;
}

export interface Correction {
  id: string;
  original: string;
  corrected: string;
  type: "insertion" | "deletion" | "modification";
  accepted: boolean | null;
  confidence: number;
}

export interface Settings {
  autoSpeakBack: boolean;
  correctionIntensity: number;
  languageOverride: string;
}

interface AppState {
  sessions: Session[];
  currentSession: Session | null;
  settings: Settings;
  recordingStatus: "idle" | "recording" | "processing";
  pipelineStep: number;
  insightsPanelOpen: boolean;
  setRecordingStatus: (s: "idle" | "recording" | "processing") => void;
  setPipelineStep: (n: number) => void;
  setInsightsPanelOpen: (v: boolean) => void;
  addSession: (s: Session) => void;
  setCurrentSession: (s: Session | null) => void;
  updateSettings: (s: Partial<Settings>) => void;
  acceptCorrection: (sessionId: string, correctionId: string) => void;
  rejectCorrection: (sessionId: string, correctionId: string) => void;
}

const defaultSettings: Settings = {
  autoSpeakBack: true,
  correctionIntensity: 50,
  languageOverride: "auto",
};

const AppContext = createContext<AppState | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem("linguasense-sessions");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSession, setCurrentSession] = useState<Session | null>(() => {
    const saved = localStorage.getItem("linguasense-sessions");
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.length > 0 ? parsed[0] : null;
  });
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("linguasense-settings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "processing">("idle");
  const [pipelineStep, setPipelineStep] = useState(0);
  const [insightsPanelOpen, setInsightsPanelOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem("linguasense-sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("linguasense-settings", JSON.stringify(settings));
  }, [settings]);

  const addSession = useCallback((s: Session) => {
    setSessions((prev) => [s, ...prev]);
    setCurrentSession(s);
  }, []);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const acceptCorrection = useCallback((sessionId: string, correctionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, corrections: s.corrections.map((c) => (c.id === correctionId ? { ...c, accepted: true } : c)) }
          : s
      )
    );
    setCurrentSession((prev) =>
      prev && prev.id === sessionId
        ? { ...prev, corrections: prev.corrections.map((c) => (c.id === correctionId ? { ...c, accepted: true } : c)) }
        : prev
    );
  }, []);

  const rejectCorrection = useCallback((sessionId: string, correctionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, corrections: s.corrections.map((c) => (c.id === correctionId ? { ...c, accepted: false } : c)) }
          : s
      )
    );
    setCurrentSession((prev) =>
      prev && prev.id === sessionId
        ? { ...prev, corrections: prev.corrections.map((c) => (c.id === correctionId ? { ...c, accepted: false } : c)) }
        : prev
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        sessions,
        currentSession,
        settings,
        recordingStatus,
        pipelineStep,
        insightsPanelOpen,
        setRecordingStatus,
        setPipelineStep,
        setInsightsPanelOpen,
        addSession,
        setCurrentSession,
        updateSettings,
        acceptCorrection,
        rejectCorrection,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
