import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatMessageProps {
  content: string;
  userName: string;
  timestamp: string;
  isCurrentUser: boolean;
}

const ChatMessage = ({ content, userName, timestamp, isCurrentUser }: ChatMessageProps) => {
  const getInitials = (name: string) => {
    return name
      .split("@")[0]
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className={`flex gap-3 mb-4 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className={isCurrentUser ? "bg-primary text-primary-foreground" : "bg-secondary"}>
          {getInitials(userName)}
        </AvatarFallback>
      </Avatar>
      <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"} max-w-[70%]`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">{userName.split("@")[0]}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(timestamp), "HH:mm")}
          </span>
        </div>
        <div
          className={`rounded-2xl px-4 py-2 ${
            isCurrentUser
              ? "bg-chat-bubble-user text-primary-foreground"
              : "bg-chat-bubble-other border border-border"
          }`}
        >
          <p className="text-sm break-words">{content}</p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
