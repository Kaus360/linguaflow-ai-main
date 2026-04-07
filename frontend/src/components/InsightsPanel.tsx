import { useApp } from "@/context/AppContext";
import { Globe, BarChart3, Timer, GitCompare, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function InsightsPanel() {
  const { currentSession, insightsPanelOpen, setInsightsPanelOpen } = useApp();

  const stats = currentSession
    ? {
        language: currentSession.language,
        confidence: currentSession.confidence,
        wer: (1 - currentSession.confidence) * 0.5,
        latency: currentSession.latency,
        additions: currentSession.corrections.filter((c) => c.type === "insertion").length,
        deletions: currentSession.corrections.filter((c) => c.type === "deletion").length,
        modifications: currentSession.corrections.filter((c) => c.type === "modification").length,
      }
    : null;

  return (
    <div className="relative flex shrink-0">
      <button
        onClick={() => setInsightsPanelOpen(!insightsPanelOpen)}
        className="absolute -left-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {insightsPanelOpen ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <aside
        className={cn(
          "h-screen border-l border-border bg-sidebar sticky top-0 overflow-y-auto transition-all duration-300",
          insightsPanelOpen ? "w-72 p-5" : "w-0 p-0 overflow-hidden"
        )}
      >
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">Insights</h2>

        {!stats ? (
          <p className="text-sm text-muted-foreground">Record a session to see insights.</p>
        ) : (
          <div className="space-y-5 animate-fade-in">
            {/* Language */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Globe className="h-3.5 w-3.5" /> Detected Language
              </div>
              <p className="text-lg font-semibold">{stats.language}</p>
            </div>

            {/* Confidence */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <BarChart3 className="h-3.5 w-3.5" /> Confidence Score
              </div>
              <div className="relative w-20 h-20 mx-auto">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeDasharray={`${stats.confidence * 100}, 100`}
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                  {Math.round(stats.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* WER */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <BarChart3 className="h-3.5 w-3.5" /> Word Error Rate
              </div>
              <p className="text-lg font-semibold">{(stats.wer * 100).toFixed(1)}%</p>
            </div>

            {/* Latency */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Timer className="h-3.5 w-3.5" /> Processing Latency
              </div>
              <p className="text-lg font-semibold">{stats.latency}ms</p>
            </div>

            {/* Corrections */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <GitCompare className="h-3.5 w-3.5" /> Corrections
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-success">+ Additions</span>
                  <span className="font-medium">{stats.additions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-destructive">− Deletions</span>
                  <span className="font-medium">{stats.deletions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warning">~ Modifications</span>
                  <span className="font-medium">{stats.modifications}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
