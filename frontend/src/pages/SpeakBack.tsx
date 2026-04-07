import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, Loader2, AlertCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Map language codes → Edge-TTS voice
const VOICE_MAP: Record<string, string> = {
  "en-US": "en-US-AriaNeural",
  "hi-IN": "hi-IN-SwaraNeural",
  "pa-IN": "pa-IN-OjaswineNeural",
  "mr-IN": "mr-IN-AarohiNeural",
  "bn-IN": "bn-IN-TanishaaNeural",
};

export default function SpeakBack() {
  const { currentSession, ttsAudioUrls, setTtsAudioUrl } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [speed, setSpeed] = useState(1);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [ttsError, setTtsError] = useState(false);

  const audioUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentSession) return;
    // Only re-fetch if session changed
    if (lastSessionIdRef.current === currentSession.id) return;
    lastSessionIdRef.current = currentSession.id;

    // Cleanup previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    audioUrlRef.current = null;
    setPlaying(false);
    setProgress(0);
    setDuration(0);
    setTtsError(false);

    const cachedUrl = ttsAudioUrls[currentSession.id];
    if (cachedUrl) {
      audioUrlRef.current = cachedUrl;
      setIsLoadingTTS(false);
      return;
    }

    const voice = VOICE_MAP[currentSession.language] || "en-US-AriaNeural";
    setIsLoadingTTS(true);

    fetch("http://localhost:8000/api/tts/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: currentSession.correctedText, voice }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`TTS API error: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (blob.size === 0) throw new Error("TTS returned empty audio");
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setTtsAudioUrl(currentSession.id, url);
        setIsLoadingTTS(false);
      })
      .catch((err) => {
        console.error("[SpeakBack] TTS fetch failed:", err);
        setTtsError(true);
        setIsLoadingTTS(false);
        toast({ title: "TTS Failed", description: err.message, variant: "destructive" });
      });
  }, [currentSession, setTtsAudioUrl, toast, ttsAudioUrls]);

  const buildAudio = () => {
    if (!audioUrlRef.current) return;
    const audio = new Audio(audioUrlRef.current);
    audio.volume = volume[0] / 100;
    audio.playbackRate = speed;
    audio.onended = () => { setPlaying(false); setProgress(100); };
    audio.ontimeupdate = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audioRef.current = audio;
  };

  const togglePlay = () => {
    if (!audioUrlRef.current) return;
    if (!audioRef.current) buildAudio();
    const audio = audioRef.current!;
    audio.volume = volume[0] / 100;
    audio.playbackRate = speed;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      if (!playing) { audioRef.current.play(); setPlaying(true); }
    }
  };

  const formatTime = (secs: number) =>
    `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(Math.floor(secs % 60)).padStart(2, "0")}`;

  if (!currentSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">No session data. Record or type something first.</p>
        <button
          onClick={() => navigate("/record")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition"
        >
          Go to Speech Input
        </button>
      </div>
    );
  }

  const speeds = [0.5, 1, 1.5, 2];
  const currentTime = (progress / 100) * duration;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-10 max-w-lg mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Speak Back</h1>
        <p className="text-sm text-muted-foreground mt-1">Listen to the corrected output</p>
      </div>

      <div className="glass-card p-8 w-full space-y-8">
        {/* Text Preview */}
        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {currentSession.language} · {currentSession.confidence
              ? `${Math.round(currentSession.confidence * 100)}% confidence`
              : "text input"}
          </p>
          <p className="text-sm text-muted-foreground text-center line-clamp-3 leading-relaxed">
            {currentSession.correctedText}
          </p>
        </div>

        {/* Error state */}
        {ttsError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            TTS audio generation failed. Check backend connection.
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            onValueChange={(v) => {
              setProgress(v[0]);
              if (audioRef.current && duration) {
                audioRef.current.currentTime = (v[0] / 100) * duration;
              }
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          <button onClick={restart} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={togglePlay}
            disabled={isLoadingTTS || ttsError}
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-full transition-all",
              playing ? "bg-primary text-primary-foreground glow-primary" : "bg-muted text-foreground hover:bg-primary/20",
              (isLoadingTTS || ttsError) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoadingTTS ? <Loader2 className="h-6 w-6 animate-spin" /> : playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </button>
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={volume}
              max={100}
              step={1}
              onValueChange={(v) => {
                setVolume(v);
                if (audioRef.current) audioRef.current.volume = v[0] / 100;
              }}
              className="w-20"
            />
          </div>
        </div>

        {/* Speed */}
        <div className="flex items-center justify-center gap-2">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSpeed(s);
                if (audioRef.current) audioRef.current.playbackRate = s;
              }}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                speed === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
