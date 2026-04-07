import { useApp } from "@/context/AppContext";
import { FileText, FileJson, FileBarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function ExportPage() {
  const { currentSession, sessions } = useApp();
  const { toast } = useToast();

  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    toast({ title: `Downloaded ${filename}` });
  };

  const session = currentSession || sessions[0];

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">No session data to export.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Export</h1>
        <p className="text-sm text-muted-foreground mt-1">Download your session data</p>
      </div>

      <div className="grid gap-4">
        <div className="glass-card-hover p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary"><FileText className="h-6 w-6" /></div>
            <div>
              <h3 className="font-semibold">Plain Text</h3>
              <p className="text-xs text-muted-foreground">Corrected transcript as .txt</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => download(session.correctedText, "transcript.txt", "text/plain")}>Download TXT</Button>
        </div>

        <div className="glass-card-hover p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary/10 text-secondary"><FileJson className="h-6 w-6" /></div>
            <div>
              <h3 className="font-semibold">JSON Data</h3>
              <p className="text-xs text-muted-foreground">Full session data with corrections</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => download(JSON.stringify(session, null, 2), "session.json", "application/json")}>Download JSON</Button>
        </div>

        <div className="glass-card-hover p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10 text-success"><FileBarChart className="h-6 w-6" /></div>
            <div>
              <h3 className="font-semibold">Report</h3>
              <p className="text-xs text-muted-foreground">Summary with statistics</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => {
            const report = `LinguaSense AI — Session Report
================================
Date: ${new Date(session.timestamp).toLocaleString()}
Language: ${session.language}
Confidence: ${Math.round(session.confidence * 100)}%
Latency: ${session.latency}ms
Corrections: ${session.corrections.length}

Raw Text:
${session.rawText}

Corrected Text:
${session.correctedText}

Corrections:
${session.corrections.map((c, i) => `${i + 1}. [${c.type}] "${c.original}" → "${c.corrected}" (${Math.round(c.confidence * 100)}%)`).join("\n")}`;
            download(report, "report.txt", "text/plain");
          }}>Download Report</Button>
        </div>
      </div>
    </div>
  );
}
