import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Room {
  id: string;
  name: string;
  member_count: number;
  created_at: string;
  owner_id: string;
}

interface RoomListProps {
  rooms: Room[];
  onSelectRoom: (roomId: string) => void;
  selectedRoomId?: string;
  currentUserId: string;
  onDeleteRoom: (roomId: string) => void;
}

const RoomList = ({ rooms, onSelectRoom, selectedRoomId, currentUserId, onDeleteRoom }: RoomListProps) => {
  return (
    <div className="space-y-2">
      {rooms.map((room) => (
        <Card
          key={room.id}
          className={`cursor-pointer transition-colors hover:bg-accent ${selectedRoomId === room.id ? "bg-accent" : ""
            }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1" onClick={() => onSelectRoom(room.id)}>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{room.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {room.member_count} {room.member_count === 1 ? "member" : "members"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(room.created_at), "MMM d")}
                </span>
                {room.owner_id === currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRoom(room.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RoomList;
