import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { AgentStatusBar } from "@/components/AgentStatusBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Plane, Hotel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, interruptRequest, isProcessing, activeAgent, agentStatus } = useChat(
    currentConversationId || ""
  );

  useEffect(() => {
    initializeConversation();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeConversation = async () => {
    if (conversationId && conversationId !== "new") {
      setCurrentConversationId(conversationId);
      return;
    }

    // Create new conversation
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
      return;
    }

    setCurrentConversationId(data.id);
    navigate(`/chat/${data.id}`, { replace: true });
  };

  const handleNewChat = () => {
    navigate("/chat/new");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!currentConversationId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header with glass effect */}
      <header className="glass-effect border-b backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 gradient-primary rounded-full blur-lg opacity-50 animate-pulse"></div>
              <div className="relative w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                <Plane className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Travel AI
              </h1>
              <p className="text-xs text-muted-foreground">Powered by Multi-Agent AI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              onClick={handleNewChat} 
              variant="outline" 
              size="sm"
              className="glass-effect hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
            <Button 
              onClick={handleSignOut} 
              variant="ghost" 
              size="sm"
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages with improved styling */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-6 animate-fade-in">
              <div className="flex justify-center gap-6 mb-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg animate-float">
                    <Plane className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="relative group" style={{ animationDelay: '2s' }}>
                  <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg animate-float" style={{ animationDelay: '2s' }}>
                    <Hotel className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="relative group" style={{ animationDelay: '4s' }}>
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg animate-float" style={{ animationDelay: '4s' }}>
                    <Plane className="w-10 h-10 text-white rotate-45" />
                  </div>
                </div>
              </div>
              <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Welcome to Travel AI
              </h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Your intelligent travel companion. Ask about flights, hotels, or get personalized travel recommendations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-3xl mx-auto">
                <div className="group p-6 rounded-2xl glass-effect hover:shadow-lg transition-all cursor-pointer border border-blue-500/20 hover:border-blue-500/40">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                    <Plane className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 font-semibold mb-2">Flight Search</div>
                  <div className="text-sm text-muted-foreground">Real-time flight data with Amadeus API</div>
                </div>
                <div className="group p-6 rounded-2xl glass-effect hover:shadow-lg transition-all cursor-pointer border border-orange-500/20 hover:border-orange-500/40">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                    <Hotel className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-orange-600 dark:text-orange-400 font-semibold mb-2">Hotel Finder</div>
                  <div className="text-sm text-muted-foreground">Discover perfect accommodations</div>
                </div>
                <div className="group p-6 rounded-2xl glass-effect hover:shadow-lg transition-all cursor-pointer border border-green-500/20 hover:border-green-500/40">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                    <Plane className="w-6 h-6 text-white -rotate-45" />
                  </div>
                  <div className="text-green-600 dark:text-green-400 font-semibold mb-2">AI Coordinator</div>
                  <div className="text-sm text-muted-foreground">Smart trip planning assistance</div>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              agentType={message.agent_type}
              agentStatus={message.agent_status}
              metadata={message.metadata}
            />
          ))}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area with glass effect */}
      <div className="glass-effect border-t backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6 max-w-4xl space-y-4">
          {isProcessing && (
            <AgentStatusBar activeAgent={activeAgent} status={agentStatus} />
          )}
          <ChatInput
            onSend={sendMessage}
            onInterrupt={interruptRequest}
            disabled={false}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}