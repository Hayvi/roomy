import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface JoinRoomDialogProps {
    isOpen: boolean;
    onJoin: (password: string) => Promise<void>;
    loading: boolean;
    onOpenChange?: (open: boolean) => void;
}

const JoinRoomDialog = ({ isOpen, onJoin, loading, onOpenChange }: JoinRoomDialogProps) => {
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onJoin(password);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Join Room</DialogTitle>
                    <DialogDescription>
                        This room is protected. Please enter the password to join.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="text"
                        placeholder="Enter room password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    <Button type="submit" className="w-full" disabled={loading || !password}>
                        {loading ? "Joining..." : "Join Room"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default JoinRoomDialog;
