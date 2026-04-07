import { useApp } from "@/context/AppContext";
import { pipelineSteps } from "@/lib/mockData";
import { CheckCircle, Loader2, Circle, Mic, Brain, SpellCheck, Sparkles, Volume2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Mic, Brain, SpellCheck, Sparkles, Volume2, FileText,
};

export default function Pipeline() {
  const { pipelineStep } = useApp();

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Processing Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">Visualizing the speech correction workflow</p>
      </div>

      {/* Horizontal stepper */}
      <div className="glass-card p-8 overflow-x-auto">
        <div className="flex items-center gap-0 min-w-[700px]">
          {pipelineSteps.map((step, i) => {
            const Icon = iconMap[step.icon] || Circle;
            const isCompleted = pipelineStep > i;
            const isActive = pipelineStep === i;
            const isPending = pipelineStep < i;

            return (
              <div key={i} className="flex items-center flex-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-3 flex-1">
                      <div
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                          isCompleted && "bg-success/20 text-success",
                          isActive && "bg-primary/20 text-primary step-active",
                          isPending && "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : isActive ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Icon className="h-6 w-6" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium text-center",
                          isCompleted && "text-success",
                          isActive && "text-primary",
                          isPending && "text-muted-foreground"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{step.description}</TooltipContent>
                </Tooltip>
                {i < pipelineSteps.length - 1 && (
                  <div
                    className={cn(
                      "h-px flex-1 mx-1 transition-colors duration-500",
                      pipelineStep > i ? "bg-success" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pipelineSteps.map((step, i) => {
          const Icon = iconMap[step.icon] || Circle;
          const isCompleted = pipelineStep > i;
          const isActive = pipelineStep === i;

          return (
            <div
              key={i}
              className={cn(
                "glass-card p-5 transition-all duration-300",
                isActive && "border-primary/30 glow-primary",
                isCompleted && "border-success/20"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className={cn("h-5 w-5", isCompleted ? "text-success" : isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="font-semibold text-sm">{step.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
