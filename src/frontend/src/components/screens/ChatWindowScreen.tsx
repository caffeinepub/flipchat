import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  MoreVertical,
  Paperclip,
  Phone,
  Send,
  Smile,
  Users,
  Video,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Contact, Group, Message } from "../../types/chat";
import {
  clearUnread,
  formatTimestamp,
  getGroupMessages,
  getInitials,
  getMessages,
  markMessagesRead,
  saveGroupMessage,
  saveMessage,
} from "../../utils/chatStorage";

const AVATAR_COLORS = [
  "bg-purple-600",
  "bg-blue-600",
  "bg-green-600",
  "bg-orange-500",
  "bg-pink-600",
];
function avatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
}

const DEMO_REPLIES = [
  "That's interesting! 😊",
  "Sure, sounds good!",
  "Haha nice one 😄",
  "I'll get back to you on that",
  "Thanks for letting me know!",
  "Absolutely! Let's do it 🎉",
  "Can you share more details?",
  "👍",
  "That makes sense!",
  "Wow, really? 😮",
];

const GROUP_MEMBER_NAMES: Record<string, string> = {
  alice: "Alice Johnson",
  bob: "Bob Smith",
  carol: "Carol White",
  david: "David Lee",
};

const SENDER_COLORS = [
  "text-green-400",
  "text-blue-400",
  "text-purple-400",
  "text-orange-400",
  "text-pink-400",
];
function senderColor(id: string) {
  return SENDER_COLORS[id.charCodeAt(0) % SENDER_COLORS.length];
}

interface ChatWindowScreenProps {
  contact?: Contact;
  group?: Group;
  onBack: () => void;
  onStartCall?: (contact: Contact, type: "voice" | "video") => void;
}

interface LightboxState {
  url: string;
  open: boolean;
}

export function ChatWindowScreen({
  contact,
  group,
  onBack,
  onStartCall,
}: ChatWindowScreenProps) {
  const isGroup = !!group;
  const convId = isGroup ? group.id : (contact?.id ?? "");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingMember, setTypingMember] = useState("");
  const [lightbox, setLightbox] = useState<LightboxState>({
    url: "",
    open: false,
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMessages = useCallback(() => {
    const msgs = isGroup ? getGroupMessages(convId) : getMessages(convId);
    setMessages(msgs);
  }, [convId, isGroup]);

  useEffect(() => {
    if (!isGroup) {
      markMessagesRead(convId);
    }
    clearUnread(convId);
    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [convId, isGroup, loadMessages]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message/typing changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto-reply for DM (contact online)
  useEffect(() => {
    if (isGroup || !contact?.isOnline) return;
    let active = true;
    const scheduleTyping = () => {
      if (!active) return;
      const delay = 1000 + Math.random() * 2000;
      typingTimeout.current = setTimeout(() => {
        if (!active) return;
        setIsTyping(true);
        setTimeout(
          () => {
            if (!active) return;
            setIsTyping(false);
            const reply =
              DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];
            const msg: Message = {
              id: `auto-${Date.now()}`,
              conversationId: contact.id,
              senderId: contact.id,
              text: reply,
              timestamp: Date.now(),
              status: "delivered",
            };
            saveMessage(msg);
            loadMessages();
            scheduleTyping();
          },
          1000 + Math.random() * 1000,
        );
      }, delay);
    };
    scheduleTyping();
    return () => {
      active = false;
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [contact?.id, contact?.isOnline, isGroup, loadMessages]);

  // Auto-reply for group chat
  useEffect(() => {
    if (!isGroup || !group) return;
    let active = true;
    const scheduleGroupTyping = () => {
      if (!active) return;
      const delay = 1000 + Math.random() * 2000;
      typingTimeout.current = setTimeout(() => {
        if (!active) return;
        const memberIdx = Math.floor(Math.random() * group.members.length);
        const memberId = group.members[memberIdx];
        const memberName =
          GROUP_MEMBER_NAMES[memberId] ||
          memberId.charAt(0).toUpperCase() + memberId.slice(1);
        setTypingMember(memberName);
        setIsTyping(true);
        setTimeout(
          () => {
            if (!active) return;
            setIsTyping(false);
            setTypingMember("");
            const reply =
              DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];
            const msg: Message = {
              id: `auto-${Date.now()}`,
              conversationId: group.id,
              senderId: memberId,
              senderName: memberName,
              text: reply,
              timestamp: Date.now(),
              status: "delivered",
            };
            saveGroupMessage(msg);
            loadMessages();
            scheduleGroupTyping();
          },
          1000 + Math.random() * 1000,
        );
      }, delay);
    };
    scheduleGroupTyping();
    return () => {
      active = false;
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [group, isGroup, loadMessages]);

  function sendMessage(
    text?: string,
    mediaUrl?: string,
    mediaType?: "image" | "video",
  ) {
    const content = text || input.trim();
    if (!content && !mediaUrl) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: convId,
      senderId: "me",
      text: content || undefined,
      mediaUrl,
      mediaType,
      timestamp: Date.now(),
      status: "sent",
    };
    if (isGroup) {
      saveGroupMessage(msg);
    } else {
      saveMessage(msg);
    }
    setInput("");
    loadMessages();
    if (!isGroup && contact) {
      setTimeout(() => {
        const msgs = getMessages(contact.id);
        const idx = msgs.findIndex((m) => m.id === msg.id);
        if (idx >= 0) {
          msgs[idx].status = contact.isOnline ? "read" : "delivered";
          const raw = localStorage.getItem("flipchat_messages");
          if (raw) {
            const all = JSON.parse(raw);
            all[contact.id] = msgs;
            localStorage.setItem("flipchat_messages", JSON.stringify(all));
          }
          loadMessages();
        }
      }, 1500);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type: "image" | "video" = file.type.startsWith("video")
      ? "video"
      : "image";
    sendMessage(undefined, url, type);
  }

  function renderTick(msg: Message) {
    if (msg.senderId !== "me") return null;
    if (msg.status === "read")
      return <CheckCheck className="w-3.5 h-3.5 text-tick-blue" />;
    if (msg.status === "delivered")
      return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
    return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
  }

  const headerName = isGroup ? group!.name : (contact?.name ?? "");
  const headerSubtitle = isGroup
    ? `${group!.members.length} members`
    : isTyping
      ? null
      : contact?.isOnline
        ? "online"
        : `last seen ${contact?.lastSeen || "recently"}`;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 pt-10 pb-3 bg-card border-b border-border flex-shrink-0">
        <button
          type="button"
          data-ocid="chat.cancel_button"
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative flex-shrink-0">
          {isGroup ? (
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${avatarColor(group!.id)}`}
            >
              {group!.avatar ? (
                <img
                  src={group!.avatar}
                  alt={group!.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span>{getInitials(group!.name)}</span>
              )}
            </div>
          ) : (
            <Avatar className="w-9 h-9">
              <AvatarImage src={contact?.avatar} />
              <AvatarFallback
                className={`${avatarColor(contact?.id ?? "")} text-white font-semibold text-xs`}
              >
                {getInitials(contact?.name ?? "")}
              </AvatarFallback>
            </Avatar>
          )}
          {!isGroup && contact?.isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-online border-2 border-card" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{headerName}</p>
          <p className="text-xs">
            {isGroup ? (
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                {headerSubtitle}
              </span>
            ) : isTyping ? (
              <span className="text-primary">typing...</span>
            ) : contact?.isOnline ? (
              <span className="text-online">online</span>
            ) : (
              <span className="text-muted-foreground">{headerSubtitle}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground rounded-full w-9 h-9"
            onClick={() => contact && onStartCall?.(contact, "video")}
            data-ocid="chat.secondary_button"
          >
            <Video className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground rounded-full w-9 h-9"
            onClick={() => contact && onStartCall?.(contact, "voice")}
            data-ocid="chat.primary_button"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground rounded-full w-9 h-9"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide px-3 py-4 space-y-1"
        data-ocid="chat.panel"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isMine = msg.senderId === "me";
            return (
              <motion.div
                key={msg.id}
                data-ocid={`chat.item.${idx + 1}`}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}
              >
                <div
                  className={`max-w-[72%] ${
                    isMine
                      ? "bg-sent-bubble rounded-2xl rounded-br-sm"
                      : "bg-received-bubble rounded-2xl rounded-bl-sm"
                  } px-3 py-2 space-y-1`}
                >
                  {/* Show sender name in group chats */}
                  {isGroup && !isMine && msg.senderName && (
                    <p
                      className={`text-xs font-semibold ${senderColor(msg.senderId)}`}
                    >
                      {msg.senderName}
                    </p>
                  )}
                  {msg.mediaUrl && msg.mediaType === "image" && (
                    <button
                      type="button"
                      onClick={() =>
                        setLightbox({ url: msg.mediaUrl!, open: true })
                      }
                    >
                      <img
                        src={msg.mediaUrl}
                        alt="media"
                        className="rounded-xl max-w-[200px] max-h-[200px] object-cover"
                      />
                    </button>
                  )}
                  {msg.mediaUrl && msg.mediaType === "video" && (
                    // biome-ignore lint/a11y/useMediaCaption: chat video thumbnails do not require captions
                    <video
                      src={msg.mediaUrl}
                      controls
                      className="rounded-xl max-w-[200px] max-h-[200px]"
                    />
                  )}
                  {msg.text && (
                    <p className="text-sm text-foreground leading-relaxed">
                      {msg.text}
                    </p>
                  )}
                  <div
                    className={`flex items-center gap-1 ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                    {renderTick(msg)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex justify-start flex-col gap-0.5"
            >
              {isGroup && typingMember && (
                <span className="text-xs text-muted-foreground pl-1">
                  {typingMember} is typing...
                </span>
              )}
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-3 bg-card border-t border-border flex-shrink-0">
        <button
          type="button"
          data-ocid="chat.upload_button"
          onClick={() => fileRef.current?.click()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex-1 relative">
          <Input
            data-ocid="chat.input"
            placeholder="Message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            className="bg-background border-border rounded-full pr-10 h-10 text-foreground placeholder:text-muted-foreground text-sm"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          data-ocid="chat.submit_button"
          onClick={() => sendMessage()}
          disabled={!input.trim()}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            input.trim()
              ? "bg-primary shadow-glow-sm text-white hover:bg-primary/90 active:scale-95"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-ocid="chat.modal"
            className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={() => setLightbox({ url: "", open: false })}
          >
            <button
              type="button"
              data-ocid="chat.close_button"
              className="absolute top-10 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox({ url: "", open: false });
              }}
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightbox.url}
              alt="media"
              className="max-w-full max-h-full rounded-xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
