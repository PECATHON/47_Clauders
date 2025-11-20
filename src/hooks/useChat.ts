import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant" | "agent";
  content: string;
  agent_type?: "coordinator" | "flight" | "hotel";
  agent_status?: "thinking" | "searching" | "completed" | "interrupted";
  metadata?: any;
  created_at: string;
}

export const useChat = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<"coordinator" | "flight" | "hotel" | undefined>();
  const [agentStatus, setAgentStatus] = useState<"thinking" | "searching" | "completed" | "interrupted" | undefined>();
  const currentRequestRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Load messages
  useEffect(() => {
    loadMessages();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          
          if (newMessage.agent_type) {
            setActiveAgent(newMessage.agent_type);
            setAgentStatus(newMessage.agent_status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
      return;
    }

    setMessages((data || []) as Message[]);
  };

  const sendMessage = async (content: string) => {
    if (isProcessing) {
      // Interrupt current request
      interruptRequest();
    }

    setIsProcessing(true);
    
    // Create abort controller for this request
    const abortController = new AbortController();
    currentRequestRef.current = abortController;

    try {
      const { data, error } = await supabase.functions.invoke('travel-agent', {
        body: {
          message: content,
          conversationId,
          interrupt: false,
        },
      });

      if (abortController.signal.aborted) {
        console.log('Request was interrupted');
        return;
      }

      if (error) throw error;

      setActiveAgent(undefined);
      setAgentStatus(undefined);
    } catch (error: any) {
      if (abortController.signal.aborted) {
        return; // Don't show error for interrupted requests
      }
      
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      if (!abortController.signal.aborted) {
        setIsProcessing(false);
        currentRequestRef.current = null;
      }
    }
  };

  const interruptRequest = () => {
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
      currentRequestRef.current = null;
      setIsProcessing(false);
      setActiveAgent(undefined);
      setAgentStatus(undefined);
      
      toast({
        title: "Request Interrupted",
        description: "Previous request was cancelled",
      });
    }
  };

  return {
    messages,
    sendMessage,
    interruptRequest,
    isProcessing,
    activeAgent,
    agentStatus,
  };
};