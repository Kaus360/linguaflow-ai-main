import { useState, useEffect, useRef, useCallback } from "react";
import { useApp, type Session } from "@/context/AppContext";
import { Mic, Square, Globe, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const encodeWav = (chunks: Float32Array[], sampleRate: number) => {
  const sampleCount = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, sampleCount * 2, true);

  let offset = 44;
  chunks.forEach((chunk) => {
    chunk.forEach((sample) => {
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += 2;
    });
  });

  return new Blob([view], { type: "audio/wav" });
};

export default function SpeechInput() {
  const { recordingStatus, setRecordingStatus, setPipelineStep, addSession, settings } = useApp();
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Resolve active language: use override if set, else default en-US
  const langCode = settings.languageOverride !== "auto" ? settings.languageOverride : "en-US";
  const LANG_LABELS: Record<string, string> = {
    "en-US": "English", "hi-IN": "Hindi", "pa-IN": "Punjabi", "mr-IN": "Marathi", "bn-IN": "Bengali",
  };
  const langLabel = LANG_LABELS[langCode] || "Auto";

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silenceRef = useRef<GainNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef(44100);
  const [hasAudio, setHasAudio] = useState(false);

  const uploadAudio = useCallback(async (blob: Blob) => {
    setPipelineStep(1);
    const formData = new FormData();
    formData.append("file", blob, "recording.wav");
    formData.append("language", langCode);
    
    try {
      setPipelineStep(2);
      console.log("[Audio] Sending audio to backend...");
      const response = await fetch("http://localhost:8000/api/audio/", {
        method: "POST",
        body: formData,
      });
      console.log("[Audio] Response status:", response.status);
      if (!response.ok) {
        const errText = await response.text();
        console.error("[Audio] Backend error:", errText);
        throw new Error(`Backend Error ${response.status}: ${errText}`);
      }
      const data = await response.json();
      console.log("[Audio] Backend response:", data);

      setPipelineStep(3);
      setTimeout(() => {
        setPipelineStep(5);
        const session: Session = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          rawText: data.recognized_text,
          correctedText: data.stage2_corrected || data.stage1_corrected || data.recognized_text,
          language: langCode,
          confidence: 0.95,
          corrections: [],
          latency: 200,
        };
        addSession(session);
        setRecordingStatus("idle");
        setPipelineStep(6);
        toast({ title: "Processing complete!", description: "Audio processed. View results in Text Output." });
        navigate(settings.autoSpeakBack ? "/playback" : "/output");
      }, 500);

    } catch (err) {
      console.error("[Audio] Error:", err);
      toast({ title: "Failed", description: `Audio processing failed: ${(err as Error).message}`, variant: "destructive" });
      setRecordingStatus("idle");
    }
  }, [addSession, langCode, navigate, setPipelineStep, setRecordingStatus, settings.autoSpeakBack, toast]);

  const submitTextFallback = async (text: string) => {
    if (!text.trim()) return;
    setPipelineStep(1);
    setRecordingStatus("processing");
    try {
      setPipelineStep(2);
      console.log("[Text] Sending text to backend:", text, "lang:", langCode);
      const response = await fetch("http://localhost:8000/api/text/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: langCode }),
      });
      console.log("[Text] Response status:", response.status);
      if (!response.ok) {
        const errText = await response.text();
        console.error("[Text] Backend error:", errText);
        throw new Error(`Backend Error ${response.status}: ${errText}`);
      }
      const data = await response.json();
      console.log("[Text] Backend response:", data);
      
      setPipelineStep(3);
      setTimeout(() => {
        setPipelineStep(5);
        const session: Session = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          rawText: data.recognized_text || text,
          correctedText: data.stage2_corrected || data.stage1_corrected || data.recognized_text || text,
          language: langCode,
          confidence: 1.0,
          corrections: [],
          latency: 50,
        };
        console.log("[Text] Session created:", session);
        addSession(session);
        setRecordingStatus("idle");
        setPipelineStep(6);
        toast({ title: "Done!", description: "Text corrected. Navigating to output..." });
        navigate(settings.autoSpeakBack ? "/playback" : "/output");
      }, 500);
    } catch (err) {
      console.error("[Text] Error:", err);
      toast({ title: "Failed", description: `Text processing failed: ${(err as Error).message}`, variant: "destructive" });
      setRecordingStatus("idle");
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      const silence = audioContext.createGain();

      silence.gain.value = 0;
      sampleRateRef.current = audioContext.sampleRate;
      audioChunksRef.current = [];

      processor.onaudioprocess = (event) => {
        audioChunksRef.current.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      };

      source.connect(processor);
      processor.connect(silence);
      silence.connect(audioContext.destination);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      sourceRef.current = source;
      processorRef.current = processor;
      silenceRef.current = silence;

      setRecordingStatus("recording");
      setPipelineStep(0);
      setTimer(0);
      setHasAudio(false);
      toast({ title: "Recording started", description: "Speak now..." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Microphone access denied.", variant: "destructive" });
    }
  }, [setRecordingStatus, setPipelineStep, toast]);

  const stopRecording = useCallback(() => {
    if (recordingStatus !== "recording") return;

    const chunks = audioChunksRef.current;
    const sampleRate = sampleRateRef.current;

    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    silenceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    void audioContextRef.current?.close();

    processorRef.current = null;
    sourceRef.current = null;
    silenceRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;

    if (chunks.length === 0) {
      setRecordingStatus("idle");
      toast({ title: "No audio captured", description: "Please try recording again.", variant: "destructive" });
      return;
    }

    setHasAudio(true);
    setRecordingStatus("processing");
    toast({ title: "Processing audio..." });
    void uploadAudio(encodeWav(chunks, sampleRate));
  }, [recordingStatus, setRecordingStatus, toast, uploadAudio]);

  useEffect(() => {
    if (recordingStatus === "recording") {
      intervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [recordingStatus]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "r" && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== "INPUT") {
        if (recordingStatus === "idle") startRecording();
        else if (recordingStatus === "recording") stopRecording();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [recordingStatus, startRecording, stopRecording]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const isRecording = recordingStatus === "recording";
  const isProcessing = recordingStatus === "processing";

  const clearRecording = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    silenceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    void audioContextRef.current?.close();

    processorRef.current = null;
    sourceRef.current = null;
    silenceRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
    audioChunksRef.current = [];
    setHasAudio(false);
    setTimer(0);
    setRecordingStatus("idle");
    setPipelineStep(0);
    toast({ title: "Cleared", description: "Recording has been discarded." });
  }, [setRecordingStatus, setPipelineStep, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-10 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Speech Input</h1>
        <p className="text-sm text-muted-foreground">Press the button or hit <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">R</kbd> to record</p>
      </div>

      {/* Record Button */}
      <div className="relative">
        {isRecording && (
          <>
            <div className="pulse-ring inset-0 bg-destructive/20 w-40 h-40 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />
            <div className="pulse-ring inset-0 bg-destructive/10 w-52 h-52 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" style={{ animationDelay: "0.5s" }} />
          </>
        )}
        <button
          onClick={() => {
            if (isRecording) stopRecording();
            else if (!isProcessing) startRecording();
          }}
          disabled={isProcessing}
          className={cn(
            "relative z-10 flex items-center justify-center w-32 h-32 rounded-full transition-all duration-300",
            isRecording
              ? "bg-destructive text-destructive-foreground scale-110 shadow-lg shadow-destructive/30"
              : isProcessing
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground glow-primary hover:scale-105"
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : isRecording ? (
            <Square className="h-8 w-8" />
          ) : (
            <Mic className="h-10 w-10" />
          )}
        </button>
      </div>

      {/* Clear Button */}
      {(isRecording || hasAudio || timer > 0) && (
        <button
          id="clearRecordingBtn"
          onClick={clearRecording}
          disabled={isProcessing}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
            "border-destructive/50 text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          <X className="h-3.5 w-3.5" />
          Clear Recording
        </button>
      )}

      {/* Waveform */}
      <div className="flex items-center gap-1 h-12">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-all duration-150",
              isRecording ? "bg-primary" : "bg-muted"
            )}
            style={{
              height: isRecording ? `${8 + Math.random() * 32}px` : "4px",
              animationDelay: `${i * 50}ms`,
              transition: "height 0.15s ease",
            }}
          />
        ))}
      </div>

      {/* Timer & Status */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-4xl font-mono font-light tracking-widest">{formatTime(timer)}</span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              isRecording ? "bg-destructive animate-pulse" : isProcessing ? "bg-warning animate-pulse" : "bg-success"
            )}
          />
          <span className="text-sm font-medium capitalize">{recordingStatus}</span>
        </div>
      </div>

      {/* Language Badge */}
      <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm">
        <Globe className="h-4 w-4 text-primary" />
        <span>
          {settings.languageOverride === "auto" ? (
            <>Auto-detect: <strong>English</strong></>
          ) : (
            <>Language: <strong>{langLabel}</strong></>
          )}
        </span>
      </div>

      {/* Backup Plan: Text Input if Audio Fails */}
      <div className="w-full max-w-md pt-8 border-t border-border/50">
        <p className="text-sm font-medium mb-3 text-muted-foreground">Audio microphone failing? Use backup plan:</p>
        <div className="relative">
          <textarea 
            id="fallbackTextInput"
            className="w-full flex min-h-[100px] rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Type or paste your text here to process..."
          />
          <button
            disabled={isProcessing}
            onClick={() => {
              const el = document.getElementById("fallbackTextInput") as HTMLTextAreaElement;
              if (el && el.value) {
                submitTextFallback(el.value);
                el.value = "";
              }
            }}
            className="absolute bottom-2 right-2 bg-primary text-primary-foreground text-xs px-4 py-2 font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm"
          >
            Submit Text
          </button>
        </div>
      </div>
    </div>
  );
}
