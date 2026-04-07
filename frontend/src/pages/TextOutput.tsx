import { useApp } from "@/context/AppContext";
import { Check, X, Copy, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function TextOutput() {
  const { currentSession, acceptCorrection, rejectCorrection } = useApp();
  const { toast } = useToast();

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">No session data. Record something first.</p>
      </div>
    );
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownload = () => {
    // Export a snapshot — never mutates session data
    const snapshot = {
      rawText: currentSession.rawText,
      correctedText: currentSession.correctedText,
      language: currentSession.language,
      confidence: currentSession.confidence,
      corrections: currentSession.corrections.map(({ original, corrected, type, accepted, confidence }) => ({
        original, corrected, type, accepted, confidence,
      })),
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `linguasense-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ title: "Downloaded session snapshot" });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Text Output</h1>
          <p className="text-sm text-muted-foreground mt-1">Compare raw vs corrected transcription</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleCopy(currentSession.correctedText)}>
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" /> Export Snapshot
          </Button>
        </div>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Raw Transcription</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">{currentSession.rawText}</p>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Corrected Text</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{currentSession.correctedText}</p>
        </div>
      </div>

      {/* Corrections */}
      <div className="glass-card p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Corrections</h3>
        <div className="space-y-3">
          {currentSession.corrections.map((c) => (
            <div
              key={c.id}
              className={cn(
                "flex items-start gap-4 rounded-lg bg-muted/50 p-4 transition-all",
                c.accepted === true && "border border-success/20 bg-success/5",
                c.accepted === false && "border border-destructive/20 bg-destructive/5 opacity-50"
              )}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      c.type === "insertion" && "bg-success/20 text-success",
                      c.type === "deletion" && "bg-destructive/20 text-destructive",
                      c.type === "modification" && "bg-warning/20 text-warning"
                    )}
                  >
                    {c.type}
                  </span>
                  <span className="text-xs text-muted-foreground">{Math.round(c.confidence * 100)}% confidence</span>
                </div>
                {c.original && (
                  <p className="text-sm">
                    <span className="text-destructive line-through">{c.original}</span>
                  </p>
                )}
                <p className="text-sm text-success">{c.corrected}</p>
              </div>
              {c.accepted === null && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => acceptCorrection(currentSession.id, c.id)}
                    className="p-1.5 rounded-md hover:bg-success/20 text-muted-foreground hover:text-success transition-colors"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => rejectCorrection(currentSession.id, c.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
