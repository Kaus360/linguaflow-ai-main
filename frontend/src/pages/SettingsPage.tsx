import { useApp } from "@/context/AppContext";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supportedLanguages } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Trash2, Mic } from "lucide-react";

export default function SettingsPage() {
  const { settings, updateSettings, sessions, setCurrentSession } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();

  const clearSessions = () => {
    // Clear localStorage and reload page to reset state
    localStorage.removeItem("linguasense-sessions");
    setCurrentSession(null);
    window.location.reload();
    toast({ title: "Sessions cleared", description: "All session history has been removed." });
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your preferences</p>
      </div>

      <div className="space-y-6">
        {/* Correction Language */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Correction Language</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Choose the language used for Speech Input, correction, and TTS voice
            </p>
          </div>
          <Select
            value={settings.languageOverride}
            onValueChange={(v) => {
              updateSettings({ languageOverride: v });
              const language = supportedLanguages.find((l) => l.code === v);
              toast({ title: "Language updated", description: `Now using: ${language?.name || v}` });
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.flag} {l.name} <span className="text-muted-foreground text-xs ml-1">({l.code})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Auto Speak Back */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Auto Speak-Back</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Automatically navigate to Speak Back page after processing
            </p>
          </div>
          <Switch
            checked={settings.autoSpeakBack}
            onCheckedChange={(v) => updateSettings({ autoSpeakBack: v })}
          />
        </div>

        {/* Correction Intensity */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label className="text-sm font-semibold">Correction Intensity</Label>
              <p className="text-xs text-muted-foreground mt-1">How aggressively to correct text</p>
            </div>
            <span className="text-sm font-mono text-primary">{settings.correctionIntensity}%</span>
          </div>
          <Slider
            value={[settings.correctionIntensity]}
            max={100}
            step={1}
            onValueChange={(v) => updateSettings({ correctionIntensity: v[0] })}
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Low</span><span>Medium</span><span>High</span>
          </div>
        </div>

        {/* Session Management */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <Label className="text-sm font-semibold">Session Management</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} stored locally
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/record")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >
              <Mic className="h-4 w-4" />
              New Recording
            </button>
            <button
              onClick={clearSessions}
              disabled={sessions.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/50 text-destructive text-sm font-medium hover:bg-destructive/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
