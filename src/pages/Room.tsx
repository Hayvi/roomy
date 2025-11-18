import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "@/components/ChatMessage";
import MessageInput from "@/components/MessageInput";
import { ArrowLeft, Users } from "lucide-react";

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    email: string;
  };
}

interface Room {
  id: string;
  name: string;
  member_count: number;
}

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const initializeRoom = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(session.user.id);

      // Fetch room details
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError || !roomData) {
        toast({
          title: "Error",
          description: "Room not found",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setRoom(roomData);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
      } else {
        setMessages(messagesData || []);
      }

      setLoading(false);
    };

    initializeRoom();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, navigate, toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!currentUserId || !roomId) return;

    const { error } = await supabase.from("messages").insert({
      room_id: roomId,
      user_id: currentUserId,
      content,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-chat-bg">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{room?.name}</h1>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{room?.member_count} members</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              userName={message.user_id}
              timestamp={message.created_at}
              isCurrentUser={message.user_id === currentUserId}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border p-4">
        <div className="max-w-4xl mx-auto">
          <MessageInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default Room;
