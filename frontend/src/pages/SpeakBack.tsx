import { useState } from "react";
import { Play, Pause, RotateCcw, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export default function SpeakBack() {
  const { currentSession } = useApp();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [speed, setSpeed] = useState(1);

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">No session data. Record something first.</p>
      </div>
    );
  }

  const speeds = [0.5, 1, 1.5, 2];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-10 max-w-lg mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Speak Back</h1>
        <p className="text-sm text-muted-foreground mt-1">Listen to the corrected output</p>
      </div>

      {/* Player Card */}
      <div className="glass-card p-8 w-full space-y-8">
        {/* Text Preview */}
        <p className="text-sm text-muted-foreground text-center line-clamp-3">{currentSession.correctedText}</p>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider value={[progress]} max={100} step={1} onValueChange={(v) => setProgress(v[0])} />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>0:{String(Math.floor(progress * 0.12)).padStart(2, "0")}</span>
            <span>0:12</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          <button onClick={() => setProgress(0)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={() => setPlaying(!playing)}
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-full transition-all",
              playing ? "bg-primary text-primary-foreground glow-primary" : "bg-muted text-foreground hover:bg-primary/20"
            )}
          >
            {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </button>
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider value={volume} max={100} step={1} onValueChange={setVolume} className="w-20" />
          </div>
        </div>

        {/* Speed */}
        <div className="flex items-center justify-center gap-2">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
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
