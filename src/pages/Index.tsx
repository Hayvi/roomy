import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import RoomList from "@/components/RoomList";
import { GlobalJoinRoomDialog } from "@/components/GlobalJoinRoomDialog";
import { Plus, LogOut } from "lucide-react";

import { MAX_ROOM_NAME_LENGTH, ROOM_PASSWORD_LENGTH, ROOM_LIST_POLL_INTERVAL_MS } from "@/lib/constants";

interface Room {
  id: string;
  name: string;
  member_count: number;
  online_count?: number;
  created_at: string;
  owner_id: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    let channel: any = null;
    let interval: NodeJS.Timeout | null = null;

    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (mounted) navigate("/auth");
        return;
      }

      if (mounted) {
        setCurrentUserId(session.user.id);

        // Fetch user's display name from profiles
        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", session.user.id)
          .single();

        setDisplayName(profileData?.display_name || "Anonymous");

        // Initial fetch
        fetchRooms();

        // Subscribe to room changes
        channel = supabase
          .channel("rooms-channel")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "rooms",
            },
            () => fetchRooms()
          )
          .subscribe();

        // Poll for online counts
        interval = setInterval(fetchRooms, ROOM_LIST_POLL_INTERVAL_MS);
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
      if (interval) clearInterval(interval);
    };
  }, [navigate]);

  const fetchRooms = async () => {
    const { data: roomsData, error } = await supabase
      .from("rooms")
      .select("*, online_count")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rooms:", error);
    } else {
      setRooms(roomsData || []);
    }
  };

  const handleCreateRoom = async () => {
    const trimmedName = newRoomName.trim();

    // Validate room name
    if (!trimmedName) {
      toast({
        title: "Invalid Room Name",
        description: "Room name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (trimmedName.length > MAX_ROOM_NAME_LENGTH) {
      toast({
        title: "Invalid Room Name",
        description: `Room name must be ${MAX_ROOM_NAME_LENGTH} characters or less`,
        variant: "destructive",
      });
      return;
    }

    if (!currentUserId) return;

    // Generate a random password
    const password = Math.random().toString(36).slice(-ROOM_PASSWORD_LENGTH);

    try {
      const { data, error } = await supabase
        .rpc('create_room', {
          name_input: trimmedName,
          password_input: password
        });

      if (error) {
        // Check for specific error types
        if (error.message?.includes('JWSError') || error.message?.includes('JWT')) {
          toast({
            title: "Session Expired",
            description: "Please sign in again to continue",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          navigate("/auth");
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          toast({
            title: "Connection Error",
            description: "Please check your internet connection and try again",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error Creating Room",
            description: error.message || "Failed to create room. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Success",
        description: `Room created! Password: ${password}`,
        duration: 5000,
      });
      setIsCreateDialogOpen(false);
      setNewRoomName("");
      navigate(`/room/${data}`);
    } catch (error: any) {
      toast({
        title: "Unexpected Error",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    const confirmed = window.confirm("Delete this room and all its messages? This cannot be undone.");
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("rooms").delete().eq("id", roomId);

      if (error) {
        // Check for specific error types
        if (error.message?.includes('JWSError') || error.message?.includes('JWT')) {
          toast({
            title: "Session Expired",
            description: "Please sign in again to continue",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          navigate("/auth");
        } else if (error.code === 'PGRST116') {
          toast({
            title: "Room Not Found",
            description: "This room may have already been deleted",
            variant: "destructive",
          });
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
      } else {
        toast({
          title: "Room deleted",
          description: "The room and its messages have been removed.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Unexpected Error",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl">
                <img src="/logo.svg" alt="Roomy" className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-bold">Roomy</h1>
                <p className="text-sm text-muted-foreground">{displayName}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6 flex gap-4"> {/* Added flex and gap-4 */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
                <DialogDescription>
                  Enter a name for your new room
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  id="room-name"
                  name="roomName"
                  placeholder="Room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateRoom();
                    }
                  }}
                  maxLength={50}
                />
                <Button onClick={handleCreateRoom} className="w-full">
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Added Join Room Button and Dialog */}
          <Button variant="outline" onClick={() => setIsJoinOpen(true)}>
            Join Room
          </Button>

          <GlobalJoinRoomDialog
            isOpen={isJoinOpen}
            onOpenChange={setIsJoinOpen}
          />
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <img src="/logo.svg" alt="Roomy" className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No rooms yet</h3>

            <p className="text-muted-foreground mb-4">
              Create your first room to start chatting
            </p>
          </div>
        ) : (
          <RoomList
            rooms={rooms}
            onSelectRoom={(roomId) => navigate(`/room/${roomId}`)}
            currentUserId={currentUserId}
            onDeleteRoom={handleDeleteRoom}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
