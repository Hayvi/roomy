import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "@/components/ChatMessage";
import MessageInput from "@/components/MessageInput";
import JoinRoomDialog from "@/components/JoinRoomDialog";
import { ArrowLeft, Users, Copy } from "lucide-react";

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name?: string | null;
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
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string>("");
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

      // Fetch user's display name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", session.user.id)
        .single();

      setCurrentUserDisplayName(profileData?.display_name || "Anonymous");

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
      .select("*, profiles:profiles(display_name)")
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
    if (message.profiles?.display_name) {
      return message;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", message.user_id)
      .single();

    return {
      ...message,
      profiles: profileData,
    };
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!currentUserId || !roomId) return;

    try {
      const { error } = await supabase.from("messages").insert({
        room_id: roomId,
        user_id: currentUserId,
        content,
      });

      if (error) {
        if (error.message?.includes('JWSError') || error.message?.includes('JWT')) {
          toast({
            title: "Session Expired",
            description: "Please sign in again to continue",
            variant: "destructive",
          });
          navigate("/auth");
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          toast({
            title: "Connection Error",
            description: "Message not sent. Please check your connection.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error Sending Message",
            description: error.message || "Failed to send message. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Unexpected Error",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRoom = async () => {
    if (!room || !roomId || room.owner_id !== currentUserId || deleting) return;

    const confirmed = window.confirm("Delete this room and all its messages? This cannot be undone.");
    if (!confirmed) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", roomId);

      if (error) {
        if (error.message?.includes('JWSError') || error.message?.includes('JWT')) {
          toast({
            title: "Session Expired",
            description: "Please sign in again to continue",
            variant: "destructive",
          });
          navigate("/auth");
        } else if (error.code === 'PGRST116') {
          toast({
            title: "Room Not Found",
            description: "This room may have already been deleted",
            variant: "destructive",
          });
          navigate("/");
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          toast({
            title: "Connection Error",
            description: "Please check your internet connection and try again",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error Deleting Room",
            description: error.message || "Failed to delete room. Please try again.",
            variant: "destructive",
          });
        }
        setDeleting(false);
        return;
      }

      toast({
        title: "Room deleted",
        description: "The room and its messages have been removed.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Unexpected Error",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  const handleJoinRoom = async (password: string) => {
    setJoining(true);

    try {
      const { data, error } = await supabase.rpc('join_room', {
        room_id: roomId,
        password_input: password
      });

      if (error || !data) {
        if (error?.message?.includes('JWSError') || error?.message?.includes('JWT')) {
          toast({
            title: "Session Expired",
            description: "Please sign in again to continue",
            variant: "destructive",
          });
          navigate("/auth");
        } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
          toast({
            title: "Connection Error",
            description: "Please check your internet connection and try again",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Incorrect Password",
            description: "The password you entered is incorrect. Please try again.",
            variant: "destructive",
          });
        }
        setJoining(false);
        return;
      }

      toast({
        title: "Success",
        description: "Joined room successfully",
      });
      setIsMember(true);
      setShowJoinDialog(false);
      setJoining(false);
    } catch (error: any) {
      toast({
        title: "Unexpected Error",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setJoining(false);
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
        onOpenChange={(open) => {
          if (!open) {
            navigate("/");
          }
        }}
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
                <div className="bg-muted px-3 py-1 rounded-md text-sm font-mono border border-border flex items-center gap-2">
                  <span>Password: {roomPassword || "Loading..."}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 hover:bg-transparent"
                    onClick={() => {
                      if (roomPassword) {
                        navigator.clipboard.writeText(roomPassword);
                        toast({
                          title: "Copied",
                          description: "Password copied to clipboard",
                        });
                      }
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
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
                userName={message.profiles?.display_name || currentUserDisplayName || "Anonymous"}
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
