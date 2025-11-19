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
import { signOut } from "@/lib/supabase-auth";
import RoomList from "@/components/RoomList";
import { Plus, LogOut, MessageSquare } from "lucide-react";

interface Room {
  id: string;
  name: string;
  member_count: number;
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(session.user.id);
      setUserEmail(session.user.email || "");

      // Fetch rooms
      const { data: roomsData, error } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching rooms:", error);
      } else {
        setRooms(roomsData || []);
      }
    };

    initializeAuth();

    // Subscribe to room changes
    const channel = supabase
      .channel("rooms-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
        },
        () => {
          // Refetch rooms when changes occur
          supabase
            .from("rooms")
            .select("*")
            .order("created_at", { ascending: false })
            .then(({ data }) => setRooms(data || []));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !currentUserId) return;

    // Generate a random 6-character password
    const password = Math.random().toString(36).slice(-6);

    // We need to send the password to the server.
    // Since we are using pgcrypto's `crypt` function in the migration to verify,
    // we should send the plain password to the server and let the server hash it?
    // OR we can hash it client side?
    // The migration I wrote expects `password_hash` column in the INSERT.
    // And `join_room` compares `crypt(input, hash)`.
    // So I need to insert the HASH into the DB.
    // But wait, `crypt` is a server-side function.
    // If I want to use `crypt` for verification, I should store the result of `crypt(password, gen_salt('bf'))`.
    // I can't call `crypt` from the client easily without an RPC.
    // Let's create a helper RPC to create the room securely?
    // OR, just for now, let's use a simple client-side hash or just send the password and let a trigger hash it?
    // Trigger is cleaner.
    // Let's modify the migration to handle hashing on insert?
    // Actually, I already wrote the migration to expect `password_hash`.
    // I'll use a simple approach: The client sends the plain password in a temporary field? No.
    // I'll use an RPC to create the room. It's cleaner.

    // Wait, I can't easily change the migration now without rewriting the file.
    // Let's rewrite the migration to include a `create_room` function that takes plain password.
    // This is better.

    // For now, I will update the frontend to assume I will fix the migration to have a `create_room` function.

    const { data, error } = await supabase
      .rpc('create_room', {
        name_input: newRoomName,
        password_input: password
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Room created! Password: ${password}`,
        duration: 5000,
      });
      setIsCreateDialogOpen(false);
      setNewRoomName("");
      navigate(`/room/${data}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
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
                <MessageSquare className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Chat Rooms</h1>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
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
        <div className="mb-6">
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
                  Enter a name for your new chat room
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateRoom();
                    }
                  }}
                />
                <Button onClick={handleCreateRoom} className="w-full">
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rooms yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first room to start chatting
            </p>
          </div>
        ) : (
          <RoomList
            rooms={rooms}
            onSelectRoom={(roomId) => navigate(`/room/${roomId}`)}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
