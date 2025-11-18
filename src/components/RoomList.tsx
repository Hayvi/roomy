import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users } from "lucide-react";
import { format } from "date-fns";

interface Room {
  id: string;
  name: string;
  member_count: number;
  created_at: string;
}

interface RoomListProps {
  rooms: Room[];
  onSelectRoom: (roomId: string) => void;
  selectedRoomId?: string;
}

const RoomList = ({ rooms, onSelectRoom, selectedRoomId }: RoomListProps) => {
  return (
    <div className="space-y-2">
      {rooms.map((room) => (
        <Card
          key={room.id}
          className={`cursor-pointer transition-colors hover:bg-accent ${
            selectedRoomId === room.id ? "bg-accent" : ""
          }`}
          onClick={() => onSelectRoom(room.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
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
              <span className="text-xs text-muted-foreground">
                {format(new Date(room.created_at), "MMM d")}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RoomList;
