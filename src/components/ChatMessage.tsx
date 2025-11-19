import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileDown } from "lucide-react";
import { useState } from "react";

interface ChatMessageProps {
  content: string;
  userName: string;
  timestamp: string;
  isCurrentUser: boolean;
  fileUrl?: string;
}

const ChatMessage = ({ content, userName, timestamp, isCurrentUser, fileUrl }: ChatMessageProps) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (name: string) => {
    return name
      .substring(0, 2)
      .toUpperCase();
  };

  const isImageFile = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/');
      return parts[parts.length - 1] || 'file';
    } catch {
      return 'file';
    }
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
          <span className="text-sm font-medium text-foreground">{userName}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(timestamp), "HH:mm")}
          </span>
        </div>
        <div
          className={`rounded-2xl overflow-hidden ${isCurrentUser
            ? "bg-chat-bubble-user text-primary-foreground"
            : "bg-chat-bubble-other border border-border"
            }`}
        >
          {fileUrl && isImageFile(fileUrl) && !imageError ? (
            <div className="max-w-sm">
              <img
                src={fileUrl}
                alt="Uploaded image"
                className="w-full h-auto rounded-t-2xl cursor-pointer hover:opacity-90 transition-opacity"
                onError={() => setImageError(true)}
                onClick={() => window.open(fileUrl, '_blank')}
              />
              {content && (
                <p className="text-sm break-words px-4 py-2">{content}</p>
              )}
            </div>
          ) : fileUrl ? (
            <div className="px-4 py-2">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <FileDown className="h-4 w-4" />
                <span className="text-sm">{getFileName(fileUrl)}</span>
              </a>
              {content && (
                <p className="text-sm break-words mt-2">{content}</p>
              )}
            </div>
          ) : (
            <p className="text-sm break-words px-4 py-2">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
