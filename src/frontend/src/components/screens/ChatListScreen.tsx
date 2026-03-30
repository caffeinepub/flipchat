import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  CircleDot,
  Edit,
  MessageCircle,
  MoreVertical,
  Pencil,
  Phone,
  PhoneMissed,
  Plus,
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

const LOGO_SRC =
  "/assets/uploads/file_0000000002bc71fa916666f6929ea802-019d3ae7-437e-7238-9d98-d280ebef58c4-1.png";

// ── Status types ──────────────────────────────────────────────────────────────
interface StatusEntry {
  id: string;
  text: string;
  timestamp: number;
}

interface ContactStatus {
  contactId: string;
  name: string;
  avatar?: string;
  colorClass: string;
  statuses: StatusEntry[];
}

const STATUSES_KEY = "flipchat_statuses";
const HOURS_24 = 24 * 60 * 60 * 1000;

function loadMyStatuses(): StatusEntry[] {
  try {
    const raw = localStorage.getItem(STATUSES_KEY);
    const all: StatusEntry[] = raw ? JSON.parse(raw) : [];
    return all.filter((s) => Date.now() - s.timestamp < HOURS_24);
  } catch {
    return [];
  }
}

function saveMyStatuses(statuses: StatusEntry[]) {
  localStorage.setItem(STATUSES_KEY, JSON.stringify(statuses));
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s pehle`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m pehle`;
  return `${Math.floor(diff / 3600)}h pehle`;
}

// Demo statuses for contacts
const DEMO_CONTACT_STATUSES: (Omit<ContactStatus, "statuses"> & {
  staticStatuses: { text: string; hoursAgo: number }[];
})[] = [
  {
    contactId: "priya",
    name: "Priya Sharma",
    colorClass: "bg-pink-600",
    staticStatuses: [
      { text: "☕ Morning chai time! ", hoursAgo: 2 },
      { text: "Aaj kaam bahut zyada hai 😅", hoursAgo: 5 },
    ],
  },
  {
    contactId: "rahul",
    name: "Rahul Verma",
    colorClass: "bg-blue-600",
    staticStatuses: [{ text: "🏏 Match dekh raha hoon!", hoursAgo: 1 }],
  },
  {
    contactId: "anjali",
    name: "Anjali Gupta",
    colorClass: "bg-purple-600",
    staticStatuses: [{ text: "🎵 Music sunna best therapy hai", hoursAgo: 8 }],
  },
];

// ── Status Tab ────────────────────────────────────────────────────────────────
function StatusTab() {
  const [myStatuses, setMyStatuses] = useState<StatusEntry[]>(() =>
    loadMyStatuses(),
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStatusText, setNewStatusText] = useState("");
  const [viewingStatus, setViewingStatus] = useState<ContactStatus | null>(
    null,
  );
  const [viewIdx, setViewIdx] = useState(0);

  const profileRaw = localStorage.getItem("flipchat_my_profile");
  const myProfile: { name: string; avatar?: string } = profileRaw
    ? JSON.parse(profileRaw)
    : { name: "Aap" };

  const demoStatuses: ContactStatus[] = DEMO_CONTACT_STATUSES.map((d) => ({
    contactId: d.contactId,
    name: d.name,
    colorClass: d.colorClass,
    statuses: d.staticStatuses.map((s, i) => ({
      id: `demo-${d.contactId}-${i}`,
      text: s.text,
      timestamp: Date.now() - s.hoursAgo * 3600 * 1000,
    })),
  }));

  function postStatus() {
    if (!newStatusText.trim()) return;
    const entry: StatusEntry = {
      id: `status-${Date.now()}`,
      text: newStatusText.trim(),
      timestamp: Date.now(),
    };
    const updated = [entry, ...myStatuses].filter(
      (s) => Date.now() - s.timestamp < HOURS_24,
    );
    setMyStatuses(updated);
    saveMyStatuses(updated);
    setNewStatusText("");
    setShowAddModal(false);
  }

  function openStatusView(cs: ContactStatus) {
    setViewingStatus(cs);
    setViewIdx(0);
  }

  const myContactStatus: ContactStatus = {
    contactId: "me",
    name: myProfile.name || "Aap",
    avatar: myProfile.avatar,
    colorClass: "bg-primary",
    statuses: myStatuses,
  };

  return (
    <div className="flex flex-col h-full">
      {/* My Status Row */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          {/* Avatar with ring if has status */}
          <button
            type="button"
            data-ocid="status.open_modal_button"
            className="relative flex-shrink-0"
            onClick={() =>
              myStatuses.length > 0
                ? openStatusView(myContactStatus)
                : setShowAddModal(true)
            }
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold overflow-hidden ${
                myStatuses.length > 0
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "ring-2 ring-border ring-offset-2 ring-offset-background"
              }`}
            >
              {myProfile.avatar ? (
                <img
                  src={myProfile.avatar}
                  alt={myProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
              )}
            </div>
            {/* Plus badge */}
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">Mera Status</p>
            <p className="text-xs text-muted-foreground">
              {myStatuses.length > 0
                ? `${myStatuses.length} update · ${timeAgo(myStatuses[0].timestamp)}`
                : "Tap karke status lagao"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1">
            <button
              type="button"
              data-ocid="status.button"
              onClick={() => setShowAddModal(true)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
            >
              <Pencil className="w-4 h-4 text-foreground" />
            </button>
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
            >
              <Camera className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Updates label */}
      {demoStatuses.length > 0 && (
        <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Updates
        </p>
      )}

      {/* Contacts' statuses */}
      <div className="flex-1 overflow-y-auto">
        {demoStatuses.map((cs, idx) => (
          <motion.button
            key={cs.contactId}
            type="button"
            data-ocid={`status.item.${idx + 1}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06 }}
            onClick={() => openStatusView(cs)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-card/80 transition-colors border-b border-border/30 active:bg-accent"
          >
            <div className="relative flex-shrink-0">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ring-2 ring-primary ring-offset-2 ring-offset-background ${cs.colorClass}`}
              >
                {cs.avatar ? (
                  <img
                    src={cs.avatar}
                    alt={cs.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  getInitials(cs.name)
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-sm text-foreground">{cs.name}</p>
              <p className="text-xs text-muted-foreground">
                {cs.statuses.length} update ·{" "}
                {timeAgo(cs.statuses[0].timestamp)}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* ── Add Status Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            key="add-status-overlay"
            className="absolute inset-0 z-50 flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowAddModal(false)}
              onKeyDown={(e) => e.key === "Enter" && setShowAddModal(false)}
              role="button"
              tabIndex={0}
            />
            <motion.div
              className="relative bg-card rounded-t-3xl px-5 pt-5 pb-8 z-10"
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
              <h3 className="text-base font-bold text-foreground mb-1">
                Status Lagao
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Aapka status 24 ghante mein gayab ho jaayega
              </p>

              {/* Emoji quick picks */}
              <div className="flex gap-2 mb-3 flex-wrap">
                {[
                  "😊",
                  "🔥",
                  "❤️",
                  "😂",
                  "🎉",
                  "💪",
                  "🙏",
                  "✨",
                  "😴",
                  "🌙",
                ].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() =>
                      setNewStatusText((prev) => `${prev} ${emoji}`)
                    }
                    className="text-xl p-1.5 rounded-xl hover:bg-muted transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <textarea
                data-ocid="status.textarea"
                className="w-full h-24 rounded-2xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Kya chal raha hai? 🤔"
                value={newStatusText}
                onChange={(e) => setNewStatusText(e.target.value)}
                maxLength={200}
              />
              <p className="text-right text-xs text-muted-foreground mt-1 mb-3">
                {newStatusText.length}/200
              </p>

              <Button
                data-ocid="status.submit_button"
                onClick={postStatus}
                disabled={!newStatusText.trim()}
                className="w-full h-12 rounded-2xl text-base font-semibold"
                style={{
                  background: newStatusText.trim()
                    ? "oklch(var(--primary))"
                    : undefined,
                  opacity: newStatusText.trim() ? 1 : 0.45,
                }}
              >
                Status Lagao ✓
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Status Viewer ── */}
      <AnimatePresence>
        {viewingStatus && (
          <motion.div
            key="status-viewer"
            className="absolute inset-0 z-50 bg-black flex flex-col"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            {/* Progress bars */}
            <div className="flex gap-1 px-3 pt-10 pb-2">
              {viewingStatus.statuses.map((s, i) => (
                <div
                  key={s.id}
                  className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30"
                >
                  <div
                    className={`h-full rounded-full ${
                      i < viewIdx
                        ? "bg-white w-full"
                        : i === viewIdx
                          ? "bg-white w-1/2"
                          : "w-0"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pb-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden ${viewingStatus.colorClass}`}
              >
                {viewingStatus.avatar ? (
                  <img
                    src={viewingStatus.avatar}
                    alt={viewingStatus.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(viewingStatus.name)
                )}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">
                  {viewingStatus.name}
                </p>
                <p className="text-white/60 text-xs">
                  {timeAgo(viewingStatus.statuses[viewIdx]?.timestamp ?? 0)}
                </p>
              </div>
              <button
                type="button"
                data-ocid="status.close_button"
                onClick={() => setViewingStatus(null)}
                className="ml-auto text-white/80 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Status content */}
            <button
              type="button"
              className="flex-1 flex items-center justify-center px-8 cursor-pointer w-full"
              onClick={() => {
                if (viewIdx < viewingStatus.statuses.length - 1) {
                  setViewIdx((v) => v + 1);
                } else {
                  setViewingStatus(null);
                }
              }}
            >
              <p className="text-white text-2xl font-semibold text-center leading-relaxed">
                {viewingStatus.statuses[viewIdx]?.text}
              </p>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
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
  const [logoError, setLogoError] = useState(false);

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
          <div className="w-9 h-9 rounded-md overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
            {logoError ? (
              <span className="text-lg font-black text-primary">F</span>
            ) : (
              <img
                src={LOGO_SRC}
                alt="Flipchat"
                className="w-full h-full object-cover"
                onError={() => setLogoError(true)}
              />
            )}
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
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide relative">
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

        {tab === "status" && <StatusTab />}

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
                        className={`text-xs ${
                          call.direction === "missed"
                            ? "text-red-400"
                            : "text-muted-foreground"
                        }`}
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
      {tab !== "status" && (
        <button
          type="button"
          data-ocid="chatlist.open_modal_button"
          onClick={onNewChat}
          className="absolute bottom-24 right-6 w-14 h-14 rounded-full bg-primary shadow-glow flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-10"
        >
          <Edit className="w-6 h-6 text-white" />
        </button>
      )}

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
