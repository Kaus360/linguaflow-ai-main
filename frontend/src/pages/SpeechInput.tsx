import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { generateMockSession } from "@/lib/mockData";
import { Mic, Square, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function SpeechInput() {
  const { recordingStatus, setRecordingStatus, setPipelineStep, addSession } = useApp();
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const uploadAudio = async (blob: Blob) => {
    setPipelineStep(1); // Upload
    const formData = new FormData();
    formData.append("file", blob, "recording.wav");
    
    try {
      setPipelineStep(2); // Processing
      const response = await fetch("http://localhost:8000/api/audio", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Backend Error");
      const data = await response.json();
      console.log("Backend response:", data);

      // Simulate completion steps for UI polish
      setPipelineStep(3);
      setTimeout(() => {
        setPipelineStep(5);
        const session = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          rawText: data.recognized_text || "No speech detected.",
          correctedText: data.stage2_corrected || data.stage1_corrected || "No speech detected.",
          language: "en-US",
          confidence: 0.95,
          corrections: [],
          latency: 200,
        };
        addSession(session as any);
        setRecordingStatus("idle");
        setPipelineStep(6);
        toast({ title: "Processing complete!", description: "Audio sent to backend successfully." });
      }, 500);

    } catch (err) {
      console.error(err);
      toast({ title: "Failed", description: "Could not complete audio processing.", variant: "destructive" });
      setRecordingStatus("idle");
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await uploadAudio(audioBlob);
      };

      mediaRecorder.start();
      setRecordingStatus("recording");
      setPipelineStep(0);
      setTimer(0);
      toast({ title: "Recording started", description: "Speak now..." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Microphone access denied.", variant: "destructive" });
    }
  }, [setRecordingStatus, setPipelineStep, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingStatus === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecordingStatus("processing");
      toast({ title: "Processing audio..." });
    }
  }, [recordingStatus, setRecordingStatus, toast]);

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
        <span>Auto-detect: <strong>English</strong></span>
      </div>
    </div>
  );
}
