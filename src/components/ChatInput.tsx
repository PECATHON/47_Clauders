import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, StopCircle } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onInterrupt?: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export const ChatInput = ({ onSend, onInterrupt, disabled, isProcessing }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div className="flex-1 relative">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about flights, hotels, or travel plans..."
          className="min-h-[60px] max-h-[200px] resize-none glass-effect border-2 focus:border-primary/50 transition-all pr-4"
          disabled={disabled}
        />
        <div className="absolute right-3 bottom-3 text-xs text-muted-foreground">
          Press Enter to send
        </div>
      </div>
      
      {isProcessing ? (
        <Button
          type="button"
          onClick={onInterrupt}
          variant="destructive"
          size="icon"
          className="h-[60px] w-[60px] shadow-lg hover:shadow-xl transition-all"
        >
          <StopCircle className="w-5 h-5" />
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={disabled || !message.trim()}
          size="icon"
          className="h-[60px] w-[60px] gradient-primary hover:shadow-glow transition-all disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </Button>
      )}
    </form>
  );
};