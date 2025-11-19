import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface GlobalJoinRoomDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GlobalJoinRoomDialog({
    isOpen,
    onOpenChange,
}: GlobalJoinRoomDialogProps) {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) return;

        setLoading(true);

        try {
            // Fetch all room IDs
            const { data: rooms, error: fetchError } = await supabase
                .from("rooms")
                .select("id");

            if (fetchError) throw fetchError;

            if (!rooms || rooms.length === 0) {
                toast({
                    title: "No Rooms Available",
                    description: "There are no rooms to join yet.",
                    variant: "destructive",
                });
                setLoading(false);
                return;
            }

            // Try to join each room with the password
            let joinedRoomId: string | null = null;

            for (const room of rooms) {
                const { data, error } = await supabase.rpc("join_room", {
                    room_id: room.id,
                    password_input: password,
                });

                if (!error && data) {
                    joinedRoomId = room.id;
                    break; // Success!
                }
            }

            if (joinedRoomId) {
                toast({
                    title: "Joined Room",
                    description: "Successfully joined the room!",
                });
                onOpenChange(false);
                setPassword(""); // Clear password
                navigate(`/room/${joinedRoomId}`);
            } else {
                toast({
                    title: "Invalid Password",
                    description: "No room found with this password.",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            console.error("Join error:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to join room",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Join a Room</DialogTitle>
                    <DialogDescription>
                        Enter the room password to join.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleJoin} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="text"
                            placeholder="Enter room password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Joining..." : "Join Room"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
