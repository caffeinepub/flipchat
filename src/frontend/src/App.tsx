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
  sender: string; // "me" or a phone number
  senderName?: string;
  timestamp: number;
  status: "sending" | "sent" | "delivered" | "read";
}

interface Chat {
  id: string;
  isGroup: boolean;
  name: string;
  phone?: string; // for DMs
  members: string[];
  avatar?: string;
  messages: Message[];
}

type Screen = "splash" | "login" | "main";
type MainTab = "chats" | "calls" | "status" | "profile";
type CallState = {
  name: string;
  phone?: string;
  status: "ringing" | "connected";
  seconds: number;
  muted: boolean;
  speaker: boolean;
  type: "voice" | "video";
} | null;

// ─── Constants ───────────────────────────────────────────────────────────────

const TWO_FACTOR_API_KEY = "aa417444-2cad-11f1-ae4a-0200cd936042";

const AVATAR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F0A500",
];

const DEMO_CHATS: Chat[] = [
  {
    id: "rahul",
    isGroup: false,
    name: "Rahul Sharma",
    phone: "9876543210",
    members: ["9876543210"],
    messages: [
      {
        id: "m1",
        chatId: "rahul",
        text: "Kya haal hai bhai?",
        sender: "9876543210",
        senderName: "Rahul",
        timestamp: Date.now() - 1800000,
        status: "read",
      },
      {
        id: "m2",
        chatId: "rahul",
        text: "Sab theek hai yaar! Tu bata 😊",
        sender: "me",
        timestamp: Date.now() - 1700000,
        status: "read",
      },
      {
        id: "m3",
        chatId: "rahul",
        text: "Kal milte hain kya?",
        sender: "9876543210",
        senderName: "Rahul",
        timestamp: Date.now() - 600000,
        status: "delivered",
      },
    ],
  },
  {
    id: "priya",
    isGroup: false,
    name: "Priya Singh",
    phone: "9876543211",
    members: ["9876543211"],
    messages: [
      {
        id: "m4",
        chatId: "priya",
        text: "Hey! Kaise ho? 😊",
        sender: "9876543211",
        senderName: "Priya",
        timestamp: Date.now() - 3600000,
        status: "read",
      },
      {
        id: "m5",
        chatId: "priya",
        text: "Kal milte hain cafe mein!",
        sender: "9876543211",
        senderName: "Priya",
        timestamp: Date.now() - 900000,
        status: "delivered",
      },
    ],
  },
  {
    id: "family",
    isGroup: true,
    name: "Family Group 🏠",
    members: ["9876543210", "9876543212", "9876543213"],
    messages: [
      {
        id: "m6",
        chatId: "family",
        text: "Sabka kya plan hai weekend ka? 🎉",
        sender: "9876543212",
        senderName: "Mama",
        timestamp: Date.now() - 7200000,
        status: "read",
      },
      {
        id: "m7",
        chatId: "family",
        text: "Dinner ready hai! Aa jao sab 🍛",
        sender: "9876543210",
        senderName: "Rahul",
        timestamp: Date.now() - 1200000,
        status: "delivered",
      },
    ],
  },
  {
    id: "work",
    isGroup: true,
    name: "Work Team 💼",
    members: ["9876543214", "9876543215", "9876543216"],
    messages: [
      {
        id: "m8",
        chatId: "work",
        text: "Report bhejo jaldi",
        sender: "9876543214",
        senderName: "Boss",
        timestamp: Date.now() - 10800000,
        status: "read",
      },
      {
        id: "m9",
        chatId: "work",
        text: "Meeting at 3pm everyone! 🕒",
        sender: "9876543215",
        senderName: "Manager",
        timestamp: Date.now() - 1800000,
        status: "delivered",
      },
    ],
  },
];

const DEMO_CALLS = [
  {
    id: "c1",
    name: "Rahul Sharma",
    phone: "9876543210",
    type: "incoming",
    timestamp: Date.now() - 3600000,
    duration: "5:23",
  },
  {
    id: "c2",
    name: "Priya Singh",
    phone: "9876543211",
    type: "missed",
    timestamp: Date.now() - 7200000,
    duration: "",
  },
  {
    id: "c3",
    name: "Family Group",
    phone: "",
    type: "video",
    timestamp: Date.now() - 86400000,
    duration: "15:42",
  },
  {
    id: "c4",
    name: "Amit Kumar",
    phone: "9876543217",
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
  {
    id: "s4",
    name: "Neha Gupta",
    text: "Gym done! 💪",
    bg: "#4ECDC4",
    timestamp: Date.now() - 14400000,
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

const CHATS_KEY = "flipchat_chats_v2";

function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    if (raw) return JSON.parse(raw) as Chat[];
  } catch {}
  const initial = DEMO_CHATS.map((c) => ({ ...c }));
  localStorage.setItem(CHATS_KEY, JSON.stringify(initial));
  return initial;
}

function saveChats(chats: Chat[]) {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

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
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  const [err, setErr] = useState(false);
  if (err) {
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
          fontSize: size * 0.45,
          color: "white",
          fontWeight: 900,
          flexShrink: 0,
          boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
        }}
      >
        F
      </div>
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
      }}
    >
      <img
        src="/assets/inshot_20260402_072715578-019d519a-e3c5-7106-a329-0cab0d9719e7.png"
        alt="Flipchat"
        style={{ width: size, height: size, objectFit: "cover" }}
        onError={() => setErr(true)}
      />
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
      style={{ background: "linear-gradient(135deg, #128C7E, #25D366)" }}
      className="flex flex-col items-center justify-center h-full w-full"
    >
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        <FlipLogo size={100} />
        <h1 className="text-white text-4xl font-bold tracking-tight">
          Flipchat
        </h1>
        <p className="text-white/80 text-base">Simple. Secure. Chat.</p>
      </div>
      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        <p className="text-white/60 text-xs">
          © {new Date().getFullYear()} Flipchat
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
      toast.success("OTP bhej diya gaya! ✅");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Koi error aaya";
      setError(`SMS nahi gaya: ${msg}`);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Koi error aaya";
      setError(`Verify nahi hua: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f0f5f5" }}>
      <div
        style={{ background: "linear-gradient(135deg, #128C7E, #25D366)" }}
        className="pt-14 pb-10 px-6 flex flex-col items-center gap-4"
      >
        <FlipLogo size={80} />
        <h1 className="text-white text-2xl font-bold">Flipchat</h1>
        <p className="text-white/80 text-sm text-center">
          Phone number se login karein
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 gap-5 bg-white mx-4 -mt-6 rounded-2xl shadow-lg">
        {step === "form" ? (
          <>
            <div className="pt-6">
              <label
                htmlFor="login-name"
                className="text-xs text-gray-500 font-semibold mb-2 block"
              >
                AAPKA NAAM
              </label>
              <input
                id="login-name"
                data-ocid="login.input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                placeholder="Apna naam likhein..."
                className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3 text-base outline-none transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="login-phone"
                className="text-xs text-gray-500 font-semibold mb-2 block"
              >
                PHONE NUMBER
              </label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center px-3 py-3 bg-gray-100 rounded-xl border-2 border-gray-200 font-semibold text-gray-700 text-sm flex-shrink-0">
                  +91
                </div>
                <input
                  id="login-phone"
                  data-ocid="login.search_input"
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                  placeholder="10 digit number"
                  className="flex-1 border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3 text-base outline-none transition-colors"
                  maxLength={10}
                />
              </div>
            </div>
            {error && (
              <p className="text-red-500 text-sm font-medium">{error}</p>
            )}
            <button
              type="button"
              data-ocid="login.primary_button"
              onClick={handleSendOTP}
              disabled={loading || !name.trim() || phone.length < 10}
              style={{
                background:
                  loading || !name.trim() || phone.length < 10
                    ? "#aaa"
                    : "#25D366",
              }}
              className="py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95 mb-6"
            >
              {loading ? "Bhej raha hoon... ⏳" : "OTP Bhejo 📱"}
            </button>
          </>
        ) : (
          <>
            <div className="pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">📱</span>
              </div>
              <p className="text-gray-700 font-semibold">OTP bheja gaya</p>
              <p className="text-gray-500 text-sm mt-1">
                +91 {phone} par 6 digit code gaya hai
              </p>
            </div>
            <div>
              <label
                htmlFor="login-otp"
                className="text-xs text-gray-500 font-semibold mb-2 block"
              >
                OTP CODE
              </label>
              <input
                id="login-otp"
                data-ocid="login.textarea"
                type="tel"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="_ _ _ _ _ _"
                className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3 text-2xl text-center tracking-[0.5em] outline-none transition-colors font-bold"
                maxLength={6}
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm font-medium text-center">
                {error}
              </p>
            )}
            <button
              type="button"
              data-ocid="login.submit_button"
              onClick={handleVerify}
              disabled={loading || otp.length !== 6}
              style={{
                background: loading || otp.length !== 6 ? "#aaa" : "#25D366",
              }}
              className="py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95"
            >
              {loading ? "Verify ho raha hai... ⏳" : "Verify Karo ✓"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setError("");
              }}
              className="text-center text-sm text-gray-400 underline pb-4"
            >
              Number badlein
            </button>
          </>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 py-4">
        © {new Date().getFullYear()} Flipchat · Built with{" "}
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

// ─── Chat Window ──────────────────────────────────────────────────────────────

function ChatWindow({
  chat: initialChat,
  user,
  onBack,
  onUpdateChat,
  onStartCall,
}: {
  chat: Chat;
  user: User;
  onBack: () => void;
  onUpdateChat: (chatId: string, updater: (c: Chat) => Chat) => void;
  onStartCall: (name: string, phone: string, type: "voice" | "video") => void;
}) {
  const [chat, setChat] = useState(initialChat);
  const [text, setText] = useState("");
  const [isTyping, _setIsTyping] = useState(false);
  const [typingName, _setTypingName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync from parent when chat prop changes externally
  const chatId = initialChat.id;

  useEffect(() => {
    function syncFromStorage() {
      const all = loadChats();
      const found = all.find((c) => c.id === chatId);
      if (found) setChat(found);
    }
    syncFromStorage();
    // Real-time sync via storage events (cross-tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === CHATS_KEY) syncFromStorage();
    };
    window.addEventListener("storage", onStorage);
    const interval = setInterval(syncFromStorage, 1000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, [chatId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message/typing change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length, isTyping]);

  // Mark messages read
  useEffect(() => {
    const all = loadChats();
    const idx = all.findIndex((c) => c.id === chatId);
    if (idx >= 0) {
      all[idx].messages = all[idx].messages.map((m) =>
        m.sender !== "me" && m.status !== "read"
          ? { ...m, status: "read" as const }
          : m,
      );
      saveChats(all);
    }
  }, [chatId]);

  const sendMessage = useCallback(
    (msgText?: string, image?: string) => {
      const content = msgText ?? text;
      if (!content.trim() && !image) return;

      const msg: Message = {
        id: genId(),
        chatId,
        text: content.trim() || undefined,
        image,
        sender: "me",
        senderName: user.name,
        timestamp: Date.now(),
        status: "sent",
      };

      const all = loadChats();
      const idx = all.findIndex((c) => c.id === chatId);
      if (idx >= 0) {
        all[idx].messages = [...all[idx].messages, msg];
        saveChats(all);
        setChat({ ...all[idx] });
        onUpdateChat(chatId, () => all[idx]);
      }

      setText("");

      // Update message status to delivered after 1s
      setTimeout(() => {
        const all2 = loadChats();
        const idx2 = all2.findIndex((c) => c.id === chatId);
        if (idx2 >= 0) {
          const msgIdx = all2[idx2].messages.findIndex((m) => m.id === msg.id);
          if (msgIdx >= 0) {
            all2[idx2].messages[msgIdx].status = "delivered";
            saveChats(all2);
            setChat({ ...all2[idx2] });
          }
        }
      }, 1000);
    },
    [text, chatId, user.name, onUpdateChat],
  );

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => sendMessage("", ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const senderDisplayName = (msg: Message) => {
    if (msg.sender === "me") return user.name;
    return msg.senderName || msg.sender;
  };

  const isOnline = ["rahul", "priya"].includes(chatId) || Math.random() > 0.5;
  const headerSub = isTyping
    ? `${typingName || "Contact"} typing...`
    : chat.isGroup
      ? `${chat.members.length} members`
      : isOnline
        ? "online"
        : "offline";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        style={{ background: "#128C7E" }}
        className="px-3 pt-10 pb-2 flex items-center gap-3 flex-shrink-0"
      >
        <button
          type="button"
          data-ocid="chat.secondary_button"
          onClick={onBack}
          className="text-white p-1.5"
        >
          <svg
            aria-hidden="true"
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
        <div className="relative">
          <Avatar2 name={chat.name} image={chat.avatar} size={38} />
          {!chat.isGroup && isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#128C7E]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {chat.name}
          </p>
          <p
            className={`text-xs ${isTyping ? "text-green-300" : "text-white/75"}`}
          >
            {headerSub}
          </p>
        </div>
        <div className="flex gap-3 text-white/90">
          {!chat.isGroup && (
            <>
              <button
                type="button"
                data-ocid="chat.toggle"
                onClick={() =>
                  onStartCall(chat.name, chat.phone || "", "video")
                }
                className="p-1.5"
              >
                <svg
                  aria-hidden="true"
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
              <button
                type="button"
                data-ocid="chat.link"
                onClick={() =>
                  onStartCall(chat.name, chat.phone || "", "voice")
                }
                className="p-1.5"
              >
                <svg
                  aria-hidden="true"
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
            </>
          )}
          <button
            type="button"
            data-ocid="chat.dropdown_menu"
            className="p-1.5"
          >
            <svg
              aria-hidden="true"
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

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1"
        style={{ background: "#e5ddd5" }}
        data-ocid="chat.panel"
      >
        {chat.messages.map((msg, i) => {
          const isMe = msg.sender === "me";
          const showName = chat.isGroup && !isMe;
          const senderColor = getAvatarColor(senderDisplayName(msg));
          return (
            <div
              key={msg.id}
              data-ocid={`chat.item.${i + 1}`}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                style={{
                  background: isMe ? "#dcf8c6" : "white",
                  maxWidth: "72%",
                  borderRadius: isMe
                    ? "12px 2px 12px 12px"
                    : "2px 12px 12px 12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  padding: "6px 10px 5px",
                }}
              >
                {showName && (
                  <p
                    className="text-xs font-bold mb-0.5"
                    style={{ color: senderColor }}
                  >
                    {senderDisplayName(msg)}
                  </p>
                )}
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="Sent"
                    className="rounded-lg max-w-full mb-1"
                    style={{ maxHeight: 220 }}
                  />
                )}
                {msg.text && (
                  <p className="text-gray-800 text-sm leading-snug whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                )}
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className="text-[10px] text-gray-400">
                    {formatTime(msg.timestamp)}
                  </span>
                  {isMe && (
                    <span className="text-xs">
                      {msg.status === "read" ? (
                        <span style={{ color: "#4FC3F7" }}>✓✓</span>
                      ) : msg.status === "delivered" ? (
                        <span className="text-gray-400">✓✓</span>
                      ) : (
                        <span className="text-gray-400">✓</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div
              style={{
                background: "white",
                borderRadius: "2px 12px 12px 12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                padding: "8px 14px",
              }}
            >
              {typingName && (
                <p className="text-xs text-gray-400 mb-1">{typingName}</p>
              )}
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white px-2 py-2 flex items-center gap-2 border-t border-gray-200 flex-shrink-0">
        <button
          type="button"
          data-ocid="chat.upload_button"
          onClick={() => fileRef.current?.click()}
          className="text-gray-500 p-1.5 hover:text-gray-700"
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImage}
        />
        <input
          data-ocid="chat.input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              sendMessage();
            }
          }}
          placeholder="Message likhein..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300"
        />
        <button
          type="button"
          data-ocid="chat.primary_button"
          onClick={() => sendMessage()}
          disabled={!text.trim()}
          style={{ background: text.trim() ? "#25D366" : "#ccc" }}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
        >
          <svg
            aria-hidden="true"
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
      phone: type === "contact" ? phone : undefined,
      members: phone ? [phone] : [genId()],
      messages: [],
    };
    onCreateChat(chat);
    onClose();
    toast.success("Naya chat bana! 🎉");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" data-ocid="chats.modal">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Enter" && onClose()}
        role="button"
        tabIndex={0}
      />
      <div className="relative w-full bg-white rounded-t-3xl p-6 flex flex-col gap-4">
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-2" />
        <h2 className="font-bold text-lg text-gray-900">Naya Chat Banao</h2>
        <div className="flex gap-2">
          <button
            type="button"
            data-ocid="chats.tab"
            onClick={() => setType("contact")}
            style={{ background: type === "contact" ? "#25D366" : "#f0f0f0" }}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${type === "contact" ? "text-white" : "text-gray-700"}`}
          >
            Contact
          </button>
          <button
            type="button"
            onClick={() => setType("group")}
            style={{ background: type === "group" ? "#25D366" : "#f0f0f0" }}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${type === "group" ? "text-white" : "text-gray-700"}`}
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
          className="border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        />
        {type === "contact" && (
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="Phone number (optional)"
            className="border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
        )}
        <button
          type="button"
          data-ocid="chats.submit_button"
          onClick={handleCreate}
          style={{ background: "#25D366" }}
          className="py-3.5 rounded-2xl text-white font-bold text-base"
        >
          Banao ✓
        </button>
        <button
          type="button"
          data-ocid="chats.cancel_button"
          onClick={onClose}
          className="text-center text-gray-400 text-sm pb-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Active Call Screen ────────────────────────────────────────────────────────

function ActiveCallScreen({
  call,
  onEnd,
  onToggleMute,
  onToggleSpeaker,
}: {
  call: CallState;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
}) {
  if (!call) return null;
  const color = getAvatarColor(call.name);
  const fmtSec = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div
      className="flex flex-col h-full items-center justify-between py-16 px-6"
      style={{
        background: "linear-gradient(180deg, #1a1a2e 0%, #0d3b2b 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-5">
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            color: "white",
            fontWeight: 700,
            boxShadow: "0 0 50px rgba(37,211,102,0.5)",
          }}
        >
          {call.name.charAt(0)}
        </div>
        <h2 className="text-white text-2xl font-bold">{call.name}</h2>
        <p className="text-white/60 text-base">
          {call.status === "ringing" ? "Calling... 📞" : fmtSec(call.seconds)}
        </p>
        {call.type === "video" && call.status === "connected" && (
          <div className="w-40 h-28 rounded-xl bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
            Camera Preview
          </div>
        )}
      </div>
      <div className="flex gap-8 items-center">
        <button
          type="button"
          data-ocid="calls.toggle"
          onClick={onToggleMute}
          className="w-14 h-14 rounded-full flex flex-col items-center justify-center gap-1"
          style={{ background: call.muted ? "#555" : "rgba(255,255,255,0.15)" }}
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
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
          <span className="text-white/70 text-[10px]">Mute</span>
        </button>
        <button
          type="button"
          data-ocid="calls.delete_button"
          onClick={onEnd}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "#FF3B30" }}
        >
          <svg
            aria-hidden="true"
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
          type="button"
          className="w-14 h-14 rounded-full flex flex-col items-center justify-center gap-1"
          onClick={onToggleSpeaker}
          style={{
            background: call.speaker ? "#22c55e" : "rgba(255,255,255,0.15)",
          }}
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <span className="text-white/70 text-[10px]">Speaker</span>
        </button>
      </div>
    </div>
  );
}

// ─── Status Screen ────────────────────────────────────────────────────────────

interface StatusEntry {
  id: string;
  text: string;
  image?: string;
  timestamp: number;
}

function StatusScreen({ user }: { user: User }) {
  const [myStatuses, setMyStatuses] = useState<StatusEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("flipchat_statuses") || "[]");
    } catch {
      return [];
    }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [viewing, setViewing] = useState<{
    name: string;
    text: string;
    bg: string;
    image?: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function addStatus() {
    if (!newText.trim() && !newImage) return;
    const entry: StatusEntry = {
      id: genId(),
      text: newText.trim(),
      image: newImage || undefined,
      timestamp: Date.now(),
    };
    const updated = [entry, ...myStatuses];
    setMyStatuses(updated);
    localStorage.setItem("flipchat_statuses", JSON.stringify(updated));
    setNewText("");
    setNewImage(null);
    setShowAdd(false);
    toast.success("Status lag gaya! ✅");
  }

  const timeAgo = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 60000);
    if (diff < 1) return "abhi";
    if (diff < 60) return `${diff} min pehle`;
    return `${Math.floor(diff / 60)} ghante pehle`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            const r = new FileReader();
            r.onload = (ev) => setNewImage(ev.target?.result as string);
            r.readAsDataURL(f);
          }
          e.target.value = "";
        }}
      />

      {/* My status row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button
          type="button"
          data-ocid="status.open_modal_button"
          onClick={() => setShowAdd(true)}
          className="relative"
        >
          <div
            className="w-14 h-14 rounded-full overflow-hidden"
            style={{ border: "3px solid #25D366" }}
          >
            <div
              style={{
                background: getAvatarColor(user.name),
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: 22,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-white">
            <span className="text-white text-xs font-bold">+</span>
          </div>
        </button>
        <div>
          <p className="font-semibold text-sm text-gray-900">Mera Status</p>
          <p className="text-xs text-gray-400">
            {myStatuses.length > 0
              ? `${myStatuses.length} update · ${timeAgo(myStatuses[0].timestamp)}`
              : "Tap karke status lagao"}
          </p>
        </div>
      </div>

      <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase">
        Recent Updates
      </p>

      <div className="flex-1 overflow-y-auto">
        {DEMO_STATUSES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            data-ocid={`status.item.${i + 1}`}
            onClick={() => setViewing(s)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100"
          >
            <div
              className="w-14 h-14 rounded-full overflow-hidden"
              style={{ border: "3px solid #25D366" }}
            >
              <div
                style={{
                  background: s.bg,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 22,
                }}
              >
                {s.name.charAt(0)}
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">{s.name}</p>
              <p className="text-xs text-gray-400">{timeAgo(s.timestamp)}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Add Status Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAdd(false)}
            onKeyDown={(e) => e.key === "Enter" && setShowAdd(false)}
            role="button"
            tabIndex={0}
          />
          <div className="relative w-full bg-white rounded-t-3xl p-6 z-10">
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-4">Status Lagao</h3>
            {newImage ? (
              <div className="relative mb-3">
                <img
                  src={newImage}
                  alt="preview"
                  className="w-full max-h-40 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setNewImage(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white text-sm"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-ocid="status.dropzone"
                onClick={() => fileRef.current?.click()}
                className="w-full h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 mb-3 hover:border-green-400"
              >
                <span className="text-2xl">📷</span>
                <span className="text-xs text-gray-400">
                  Photo add karo (optional)
                </span>
              </button>
            )}
            <textarea
              data-ocid="status.textarea"
              className="w-full h-20 rounded-xl bg-gray-100 px-4 py-3 text-sm outline-none resize-none border-2 border-transparent focus:border-green-400 mb-3"
              placeholder="Kya chal raha hai? 🤔"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              maxLength={200}
            />
            <button
              type="button"
              data-ocid="status.submit_button"
              onClick={addStatus}
              disabled={!newText.trim() && !newImage}
              style={{
                background: newText.trim() || newImage ? "#25D366" : "#ccc",
              }}
              className="w-full py-3.5 rounded-2xl text-white font-bold"
            >
              Status Lagao ✓
            </button>
          </div>
        </div>
      )}

      {/* Status Viewer */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: viewing.bg }}
        >
          <div className="flex items-center gap-3 px-4 pt-12 pb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
              style={{ background: "rgba(0,0,0,0.3)", fontSize: 18 }}
            >
              {viewing.name.charAt(0)}
            </div>
            <p className="text-white font-semibold">{viewing.name}</p>
            <button
              type="button"
              data-ocid="status.close_button"
              onClick={() => setViewing(null)}
              className="ml-auto text-white text-2xl"
            >
              ×
            </button>
          </div>
          <button
            type="button"
            className="flex-1 flex items-center justify-center px-8"
            onClick={() => setViewing(null)}
          >
            <p className="text-white text-2xl font-bold text-center">
              {viewing.text}
            </p>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────

function ProfileScreen({
  user,
  onSave,
  onLogout,
}: { user: User; onSave: (u: User) => void; onLogout: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [about, setAbout] = useState(
    user.about || "Hey there! I am using Flipchat",
  );
  const [avatar, setAvatar] = useState(user.avatar);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    onSave({ ...user, name, about, avatar });
    setEditing(false);
    toast.success("Profile save ho gaya! ✅");
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div
        style={{ background: "#128C7E" }}
        className="px-4 pt-12 pb-6 flex items-center gap-3"
      >
        <h1 className="text-white text-xl font-bold">Profile</h1>
        <button
          type="button"
          data-ocid="profile.edit_button"
          onClick={() => (editing ? handleSave() : setEditing(true))}
          className="ml-auto w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          {editing ? (
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center -mt-1 pt-6 pb-4 bg-white border-b border-gray-100">
          <div className="relative mb-3">
            <div
              className="w-28 h-28 rounded-full overflow-hidden"
              style={{ border: "4px solid #25D366" }}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: getAvatarColor(name),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 44,
                  }}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {editing && (
              <button
                type="button"
                data-ocid="profile.upload_button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "#25D366" }}
              >
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                const r = new FileReader();
                r.onload = (ev) => setAvatar(ev.target?.result as string);
                r.readAsDataURL(f);
              }
            }}
          />
          {editing ? (
            <input
              data-ocid="profile.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xl font-bold text-center border-b-2 border-green-400 outline-none pb-1 px-2"
            />
          ) : (
            <h2 className="text-xl font-bold text-gray-900">{name}</h2>
          )}
          {editing ? (
            <input
              data-ocid="profile.textarea"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="text-sm text-center text-gray-500 border-b border-gray-200 outline-none pb-1 px-2 mt-1"
            />
          ) : (
            <p className="text-sm text-gray-500 mt-1">{about}</p>
          )}
        </div>

        <div className="mx-4 mt-4 space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-1">
              Phone Number
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg">📱</span>
              <p className="text-sm font-medium text-gray-800">
                +91 {user.phone}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-1">
              About
            </p>
            <p className="text-sm text-gray-800">{about}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-1">
              Member Since
            </p>
            <p className="text-sm text-gray-800">{user.memberSince}</p>
          </div>
        </div>

        <div className="mx-4 mt-4 mb-8">
          <button
            type="button"
            data-ocid="profile.delete_button"
            onClick={onLogout}
            className="w-full py-3.5 rounded-2xl font-bold text-white"
            style={{ background: "#FF3B30" }}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Calls Tab ────────────────────────────────────────────────────────────────

function CallsTab({
  onStartCall,
}: {
  onStartCall: (name: string, phone: string, type: "voice" | "video") => void;
}) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto" data-ocid="calls.list">
        {DEMO_CALLS.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-40 text-gray-400"
            data-ocid="calls.empty_state"
          >
            <p>Koi recent calls nahi</p>
          </div>
        ) : (
          DEMO_CALLS.map((call, i) => (
            <button
              type="button"
              key={call.id}
              data-ocid={`calls.item.${i + 1}`}
              onClick={() => onStartCall(call.name, call.phone, "voice")}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <Avatar2 name={call.name} size={46} />
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">
                  {call.name}
                </p>
                <p className="text-xs flex items-center gap-1 mt-0.5">
                  {call.type === "missed" ? (
                    <span className="text-red-500">↙ Missed</span>
                  ) : call.type === "incoming" ? (
                    <span style={{ color: "#25D366" }}>↙ Incoming</span>
                  ) : call.type === "video" ? (
                    <span className="text-blue-500">📹 Video</span>
                  ) : (
                    <span className="text-gray-500">↗ Outgoing</span>
                  )}
                  <span className="text-gray-400">
                    · {formatTime(call.timestamp)}
                  </span>
                  {call.duration && (
                    <span className="text-gray-400">· {call.duration}</span>
                  )}
                </p>
              </div>
              <div style={{ color: "#25D366" }}>
                <svg
                  aria-hidden="true"
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
              </div>
            </button>
          ))
        )}
      </div>
      <button
        type="button"
        onClick={() => toast.info("Contact ka naam bolo")}
        className="absolute bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: "#25D366" }}
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.67 9.5a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 3.66 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </button>
    </div>
  );
}

// ─── Chat List Screen ─────────────────────────────────────────────────────────

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
      <div
        style={{ background: "#128C7E" }}
        className="px-4 pt-10 pb-3 flex-shrink-0"
      >
        {showSearch ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="text-white p-1"
            >
              <svg
                aria-hidden="true"
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
              data-ocid="chatlist.search_input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Dhundhein..."
              className="flex-1 bg-white/20 text-white placeholder-white/60 rounded-full px-4 py-1.5 text-sm outline-none"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlipLogo size={32} />
              <h1 className="text-white text-xl font-bold">Flipchat</h1>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="text-white/90 p-1"
              >
                <svg
                  aria-hidden="true"
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
              <button type="button" className="text-white/90 p-1">
                <svg
                  aria-hidden="true"
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

      <div className="flex-1 overflow-y-auto bg-white" data-ocid="chats.list">
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-40 text-gray-400"
            data-ocid="chats.empty_state"
          >
            <p className="text-sm">Koi chat nahi mila</p>
          </div>
        ) : (
          filtered.map((chat, i) => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            const unread = chat.messages.filter(
              (m) => m.sender !== "me" && m.status !== "read",
            ).length;
            return (
              <button
                type="button"
                key={chat.id}
                data-ocid={`chats.item.${i + 1}`}
                onClick={() => onOpenChat(chat)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
              >
                <div className="relative">
                  <Avatar2 name={chat.name} image={chat.avatar} size={50} />
                  {chat.isGroup && (
                    <div
                      style={{ background: "#25D366" }}
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                    >
                      <svg
                        aria-hidden="true"
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
                  {!chat.isGroup && ["rahul", "priya"].includes(chat.id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-gray-900 text-sm">
                      {chat.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {lastMsg ? formatTime(lastMsg.timestamp) : ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className="text-xs text-gray-500 truncate pr-2">
                      {lastMsg?.sender === "me" && (
                        <span className="text-green-600">✓✓ </span>
                      )}
                      {lastMsg?.text ||
                        (lastMsg?.image
                          ? "📷 Photo"
                          : chat.isGroup
                            ? `${chat.members.length} members`
                            : "")}
                    </p>
                    {unread > 0 && (
                      <span
                        style={{ background: "#25D366" }}
                        className="text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-semibold flex-shrink-0"
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

      <button
        type="button"
        data-ocid="chats.open_modal_button"
        onClick={onNewChat}
        style={{ background: "#25D366" }}
        className="absolute bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-10"
      >
        <svg
          aria-hidden="true"
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

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("flipchat_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [chats, setChats] = useState<Chat[]>(() => loadChats());
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>("chats");
  const [showNewChat, setShowNewChat] = useState(false);
  const [activeCall, setActiveCall] = useState<CallState>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync chats from storage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = loadChats();
      setChats(fresh);
      if (activeChat) {
        const updated = fresh.find((c) => c.id === activeChat.id);
        if (updated) setActiveChat(updated);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [activeChat]);

  useEffect(() => {
    if (screen === "splash" && user) {
      const t = setTimeout(() => setScreen("main"), 2000);
      return () => clearTimeout(t);
    }
  }, [screen, user]);

  const handleSplashDone = useCallback(() => {
    setScreen(user ? "main" : "login");
  }, [user]);

  const handleLogin = useCallback((loggedUser: User) => {
    setUser(loggedUser);
    setScreen("main");
    toast.success(`Welcome, ${loggedUser.name}! 👋`);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("flipchat_user");
    localStorage.removeItem(CHATS_KEY);
    setUser(null);
    setChats(DEMO_CHATS.map((c) => ({ ...c })));
    setActiveChat(null);
    setScreen("login");
    toast.success("Logout ho gaye!");
  }, []);

  const handleUpdateChat = useCallback(
    (chatId: string, updater: (c: Chat) => Chat) => {
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.id === chatId);
        if (idx < 0) return prev;
        const updated = [...prev];
        updated[idx] = updater(updated[idx]);
        return updated;
      });
    },
    [],
  );

  const handleCreateChat = useCallback((chat: Chat) => {
    setChats((prev) => {
      const updated = [chat, ...prev];
      saveChats(updated);
      return updated;
    });
  }, []);

  const handleSaveProfile = useCallback((updated: User) => {
    setUser(updated);
    localStorage.setItem("flipchat_user", JSON.stringify(updated));
  }, []);

  const startCall = useCallback(
    (name: string, phone: string, type: "voice" | "video") => {
      toast.info(`${name} ko call ho raha hai... 📞`);
      setActiveCall({
        name,
        phone,
        status: "ringing",
        seconds: 0,
        muted: false,
        speaker: false,
        type,
      });
      setTimeout(() => {
        setActiveCall((prev) =>
          prev ? { ...prev, status: "connected" } : null,
        );
        callTimerRef.current = setInterval(() => {
          setActiveCall((prev) =>
            prev ? { ...prev, seconds: prev.seconds + 1 } : null,
          );
        }, 1000);
      }, 3000);
    },
    [],
  );

  const endCall = useCallback(() => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    const duration = activeCall?.seconds || 0;
    setActiveCall(null);
    if (duration > 0)
      toast.success(
        `Call khatam hua: ${String(Math.floor(duration / 60)).padStart(2, "0")}:${String(duration % 60).padStart(2, "0")}`,
      );
  }, [activeCall]);

  const toggleMute = useCallback(() => {
    setActiveCall((prev) => {
      if (!prev) return null;
      const next = { ...prev, muted: !prev.muted };
      toast.info(next.muted ? "Mic mute ho gayi 🔇" : "Mic unmute ho gayi 🎤");
      return next;
    });
  }, []);

  const toggleSpeaker = useCallback(() => {
    setActiveCall((prev) => {
      if (!prev) return null;
      const next = { ...prev, speaker: !prev.speaker };
      toast.info(next.speaker ? "Speaker on 🔊" : "Speaker off 🔈");
      return next;
    });
  }, []);

  // ── Screens ──────────────────────────────────────────────────────────────

  if (screen === "splash") {
    return (
      <div className="w-full h-screen max-w-md mx-auto relative overflow-hidden">
        <SplashScreen onDone={handleSplashDone} />
        <Toaster position="top-center" />
      </div>
    );
  }

  if (screen === "login") {
    return (
      <div className="w-full h-screen max-w-md mx-auto relative overflow-hidden">
        <LoginScreen onLogin={handleLogin} />
        <Toaster position="top-center" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full h-screen max-w-md mx-auto relative overflow-hidden">
        <LoginScreen onLogin={handleLogin} />
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen max-w-md mx-auto relative overflow-hidden flex flex-col bg-white">
      <Toaster position="top-center" richColors />

      {/* Active call overlay */}
      {activeCall && (
        <div className="absolute inset-0 z-50">
          <ActiveCallScreen
            call={activeCall}
            onEnd={endCall}
            onToggleMute={toggleMute}
            onToggleSpeaker={toggleSpeaker}
          />
        </div>
      )}

      {/* New chat modal */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreateChat={handleCreateChat}
        />
      )}

      {/* Chat window */}
      {activeChat ? (
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            chat={activeChat}
            user={user}
            onBack={() => setActiveChat(null)}
            onUpdateChat={handleUpdateChat}
            onStartCall={startCall}
          />
        </div>
      ) : (
        <>
          {/* Tab content */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === "chats" && (
              <ChatListScreen
                chats={chats}
                onOpenChat={(chat) => {
                  setActiveChat(chat);
                  // Mark as read
                  const all = loadChats();
                  const idx = all.findIndex((c) => c.id === chat.id);
                  if (idx >= 0) {
                    all[idx].messages = all[idx].messages.map((m) =>
                      m.sender !== "me" ? { ...m, status: "read" as const } : m,
                    );
                    saveChats(all);
                  }
                }}
                onNewChat={() => setShowNewChat(true)}
              />
            )}
            {activeTab === "status" && <StatusScreen user={user} />}
            {activeTab === "calls" && <CallsTab onStartCall={startCall} />}
            {activeTab === "profile" && (
              <ProfileScreen
                user={user}
                onSave={handleSaveProfile}
                onLogout={handleLogout}
              />
            )}
          </div>

          {/* Bottom Navigation */}
          <nav
            className="flex items-center justify-around border-t border-gray-200 bg-white pb-safe"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
              paddingTop: 8,
            }}
          >
            {(
              [
                {
                  id: "chats" as MainTab,
                  label: "Chats",
                  icon: (
                    <svg
                      aria-hidden="true"
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
                  id: "status" as MainTab,
                  label: "Status",
                  icon: (
                    <svg
                      aria-hidden="true"
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
                  id: "calls" as MainTab,
                  label: "Calls",
                  icon: (
                    <svg
                      aria-hidden="true"
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
                  id: "profile" as MainTab,
                  label: "Profile",
                  icon: (
                    <svg
                      aria-hidden="true"
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
              ] as const
            ).map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                data-ocid={`nav.${id}.tab`}
                onClick={() => setActiveTab(id)}
                className="flex flex-col items-center gap-0.5 px-4 py-1 transition-colors"
                style={{ color: activeTab === id ? "#25D366" : "#888" }}
              >
                {icon}
                <span className="text-[10px] font-semibold">{label}</span>
                {id === "chats" &&
                  chats.reduce(
                    (sum, c) =>
                      sum +
                      c.messages.filter(
                        (m) => m.sender !== "me" && m.status !== "read",
                      ).length,
                    0,
                  ) > 0 && (
                    <span
                      style={{ background: "#25D366" }}
                      className="absolute -top-1 w-2 h-2 rounded-full"
                    />
                  )}
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
