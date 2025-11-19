import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "@/components/ChatMessage";
import MessageInput from "@/components/MessageInput";
import JoinRoomDialog from "@/components/JoinRoomDialog";
import { ArrowLeft, Users } from "lucide-react";

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    email?: string | null;
  };
}

interface Room {
  id: string;
  name: string;
  member_count: number;
  owner_id: string;
}

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joining, setJoining] = useState(false);
  const [roomPassword, setRoomPassword] = useState<string | null>(null);
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
      setCurrentUserEmail(session.user.email || "");

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

      // Fetch password if owner
      if (roomData.owner_id === session.user.id) {
        const { data: secretData } = await supabase
          .from("room_secrets")
          .select("password_plaintext")
          .eq("room_id", roomId)
          .single();

        if (secretData) {
          setRoomPassword(secretData.password_plaintext);
        }
      }

      // Check membership
      const { data: memberData } = await supabase
        .from("room_members")
        .select("room_id")
        .eq("room_id", roomId)
        .eq("user_id", session.user.id)
        .single();

      if (memberData) {
        setIsMember(true);
        fetchMessages();
      } else {
        setIsMember(false);
        setShowJoinDialog(true);
      }

      setLoading(false);
    };

    initializeRoom();

    // Subscribe to new messages only if member
    let channel: any;
    if (isMember) {
      channel = supabase
        .channel(`room-${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `room_id=eq.${roomId}`,
          },
          async (payload) => {
            const enrichedMessage = await enrichMessageWithProfile(payload.new as Message);
            setMessages((prev) => [...prev, enrichedMessage]);
            setTimeout(scrollToBottom, 100);
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [roomId, navigate, toast, isMember]); // Re-run when isMember changes

  const fetchMessages = async () => {
    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select("*, profiles:profiles(email)")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(50);

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
    } else {
      setMessages(messagesData || []);
      setTimeout(scrollToBottom, 100);
    }
  };

  const enrichMessageWithProfile = async (message: Message) => {
    if (message.profiles?.email) {
      return message;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", message.user_id)
      .single();

    return {
      ...message,
      profiles: profileData?.email ? { email: profileData.email } : message.profiles,
    };
  };

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

  const handleDeleteRoom = async () => {
    if (!room || !roomId || room.owner_id !== currentUserId || deleting) return;

    const confirmed = window.confirm("Delete this room and all its messages? This cannot be undone.");
    if (!confirmed) return;

    setDeleting(true);
    const { error } = await supabase.from("rooms").delete().eq("id", roomId);
    setDeleting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Room deleted",
      description: "The room and its messages have been removed.",
    });
    navigate("/");
  };

  const handleJoinRoom = async (password: string) => {
    setJoining(true);
    const { data, error } = await supabase.rpc('join_room', {
      room_id: roomId,
      password_input: password
    });

    setJoining(false);

    if (error || !data) {
      toast({
        title: "Error",
        description: "Incorrect password",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Joined room successfully",
      });
      setIsMember(true);
      setShowJoinDialog(false);
      // Messages will be fetched by useEffect when isMember becomes true
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
      <JoinRoomDialog
        isOpen={showJoinDialog}
        onJoin={handleJoinRoom}
        loading={joining}
      />

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

          <div className="flex items-center gap-2">
            {room?.owner_id === currentUserId && (
              <>
                <div className="bg-muted px-3 py-1 rounded-md text-sm font-mono border border-border">
                  Password: {roomPassword || "Loading..."}
                </div>
                <Button variant="destructive" size="sm" onClick={handleDeleteRoom} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete Room"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {isMember ? (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                userName={message.profiles?.email || currentUserEmail || message.user_id}
                timestamp={message.created_at}
                isCurrentUser={message.user_id === currentUserId}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground mt-10">
              Please join the room to view messages.
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {isMember && (
        <div className="bg-card border-t border-border p-4">
          <div className="max-w-4xl mx-auto">
            <MessageInput onSendMessage={handleSendMessage} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
