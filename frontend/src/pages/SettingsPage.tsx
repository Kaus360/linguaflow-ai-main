import { useApp } from "@/context/AppContext";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supportedLanguages } from "@/lib/mockData";

export default function SettingsPage() {
  const { settings, updateSettings } = useApp();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your preferences</p>
      </div>

      <div className="space-y-6">
        {/* Auto Speak Back */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Auto Speak-Back</Label>
            <p className="text-xs text-muted-foreground mt-1">Automatically play corrected audio after processing</p>
          </div>
          <Switch checked={settings.autoSpeakBack} onCheckedChange={(v) => updateSettings({ autoSpeakBack: v })} />
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

        {/* Language Override */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Language Override</Label>
            <p className="text-xs text-muted-foreground mt-1">Override auto-detection</p>
          </div>
          <Select value={settings.languageOverride} onValueChange={(v) => updateSettings({ languageOverride: v })}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-detect</SelectItem>
              {supportedLanguages.map((l) => (
                <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
