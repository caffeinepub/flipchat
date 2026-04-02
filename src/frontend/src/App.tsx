import { Toaster } from "@/components/ui/sonner";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────

interface User {
  name: string;
  phone: string;
  avatar?: string;
  about?: string;
  memberSince: string;
}

interface Message {
  id: string;
  chatId: string;
  text?: string;
  image?: string;
  sender: string;
  timestamp: number;
  read: boolean;
}

interface Chat {
  id: string;
  isGroup: boolean;
  name: string;
  members: string[];
  avatar?: string;
  messages: Message[];
  unread?: number;
}

type Screen = "splash" | "login" | "main";
type MainTab = "chats" | "calls" | "status" | "profile";

// ─── Constants ───────────────────────────────────────────────────────────────

const TWO_FACTOR_API_KEY = "aa417444-2cad-11f1-ae4a-0200cd936042";

const AVATAR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

const AUTO_REPLIES = [
  "Haan bhai, kya baat hai! 😄",
  "Theek hai, kal baat karte hain",
  "Okay 👍",
  "Ha ha! 😂",
  "Sahi keh raha hai",
  "Kya haal hai?",
  "Thoda busy hoon, baad mein baat karte hain",
  "Bilkul! 😊",
  "Nahi yaar, aaj nahi ho sakta",
  "Kal milte hain pakka!",
];

const DEMO_CHATS: Chat[] = [
  {
    id: "rahul",
    isGroup: false,
    name: "Rahul Sharma",
    members: ["9876543210"],
    messages: [
      {
        id: "m1",
        chatId: "rahul",
        text: "Kya haal hai bhai?",
        sender: "9876543210",
        timestamp: Date.now() - 1800000,
        read: true,
      },
      {
        id: "m2",
        chatId: "rahul",
        text: "Sab theek hai yaar! Tu bata",
        sender: "me",
        timestamp: Date.now() - 1700000,
        read: true,
      },
      {
        id: "m3",
        chatId: "rahul",
        text: "Kya haal hai?",
        sender: "9876543210",
        timestamp: Date.now() - 600000,
        read: false,
      },
    ],
  },
  {
    id: "priya",
    isGroup: false,
    name: "Priya Singh",
    members: ["9876543211"],
    messages: [
      {
        id: "m4",
        chatId: "priya",
        text: "Kal milte hain 😊",
        sender: "9876543211",
        timestamp: Date.now() - 3600000,
        read: true,
      },
      {
        id: "m5",
        chatId: "priya",
        text: "Kal milte hain",
        sender: "9876543211",
        timestamp: Date.now() - 900000,
        read: false,
      },
    ],
  },
  {
    id: "family",
    isGroup: true,
    name: "Family Group",
    members: ["9876543210", "9876543212", "9876543213"],
    messages: [
      {
        id: "m6",
        chatId: "family",
        text: "Sabka kya plan hai weekend ka?",
        sender: "9876543212",
        timestamp: Date.now() - 7200000,
        read: true,
      },
      {
        id: "m7",
        chatId: "family",
        text: "Dinner ready hai! Aa jao sab 🍛",
        sender: "9876543210",
        timestamp: Date.now() - 1200000,
        read: false,
      },
    ],
  },
  {
    id: "work",
    isGroup: true,
    name: "Work Team",
    members: ["9876543210", "9876543214", "9876543215", "9876543216"],
    messages: [
      {
        id: "m8",
        chatId: "work",
        text: "Report bhejo jaldi",
        sender: "9876543214",
        timestamp: Date.now() - 10800000,
        read: true,
      },
      {
        id: "m9",
        chatId: "work",
        text: "Meeting at 3pm everyone",
        sender: "9876543215",
        timestamp: Date.now() - 1800000,
        read: false,
      },
    ],
  },
];

const DEMO_CALLS = [
  {
    id: "c1",
    name: "Rahul Sharma",
    type: "incoming",
    timestamp: Date.now() - 3600000,
    duration: "5:23",
  },
  {
    id: "c2",
    name: "Priya Singh",
    type: "missed",
    timestamp: Date.now() - 7200000,
    duration: "",
  },
  {
    id: "c3",
    name: "Family Group",
    type: "video",
    timestamp: Date.now() - 86400000,
    duration: "15:42",
  },
  {
    id: "c4",
    name: "Amit Kumar",
    type: "outgoing",
    timestamp: Date.now() - 172800000,
    duration: "2:10",
  },
];

const DEMO_STATUSES = [
  {
    id: "s1",
    name: "Rahul Sharma",
    text: "Enjoying life! 🌟",
    bg: "#25D366",
    timestamp: Date.now() - 3600000,
  },
  {
    id: "s2",
    name: "Priya Singh",
    text: "Coffee aur coding ☕",
    bg: "#128C7E",
    timestamp: Date.now() - 7200000,
  },
  {
    id: "s3",
    name: "Amit Kumar",
    text: "Office se chutti! 🎉",
    bg: "#FF6B6B",
    timestamp: Date.now() - 10800000,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Kal";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
}

function genId() {
  return Math.random().toString(36).slice(2);
}

// ─── OTP Service ─────────────────────────────────────────────────────────────

async function sendOTP(phone: string): Promise<void> {
  const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${phone}/AUTOGEN`;
  const response = await fetch(url, { method: "GET" });
  const data = await response.json();
  if (data.Status !== "Success") {
    throw new Error(data.Details || "SMS send karne mein koi problem aayi");
  }
  localStorage.setItem("otpSessionId", data.Details);
}

async function verifyOTP(otp: string): Promise<boolean> {
  const sessionId = localStorage.getItem("otpSessionId");
  if (!sessionId) return false;
  const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`;
  const response = await fetch(url, { method: "GET" });
  const data = await response.json();
  return data.Status === "Success";
}

// ─── Components ──────────────────────────────────────────────────────────────

function FlipLogo({ size = 64 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#25D366",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: "white",
          fontWeight: 800,
          fontSize: size * 0.45,
          fontFamily: "Inter, sans-serif",
          letterSpacing: "-1px",
          lineHeight: 1,
        }}
      >
        F
      </span>
    </div>
  );
}

function Avatar2({
  name,
  image,
  size = 40,
}: { name: string; image?: string; size?: number }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  const color = getAvatarColor(name);
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

// ─── Splash Screen ────────────────────────────────────────────────────────────

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{ background: "#128C7E" }}
      className="flex flex-col items-center justify-center h-full w-full"
    >
      <div className="fade-in flex flex-col items-center gap-4">
        <FlipLogo size={96} />
        <h1 className="text-white text-4xl font-bold tracking-tight">
          Flipchat
        </h1>
        <p className="text-white/70 text-sm">Simple. Secure. Chat.</p>
      </div>
      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-white/60 border-t-white rounded-full animate-spin" />
        <p className="text-white/60 text-xs">
          © {new Date().getFullYear()} Built with love using caffeine.ai
        </p>
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async () => {
    if (!name.trim()) {
      setError("Apna naam daalein");
      return;
    }
    if (phone.length !== 10) {
      setError("10 digit phone number daalein");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendOTP(phone);
      setStep("otp");
      toast.success("OTP bhej diya gaya!");
    } catch (err: any) {
      setError(`SMS nahi gaya: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("6 digit OTP daalein");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const ok = await verifyOTP(otp);
      if (!ok) {
        setError("OTP galat hai, dobara try karein");
        return;
      }
      const user: User = {
        name: name.trim(),
        phone,
        memberSince: new Date().toLocaleDateString("hi-IN", {
          year: "numeric",
          month: "long",
        }),
      };
      localStorage.setItem("flipchat_user", JSON.stringify(user));
      localStorage.removeItem("otpSessionId");
      onLogin(user);
    } catch (err: any) {
      setError(`Verify nahi hua: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div
        style={{ background: "#128C7E" }}
        className="pt-12 pb-8 px-6 flex flex-col items-center gap-3"
      >
        <FlipLogo size={72} />
        <h1 className="text-white text-2xl font-bold">Flipchat</h1>
        <p className="text-white/80 text-sm text-center">
          Phone number se login karein
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col justify-center px-6 gap-4">
        {step === "form" ? (
          <>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">
                Aapka Naam
              </label>
              <input
                data-ocid="login.input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Apna naam likhein"
                className="w-full border-b-2 border-gray-200 focus:border-fc-green outline-none py-2 text-base transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">
                Phone Number (10 digits)
              </label>
              <input
                data-ocid="login.search_input"
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="10 digit number"
                className="w-full border-b-2 border-gray-200 focus:border-fc-green outline-none py-2 text-base transition-colors"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              data-ocid="login.primary_button"
              onClick={handleSendOTP}
              disabled={loading}
              style={{ background: loading ? "#888" : "#25D366" }}
              className="w-full py-3 rounded-full text-white font-semibold text-base mt-2 transition-all active:scale-95"
            >
              {loading ? "Bhej raha hoon..." : "OTP Bhejo"}
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-gray-600 text-sm">
              OTP bheja gaya <strong>+91 {phone}</strong> par
            </p>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">
                OTP Code
              </label>
              <input
                data-ocid="login.textarea"
                type="tel"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="6 digit OTP"
                className="w-full border-b-2 border-gray-200 focus:border-fc-green outline-none py-2 text-base text-center tracking-widest text-xl transition-colors"
                maxLength={6}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              data-ocid="login.submit_button"
              onClick={handleVerify}
              disabled={loading}
              style={{ background: loading ? "#888" : "#25D366" }}
              className="w-full py-3 rounded-full text-white font-semibold text-base mt-2 transition-all active:scale-95"
            >
              {loading ? "Verify ho raha hai..." : "Verify Karo"}
            </button>
            <button
              onClick={() => {
                setStep("form");
                setError("");
              }}
              className="text-center text-sm text-gray-500 underline"
            >
              Number badlein
            </button>
          </>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 pb-6">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}

// ─── Chat List ────────────────────────────────────────────────────────────────

function ChatListScreen({
  chats,
  onOpenChat,
  onNewChat,
}: { chats: Chat[]; onOpenChat: (chat: Chat) => void; onNewChat: () => void }) {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filtered = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div style={{ background: "#128C7E" }} className="px-4 pt-10 pb-3">
        {showSearch ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(false)}
              className="text-white p-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Dhundhein..."
              className="flex-1 bg-white/20 text-white placeholder-white/60 rounded-full px-4 py-1 text-sm outline-none"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h1 className="text-white text-xl font-bold">Flipchat</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSearch(true)}
                className="text-white/90"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
              <button className="text-white/90">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto bg-white" data-ocid="chats.list">
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-40 text-gray-400"
            data-ocid="chats.empty_state"
          >
            <p>Koi chat nahi mila</p>
          </div>
        ) : (
          filtered.map((chat, i) => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            const unread = chat.messages.filter(
              (m) => !m.read && m.sender !== "me",
            ).length;
            return (
              <button
                key={chat.id}
                data-ocid={`chats.item.${i + 1}`}
                onClick={() => onOpenChat(chat)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100 transition-colors"
              >
                <div className="relative">
                  <Avatar2 name={chat.name} image={chat.avatar} size={48} />
                  {chat.isGroup && (
                    <div
                      style={{ background: "#25D366" }}
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-gray-900 text-sm">
                      {chat.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-2 shrink-0">
                      {lastMsg ? formatTime(lastMsg.timestamp) : ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className="text-xs text-gray-500 truncate pr-2">
                      {lastMsg?.sender === "me" && (
                        <span className="text-green-600">✓✓ </span>
                      )}
                      {lastMsg?.text || (lastMsg?.image ? "📷 Photo" : "")}
                    </p>
                    {unread > 0 && (
                      <span
                        style={{ background: "#25D366" }}
                        className="text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-semibold"
                      >
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        data-ocid="chats.open_modal_button"
        onClick={onNewChat}
        style={{ background: "#25D366" }}
        className="absolute bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>
  );
}

// ─── Chat Window ──────────────────────────────────────────────────────────────

function ChatWindow({
  chat,
  user: _user,
  onBack,
  onUpdate,
}: {
  chat: Chat;
  user: User;
  onBack: () => void;
  onUpdate: (chat: Chat) => void;
}) {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [online] = useState(Math.random() > 0.3);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  // Mark as read
  useEffect(() => {
    const updated = {
      ...chat,
      messages: chat.messages.map((m) => ({ ...m, read: true })),
    };
    onUpdate(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.id]);

  const sendMessage = useCallback(
    (text?: string, image?: string) => {
      if (!text?.trim() && !image) return;
      const msg: Message = {
        id: genId(),
        chatId: chat.id,
        text: text?.trim(),
        image,
        sender: "me",
        timestamp: Date.now(),
        read: false,
      };
      const updated = { ...chat, messages: [...chat.messages, msg] };
      onUpdate(updated);

      // Auto-reply
      setIsTyping(true);
      setTimeout(
        () => {
          setIsTyping(false);
          const reply: Message = {
            id: genId(),
            chatId: chat.id,
            text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
            sender: chat.members[0],
            timestamp: Date.now(),
            read: true,
          };
          onUpdate({ ...updated, messages: [...updated.messages, reply] });
        },
        1000 + Math.random() * 2000,
      );
    },
    [chat, onUpdate],
  );

  const handleSend = () => {
    sendMessage(text);
    setText("");
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => sendMessage(undefined, ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const senderName = (sender: string) => {
    const map: Record<string, string> = {
      "9876543210": "Rahul",
      "9876543211": "Priya",
      "9876543212": "Mama",
      "9876543213": "Papa",
      "9876543214": "Boss",
      "9876543215": "Colleague",
      "9876543216": "HR",
    };
    return map[sender] || sender;
  };

  return (
    <div className="flex flex-col h-full slide-in-right">
      {/* Header */}
      <div
        style={{ background: "#128C7E" }}
        className="px-3 pt-10 pb-2 flex items-center gap-3"
      >
        <button
          data-ocid="chat.secondary_button"
          onClick={onBack}
          className="text-white p-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <Avatar2 name={chat.name} image={chat.avatar} size={38} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {chat.name}
          </p>
          <p className="text-white/75 text-xs">
            {isTyping ? (
              <span className="animate-typing">
                <span>•</span>
                <span>•</span>
                <span>•</span> typing...
              </span>
            ) : online ? (
              "online"
            ) : (
              "offline"
            )}
          </p>
        </div>
        <div className="flex gap-4 text-white/90">
          <button data-ocid="chat.toggle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>
          <button data-ocid="chat.link">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.67 9.5a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 3.66 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
          <button data-ocid="chat.dropdown_menu">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-bg px-3 py-3 flex flex-col gap-1">
        {chat.messages.map((msg) => {
          const isMe = msg.sender === "me";
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"} fade-in`}
            >
              <div
                style={{
                  background: isMe ? "#dcf8c6" : "white",
                  maxWidth: "72%",
                  borderRadius: isMe ? "12px 0 12px 12px" : "0 12px 12px 12px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                  padding: "6px 10px 4px",
                }}
              >
                {chat.isGroup && !isMe && (
                  <p
                    style={{ color: "#25D366" }}
                    className="text-xs font-semibold mb-1"
                  >
                    {senderName(msg.sender)}
                  </p>
                )}
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="Sent"
                    className="rounded-lg max-w-full mb-1"
                    style={{ maxHeight: 200 }}
                  />
                )}
                {msg.text && (
                  <p className="text-gray-800 text-sm leading-snug whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                )}
                <div
                  className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-end"}`}
                >
                  <span className="text-[10px] text-gray-400">
                    {formatTime(msg.timestamp)}
                  </span>
                  {isMe && (
                    <span style={{ color: "#4FC3F7" }} className="text-xs">
                      ✓✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white px-2 py-2 flex items-center gap-2 border-t">
        <button className="text-gray-500 p-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>
        <input
          data-ocid="chat.input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Message likhein..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImage}
        />
        <button
          data-ocid="chat.upload_button"
          onClick={() => fileRef.current?.click()}
          className="text-gray-500 p-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <button
          data-ocid="chat.primary_button"
          onClick={handleSend}
          style={{ background: text.trim() ? "#25D366" : "#aaa" }}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="white"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── New Chat Modal ───────────────────────────────────────────────────────────

function NewChatModal({
  onClose,
  onCreateChat,
}: { onClose: () => void; onCreateChat: (chat: Chat) => void }) {
  const [type, setType] = useState<"contact" | "group">("contact");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Naam daalein");
      return;
    }
    const chat: Chat = {
      id: genId(),
      isGroup: type === "group",
      name: name.trim(),
      members: phone ? [phone] : [genId()],
      messages: [],
    };
    onCreateChat(chat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" data-ocid="chats.modal">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-2xl p-6 flex flex-col gap-4">
        <h2 className="font-bold text-lg">Naya Chat</h2>
        <div className="flex gap-2">
          <button
            data-ocid="chats.tab"
            onClick={() => setType("contact")}
            style={{ background: type === "contact" ? "#25D366" : "#f0f0f0" }}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${type === "contact" ? "text-white" : "text-gray-700"}`}
          >
            Contact
          </button>
          <button
            onClick={() => setType("group")}
            style={{ background: type === "group" ? "#25D366" : "#f0f0f0" }}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${type === "group" ? "text-white" : "text-gray-700"}`}
          >
            Group
          </button>
        </div>
        <input
          data-ocid="chats.input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === "group" ? "Group ka naam" : "Contact ka naam"}
          className="border rounded-xl px-4 py-2 text-sm outline-none focus:border-green-500"
        />
        {type === "contact" && (
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="Phone number (optional)"
            className="border rounded-xl px-4 py-2 text-sm outline-none focus:border-green-500"
          />
        )}
        <button
          data-ocid="chats.submit_button"
          onClick={handleCreate}
          style={{ background: "#25D366" }}
          className="py-3 rounded-full text-white font-semibold"
        >
          Banao
        </button>
        <button
          data-ocid="chats.cancel_button"
          onClick={onClose}
          className="text-center text-gray-400 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Calls Screen ─────────────────────────────────────────────────────────────

type CallState = {
  name: string;
  status: "ringing" | "connected";
  seconds: number;
  muted: boolean;
  speaker: boolean;
} | null;

function CallsScreen() {
  const [activeCall, setActiveCall] = useState<CallState>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCall = (name: string) => {
    setActiveCall({
      name,
      status: "ringing",
      seconds: 0,
      muted: false,
      speaker: false,
    });
    setTimeout(() => {
      setActiveCall((prev) => (prev ? { ...prev, status: "connected" } : null));
      timerRef.current = setInterval(() => {
        setActiveCall((prev) =>
          prev ? { ...prev, seconds: prev.seconds + 1 } : null,
        );
      }, 1000);
    }, 2000);
  };

  const endCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveCall(null);
  };

  const fmtSec = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (activeCall) {
    const color = getAvatarColor(activeCall.name);
    return (
      <div
        className="flex flex-col h-full items-center justify-between py-16 px-6 slide-in-right"
        style={{ background: "#1a1a2e" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              color: "white",
              fontWeight: 700,
              boxShadow: "0 0 40px rgba(37,211,102,0.4)",
            }}
          >
            {activeCall.name.charAt(0)}
          </div>
          <h2 className="text-white text-2xl font-bold">{activeCall.name}</h2>
          <p className="text-white/60 text-sm">
            {activeCall.status === "ringing"
              ? "Calling..."
              : fmtSec(activeCall.seconds)}
          </p>
        </div>
        <div className="flex gap-8 items-center">
          <button
            data-ocid="calls.toggle"
            onClick={() =>
              setActiveCall((p) => (p ? { ...p, muted: !p.muted } : null))
            }
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: activeCall.muted ? "#555" : "rgba(255,255,255,0.15)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
          <button
            data-ocid="calls.delete_button"
            onClick={endCall}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "#FF3B30" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              style={{ transform: "rotate(135deg)" }}
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.67 9.5a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 3.66 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
          <button
            onClick={() =>
              setActiveCall((p) => (p ? { ...p, speaker: !p.speaker } : null))
            }
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: activeCall.speaker
                ? "#25D366"
                : "rgba(255,255,255,0.15)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div style={{ background: "#128C7E" }} className="px-4 pt-10 pb-3">
        <h1 className="text-white text-xl font-bold">Calls</h1>
      </div>
      <div className="flex-1 overflow-y-auto bg-white" data-ocid="calls.list">
        {DEMO_CALLS.map((call, i) => (
          <button
            key={call.id}
            data-ocid={`calls.item.${i + 1}`}
            onClick={() => startCall(call.name)}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <Avatar2 name={call.name} size={46} />
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">{call.name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                {call.type === "missed" ? (
                  <span className="text-red-500">↙ Missed</span>
                ) : call.type === "incoming" ? (
                  <span style={{ color: "#25D366" }}>↙ Incoming</span>
                ) : call.type === "video" ? (
                  <span className="text-blue-500">📹 Video</span>
                ) : (
                  <span className="text-gray-500">↗ Outgoing</span>
                )}
                <span>• {formatTime(call.timestamp)}</span>
                {call.duration && <span>• {call.duration}</span>}
              </p>
            </div>
            <button style={{ color: "#25D366" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.67 9.5a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 3.66 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Status Screen ────────────────────────────────────────────────────────────

function StatusScreen({ user }: { user: User }) {
  const [myStatuses, setMyStatuses] = useState<
    { id: string; text: string; bg: string; timestamp: number }[]
  >([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState("");
  const [newBg, setNewBg] = useState("#25D366");
  const [viewStatus, setViewStatus] = useState<
    (typeof DEMO_STATUSES)[0] | null
  >(null);
  const bgOptions = [
    "#25D366",
    "#128C7E",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#F7DC6F",
    "#BB8FCE",
  ];

  const postStatus = () => {
    if (!newText.trim()) {
      toast.error("Status likhein");
      return;
    }
    setMyStatuses((prev) => [
      { id: genId(), text: newText.trim(), bg: newBg, timestamp: Date.now() },
      ...prev,
    ]);
    setNewText("");
    setShowAdd(false);
    toast.success("Status post ho gaya!");
  };

  return (
    <div className="flex flex-col h-full">
      <div style={{ background: "#128C7E" }} className="px-4 pt-10 pb-3">
        <h1 className="text-white text-xl font-bold">Status</h1>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {/* My Status */}
        <div className="px-4 py-2">
          <p className="text-xs text-gray-400 font-medium mb-2">MERA STATUS</p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  padding: 2,
                  background: myStatuses.length > 0 ? "#25D366" : "#e0e0e0",
                }}
              >
                <Avatar2 name={user.name} image={user.avatar} size={48} />
              </div>
              <button
                data-ocid="status.open_modal_button"
                onClick={() => setShowAdd(true)}
                style={{ background: "#25D366" }}
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
            <div>
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">
                {myStatuses.length > 0
                  ? `${myStatuses.length} status update${myStatuses.length > 1 ? "s" : ""}`
                  : "Add status update"}
              </p>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 mx-4 my-1" />

        {/* Recent statuses */}
        <div className="px-4 py-2">
          <p className="text-xs text-gray-400 font-medium mb-2">
            RECENT UPDATES
          </p>
          {DEMO_STATUSES.map((s, i) => (
            <button
              key={s.id}
              data-ocid={`status.item.${i + 1}`}
              onClick={() => setViewStatus(s)}
              className="w-full flex items-center gap-3 py-2"
            >
              <div
                style={{ padding: 2, borderRadius: "50%", background: s.bg }}
              >
                <Avatar2 name={s.name} size={48} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs text-gray-500">
                  {formatTime(s.timestamp)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Add status modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          data-ocid="status.modal"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAdd(false)}
          />
          <div className="relative w-full bg-white rounded-t-2xl p-6 flex flex-col gap-4">
            <h2 className="font-bold text-lg">Apna Status Likhein</h2>
            <div
              style={{
                background: newBg,
                borderRadius: 12,
                minHeight: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 12,
              }}
            >
              <p className="text-white text-center font-semibold">
                {newText || "Yahan likhein..."}
              </p>
            </div>
            <textarea
              data-ocid="status.textarea"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Apna status likhein..."
              className="border rounded-xl px-4 py-2 text-sm outline-none resize-none h-20 focus:border-green-500"
            />
            <div className="flex gap-2 flex-wrap">
              {bgOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewBg(c)}
                  style={{
                    background: c,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: newBg === c ? "3px solid #000" : "none",
                  }}
                />
              ))}
            </div>
            <button
              data-ocid="status.submit_button"
              onClick={postStatus}
              style={{ background: "#25D366" }}
              className="py-3 rounded-full text-white font-semibold"
            >
              Post Karo
            </button>
            <button
              data-ocid="status.cancel_button"
              onClick={() => setShowAdd(false)}
              className="text-gray-400 text-sm text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* View status */}
      {viewStatus && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: viewStatus.bg }}
          onClick={() => setViewStatus(null)}
          data-ocid="status.dialog"
        >
          <div className="pt-12 px-4 flex items-center gap-3">
            <Avatar2 name={viewStatus.name} size={40} />
            <p className="text-white font-semibold">{viewStatus.name}</p>
            <span className="text-white/70 text-xs ml-auto">
              {formatTime(viewStatus.timestamp)}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center px-8">
            <p className="text-white text-2xl font-bold text-center">
              {viewStatus.text}
            </p>
          </div>
          <button
            data-ocid="status.close_button"
            className="absolute top-4 right-4 text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────

function ProfileScreen({
  user,
  onUpdate,
}: { user: User; onUpdate: (u: User) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(user.name);
  const [showAbout, setShowAbout] = useState(false);
  const [aboutVal, setAboutVal] = useState(user.about || "");

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const updated = { ...user, avatar: ev.target?.result as string };
      onUpdate(updated);
    };
    reader.readAsDataURL(file);
  };

  const saveName = () => {
    if (!nameVal.trim()) return;
    onUpdate({ ...user, name: nameVal.trim() });
    setEditName(false);
    toast.success("Naam update ho gaya!");
  };

  const saveAbout = () => {
    onUpdate({ ...user, about: aboutVal });
    setShowAbout(false);
    toast.success("About update ho gaya!");
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div style={{ background: "#128C7E" }} className="px-4 pt-10 pb-4">
        <h1 className="text-white text-xl font-bold">Profile</h1>
      </div>

      {/* Avatar section */}
      <div className="bg-white py-6 flex flex-col items-center gap-2">
        <div className="relative">
          <Avatar2 name={user.name} image={user.avatar} size={80} />
          <button
            data-ocid="profile.edit_button"
            onClick={() => fileRef.current?.click()}
            style={{ background: "#25D366" }}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhoto}
        />
        <p
          style={{ color: "#25D366" }}
          className="text-sm font-medium cursor-pointer"
        >
          Edit
        </p>
      </div>

      {/* Info rows */}
      <div className="bg-white mt-2 flex flex-col divide-y divide-gray-100">
        {/* Name */}
        <div className="flex items-center px-4 py-4 gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#25D366"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Name</p>
            {editName ? (
              <div className="flex gap-2 items-center mt-0.5">
                <input
                  data-ocid="profile.input"
                  autoFocus
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  className="flex-1 border-b border-green-500 outline-none text-sm py-0.5"
                />
                <button
                  data-ocid="profile.save_button"
                  onClick={saveName}
                  style={{ color: "#25D366" }}
                  className="text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-800 mt-0.5">{user.name}</p>
            )}
          </div>
          {!editName && (
            <button
              data-ocid="profile.secondary_button"
              onClick={() => setEditName(true)}
              style={{ color: "#25D366" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </div>

        {/* About */}
        <button
          data-ocid="profile.panel"
          onClick={() => setShowAbout(true)}
          className="flex items-center px-4 py-4 gap-3 w-full text-left"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#25D366"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex-1">
            <p className="text-xs text-gray-400">About</p>
            <p
              style={{ color: user.about ? "#333" : "#25D366" }}
              className="text-sm mt-0.5"
            >
              {user.about || "Set About"}
            </p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ccc"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Phone */}
        <div className="flex items-center px-4 py-4 gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#25D366"
            strokeWidth="2"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.67 9.5a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 3.66 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <div>
            <p className="text-xs text-gray-400">Phone</p>
            <p className="text-sm text-gray-800 mt-0.5">+91 {user.phone}</p>
          </div>
        </div>

        {/* Member since */}
        <div className="flex items-center px-4 py-4 gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#25D366"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div>
            <p className="text-xs text-gray-400">Member Since</p>
            <p className="text-sm text-gray-800 mt-0.5">{user.memberSince}</p>
          </div>
        </div>
      </div>

      {/* About modal */}
      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          data-ocid="profile.modal"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAbout(false)}
          />
          <div className="relative w-full bg-white rounded-t-2xl p-6 flex flex-col gap-4">
            <h2 className="font-bold text-lg">About</h2>
            <textarea
              data-ocid="profile.textarea"
              value={aboutVal}
              onChange={(e) => setAboutVal(e.target.value)}
              placeholder="Apne baare mein likhein..."
              className="border rounded-xl px-4 py-2 text-sm outline-none resize-none h-24 focus:border-green-500"
              maxLength={100}
            />
            <button
              data-ocid="profile.submit_button"
              onClick={saveAbout}
              style={{ background: "#25D366" }}
              className="py-3 rounded-full text-white font-semibold"
            >
              Save
            </button>
            <button
              data-ocid="profile.cancel_button"
              onClick={() => setShowAbout(false)}
              className="text-gray-400 text-sm text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function MainApp({
  user: initialUser,
  onLogout: _onLogout,
}: { user: User; onLogout: () => void }) {
  const [user, setUser] = useState(initialUser);
  const [tab, setTab] = useState<MainTab>("chats");
  const [chats, setChats] = useState<Chat[]>(DEMO_CHATS);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  const updateUser = (u: User) => {
    setUser(u);
    localStorage.setItem("flipchat_user", JSON.stringify(u));
  };

  const updateChat = useCallback((updated: Chat) => {
    setChats((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setActiveChat(updated);
  }, []);

  const createChat = (chat: Chat) => {
    setChats((prev) => [chat, ...prev]);
    setActiveChat(chat);
    setTab("chats");
  };

  // When tab changes, close active chat
  const handleTabChange = (t: MainTab) => {
    setActiveChat(null);
    setTab(t);
  };

  const tabs: { key: MainTab; icon: React.ReactNode; label: string }[] = [
    {
      key: "chats",
      label: "Chats",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      key: "calls",
      label: "Calls",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.67 9.5a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 3.66 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      ),
    },
    {
      key: "status",
      label: "Status",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      key: "profile",
      label: "Profile",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full relative">
      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            user={user}
            onBack={() => setActiveChat(null)}
            onUpdate={updateChat}
          />
        ) : (
          <>
            {tab === "chats" && (
              <ChatListScreen
                chats={chats}
                onOpenChat={setActiveChat}
                onNewChat={() => setShowNewChat(true)}
              />
            )}
            {tab === "calls" && <CallsScreen />}
            {tab === "status" && <StatusScreen user={user} />}
            {tab === "profile" && (
              <ProfileScreen user={user} onUpdate={updateUser} />
            )}
          </>
        )}
      </div>

      {/* Bottom tab bar */}
      {!activeChat && (
        <nav
          className="bg-white border-t border-gray-200 flex"
          data-ocid="main.tab"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              data-ocid={`nav.${t.key}.link`}
              onClick={() => handleTabChange(t.key)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors"
              style={{ color: tab === t.key ? "#25D366" : "#888" }}
            >
              {t.icon}
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </nav>
      )}

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreateChat={createChat}
        />
      )}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("flipchat_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        setScreen("main");
        return;
      } catch {
        /* ignore */
      }
    }
    setScreen("splash");
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setScreen("main");
  };

  const handleLogout = () => {
    localStorage.removeItem("flipchat_user");
    setUser(null);
    setScreen("login");
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-200">
      <div
        className="relative flex flex-col w-full overflow-hidden bg-white"
        style={{ maxWidth: 480, minHeight: "100svh", height: "100svh" }}
      >
        {screen === "splash" && (
          <SplashScreen onDone={() => setScreen("login")} />
        )}
        {screen === "login" && <LoginScreen onLogin={handleLogin} />}
        {screen === "main" && user && (
          <MainApp user={user} onLogout={handleLogout} />
        )}
        <Toaster position="top-center" />
      </div>
    </div>
  );
}
