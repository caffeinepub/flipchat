import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDot,
  Edit,
  MessageCircle,
  MoreVertical,
  Phone,
  PhoneMissed,
  Search,
  User,
  Users,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type {
  CallRecord,
  Contact,
  Conversation,
  Group,
} from "../../types/chat";
import {
  formatTimestamp,
  getCallLog,
  getContacts,
  getConversations,
  getGroups,
  getInitials,
} from "../../utils/chatStorage";

type Tab = "chats" | "status" | "calls" | "profile";

interface ChatListScreenProps {
  onOpenChat: (item: { contact?: Contact; group?: Group }) => void;
  onNewChat: () => void;
  onProfile: () => void;
}

const AVATAR_COLORS = [
  "bg-purple-600",
  "bg-blue-600",
  "bg-green-600",
  "bg-orange-500",
  "bg-pink-600",
];

function avatarColor(id: string) {
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function ChatListScreen({
  onOpenChat,
  onNewChat,
  onProfile,
}: ChatListScreenProps) {
  const [tab, setTab] = useState<Tab>("chats");
  const [callLog, setCallLog] = useState<CallRecord[]>([]);
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    setCallLog(getCallLog());
    const interval = setInterval(() => setCallLog(getCallLog()), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function load() {
      setConversations(getConversations());
      setContacts(getContacts());
      setGroups(getGroups());
    }
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  const contactMap = Object.fromEntries(contacts.map((c) => [c.id, c]));
  const groupMap = Object.fromEntries(groups.map((g) => [g.id, g]));

  const filtered = conversations.filter((conv) => {
    if (conv.isGroup) {
      const group = groupMap[conv.groupId ?? ""];
      return group?.name.toLowerCase().includes(search.toLowerCase());
    }
    const contact = contactMap[conv.contactId ?? ""];
    return contact?.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md overflow-hidden flex-shrink-0">
            <img
              src="/assets/generated/flipchat-logo-transparent.png"
              alt="Flipchat"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">
            Flipchat
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            data-ocid="chatlist.search_input"
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch((v) => !v)}
            className="text-muted-foreground hover:text-foreground rounded-full"
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground rounded-full"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-card border-b border-border"
          >
            <div className="px-4 py-3">
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background border-border rounded-full h-10 text-foreground placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {tab === "chats" &&
          (filtered.length === 0 ? (
            <div
              data-ocid="chatlist.empty_state"
              className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground"
            >
              <MessageCircle className="w-12 h-12 opacity-30" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filtered.map((conv, idx) => {
              if (conv.isGroup) {
                const group = groupMap[conv.groupId ?? ""];
                if (!group) return null;
                const lastText =
                  conv.lastMessage?.text ??
                  (conv.lastMessage?.mediaType === "image"
                    ? "📷 Photo"
                    : `${group.members.length} members`);
                return (
                  <motion.button
                    key={conv.id}
                    type="button"
                    data-ocid={`chatlist.item.${idx + 1}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onOpenChat({ group })}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-card/80 transition-colors border-b border-border/40 active:bg-accent"
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatarColor(group.id)}`}
                      >
                        {group.avatar ? (
                          <img
                            src={group.avatar}
                            alt={group.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <Users className="w-6 h-6" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-sm">
                          {group.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {conv.lastMessage
                            ? formatTimestamp(conv.lastMessage.timestamp)
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {conv.lastMessage?.senderName
                            ? `${conv.lastMessage.senderName.split(" ")[0]}: ${lastText}`
                            : lastText}
                        </span>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              }

              // DM conversation
              const contact = contactMap[conv.contactId ?? ""];
              if (!contact) return null;
              const lastText =
                conv.lastMessage?.text ??
                (conv.lastMessage?.mediaType === "image"
                  ? "📷 Photo"
                  : "No messages yet");
              return (
                <motion.button
                  key={conv.id}
                  type="button"
                  data-ocid={`chatlist.item.${idx + 1}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onOpenChat({ contact })}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-card/80 transition-colors border-b border-border/40 active:bg-accent"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback
                        className={`${avatarColor(contact.id)} text-white font-semibold text-sm`}
                      >
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    {contact.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-online border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-sm">
                        {contact.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {conv.lastMessage
                          ? formatTimestamp(conv.lastMessage.timestamp)
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {lastText}
                      </span>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })
          ))}

        {tab === "status" && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
            <CircleDot className="w-12 h-12 opacity-30" />
            <p className="text-sm">No status updates</p>
          </div>
        )}

        {tab === "calls" && (
          <div className="flex flex-col gap-0">
            {callLog.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground"
                data-ocid="calls.empty_state"
              >
                <Phone className="w-12 h-12 opacity-30" />
                <p className="text-sm">No recent calls</p>
              </div>
            ) : (
              callLog.map((call, idx) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  data-ocid={`calls.item.${idx + 1}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                      [
                        "bg-purple-600",
                        "bg-blue-600",
                        "bg-green-600",
                        "bg-orange-500",
                        "bg-pink-600",
                      ][call.contactId.charCodeAt(0) % 5]
                    }`}
                  >
                    {getInitials(call.contactName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      {call.contactName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {call.direction === "incoming" && (
                        <ArrowDownLeft className="w-3 h-3 text-[#25D366]" />
                      )}
                      {call.direction === "outgoing" && (
                        <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                      )}
                      {call.direction === "missed" && (
                        <PhoneMissed className="w-3 h-3 text-red-400" />
                      )}
                      <span
                        className={`text-xs ${call.direction === "missed" ? "text-red-400" : "text-muted-foreground"}`}
                      >
                        {call.direction === "missed"
                          ? "Missed"
                          : call.duration
                            ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, "0")}`
                            : "No answer"}
                      </span>
                      <span className="text-xs text-muted-foreground/50">
                        ·
                      </span>
                      <span className="text-xs text-muted-foreground/70">
                        {formatTimestamp(call.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {call.type === "video" ? (
                      <Video className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        data-ocid="chatlist.open_modal_button"
        onClick={onNewChat}
        className="absolute bottom-24 right-6 w-14 h-14 rounded-full bg-primary shadow-glow flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-10"
      >
        <Edit className="w-6 h-6 text-white" />
      </button>

      {/* Bottom Nav */}
      <nav className="flex items-center justify-around px-2 pb-6 pt-3 border-t border-border bg-card">
        {[
          { id: "chats" as Tab, icon: MessageCircle, label: "Chats" },
          { id: "status" as Tab, icon: CircleDot, label: "Status" },
          { id: "calls" as Tab, icon: Phone, label: "Calls" },
          { id: "profile" as Tab, icon: User, label: "Profile" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            data-ocid={`nav.${id}.tab`}
            onClick={() => (id === "profile" ? onProfile() : setTab(id))}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-colors ${
              tab === id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
            {tab === id && <span className="w-1 h-1 rounded-full bg-primary" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
