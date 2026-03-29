import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ChatMessage } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useChatMessages, useSendChatMessage } from "../hooks/useQueries";
import { useCallerProfile } from "../hooks/useQueries";

function formatTime(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  const d = new Date(ms);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GroupChatPage() {
  const { identity } = useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const { data: messages, isLoading } = useChatMessages();
  const sendMessage = useSendChatMessage();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const myPrincipal = identity?.getPrincipal().toString();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const senderName = profile?.name || myPrincipal?.slice(0, 8) || "Anonymous";
    try {
      await sendMessage.mutateAsync({ senderName, message: trimmed });
      setText("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      data-ocid="group_chat.page"
      style={{ height: "calc(100vh - 0px)" }}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Team Chat</h1>
            <p className="text-sm text-muted-foreground">
              Company-wide communication
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="space-y-4" data-ocid="group_chat.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}
              >
                <Skeleton className="h-14 w-56 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : !messages || messages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-64 text-muted-foreground"
            data-ocid="group_chat.empty_state"
          >
            <MessageSquare size={40} className="opacity-20 mb-3" />
            <p className="font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(messages as ChatMessage[]).map((msg, i) => {
              const isMe = msg.senderPrincipal === myPrincipal;
              return (
                <div
                  key={msg.id.toString()}
                  data-ocid={`group_chat.item.${i + 1}`}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  {!isMe && (
                    <span className="text-xs text-muted-foreground mb-1 ml-1 font-medium">
                      {msg.senderName}
                    </span>
                  )}
                  <div
                    className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 mx-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            data-ocid="group_chat.input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          <Button
            data-ocid="group_chat.primary_button"
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="gap-2"
          >
            <Send size={16} />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
