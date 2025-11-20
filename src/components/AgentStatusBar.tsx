import { Plane, Hotel, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentStatusBarProps {
  activeAgent?: "coordinator" | "flight" | "hotel";
  status?: "thinking" | "searching" | "completed" | "interrupted";
}

const agentInfo = {
  coordinator: {
    icon: Sparkles,
    label: "Coordinator",
    gradient: "from-green-400 to-green-600",
    bgGlow: "bg-green-500/20",
  },
  flight: {
    icon: Plane,
    label: "Flight Agent",
    gradient: "from-blue-400 to-blue-600",
    bgGlow: "bg-blue-500/20",
  },
  hotel: {
    icon: Hotel,
    label: "Hotel Agent",
    gradient: "from-orange-400 to-orange-600",
    bgGlow: "bg-orange-500/20",
  },
};

export const AgentStatusBar = ({ activeAgent, status }: AgentStatusBarProps) => {
  if (!activeAgent || !status) return null;

  const agent = agentInfo[activeAgent];
  const Icon = agent.icon;

  return (
    <div className="flex items-center gap-4 p-4 glass-effect rounded-2xl border shadow-md animate-fade-in">
      <div className="relative">
        <div className={cn("absolute inset-0 rounded-xl blur-md animate-pulse", agent.bgGlow)} />
        <div className={cn("relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br shadow-md", agent.gradient)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      
      <div className="flex-1">
        <div className="text-sm font-display font-semibold">{agent.label}</div>
        <div className="text-xs text-muted-foreground capitalize flex items-center gap-2">
          <span>{status}...</span>
          {status === "searching" && (
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};