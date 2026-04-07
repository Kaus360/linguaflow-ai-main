import { useApp } from "@/context/AppContext";
import { supportedLanguages } from "@/lib/mockData";
import { CheckCircle, AlertCircle, Clock, Activity, Cpu, Zap, Signal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { sessions } = useApp();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">System Active</span>
          </div>
          <h1 className="text-4xl font-bold gradient-text">LinguaSense AI</h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono">Intelligent Multilingual Speech Correction System</p>
          <div className="flex gap-6 mt-4 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5"><Cpu className="h-3 w-3 text-primary" /> v2.4.1</span>
            <span className="flex items-center gap-1.5"><Activity className="h-3 w-3 text-success" /> Latency: 42ms</span>
            <span className="flex items-center gap-1.5"><Signal className="h-3 w-3 text-accent" /> 5 Models Loaded</span>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Speech Engine", status: "Online", metric: "99.8% uptime", icon: CheckCircle, ok: true },
          { label: "Correction Model", status: "Ready", metric: "GPT-4 Turbo", icon: CheckCircle, ok: true },
          { label: "TTS Engine", status: "Standby", metric: "Awaiting input", icon: AlertCircle, ok: false },
        ].map((s) => (
          <div key={s.label} className="glass-card-hover p-5 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.ok ? "text-success" : "text-warning"}`} />
            </div>
            <p className="mt-2 text-lg font-semibold">{s.status}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">{s.metric}</p>
            <div className={`h-0.5 mt-3 rounded-full ${s.ok ? "bg-success/40" : "bg-warning/40"}`}>
              <div className={`h-full rounded-full ${s.ok ? "bg-success" : "bg-warning"} w-3/4`} />
            </div>
          </div>
        ))}
      </div>

      {/* Languages */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-widest text-muted-foreground">Supported Languages</h2>
          <span className="text-xs font-mono text-primary">{supportedLanguages.length} active</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {supportedLanguages.map((lang) => (
            <div
              key={lang.code}
              className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm hover:bg-primary/10 hover:border-primary/20 border border-transparent transition-all duration-200 cursor-default"
            >
              <span className="text-2xl">{lang.flag}</span>
              <div>
                <span className="font-medium block">{lang.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{lang.code}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-widest text-muted-foreground">Recent Sessions</h2>
          <span className="text-xs font-mono text-muted-foreground">{sessions.length} total</span>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No sessions yet. Start recording to create your first session.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-md">{s.rawText.slice(0, 60)}...</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.language} • {s.corrections.length} corrections</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {formatDistanceToNow(s.timestamp, { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
