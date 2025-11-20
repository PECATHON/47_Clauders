import { cn } from "@/lib/utils";
import { Bot, User, Plane, Hotel, Sparkles } from "lucide-react";
import { TravelResultCard } from "./TravelResultCard";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant" | "agent";
  content: string;
  agentType?: "coordinator" | "flight" | "hotel";
  agentStatus?: "thinking" | "searching" | "completed" | "interrupted";
  metadata?: any;
}

const agentIcons = {
  coordinator: Sparkles,
  flight: Plane,
  hotel: Hotel,
};

const agentColors = {
  coordinator: "text-green-600 dark:text-green-400",
  flight: "text-blue-600 dark:text-blue-400",
  hotel: "text-orange-600 dark:text-orange-400",
};

const statusBadges = {
  thinking: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  searching: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  interrupted: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export const ChatMessage = ({ role, content, agentType, agentStatus, metadata }: ChatMessageProps) => {
  const isUser = role === "user";
  const AgentIcon = agentType ? agentIcons[agentType] : Bot;
  const agentColorClass = agentType ? agentColors[agentType] : "";

  // Parse structured data if present
  let structuredData = null;
  let textContent = content;
  
  try {
    if (metadata?.structured) {
      structuredData = metadata.structured;
    } else if (content.includes("```json")) {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        structuredData = JSON.parse(jsonMatch[1]);
        textContent = content.replace(/```json\n[\s\S]*?\n```/g, '').trim();
      }
    }
  } catch (e) {
    // If parsing fails, just show the original content
  }

  return (
    <div
      className={cn(
        "group flex gap-4 p-6 rounded-2xl transition-all duration-300 animate-slide-up",
        isUser 
          ? "bg-gradient-to-br from-primary/5 to-accent/5 ml-8 border border-primary/10" 
          : "glass-effect mr-8 hover:shadow-md"
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110", 
        isUser 
          ? "gradient-primary" 
          : "bg-gradient-to-br from-muted to-card border border-border"
      )}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <AgentIcon className={cn("w-5 h-5", agentColorClass)} />
        )}
      </div>
      
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          {!isUser && agentType && (
            <span className="text-sm font-display font-semibold capitalize px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              {agentType} Agent
            </span>
          )}
          {agentStatus && agentStatus !== "completed" && (
            <span className={cn(
              "text-xs px-3 py-1 rounded-full font-medium shadow-sm animate-pulse",
              statusBadges[agentStatus]
            )}>
              {agentStatus}
            </span>
          )}
        </div>
        
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-4">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-semibold mb-1 mt-3">{children}</h3>,
              p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>,
            }}
          >
            {textContent}
          </ReactMarkdown>
        </div>
        
        {structuredData && structuredData.results && (
          <div className="space-y-3 mt-4">
            {structuredData.results.map((result: any, idx: number) => (
              <TravelResultCard
                key={idx}
                type={structuredData.type}
                data={result}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};