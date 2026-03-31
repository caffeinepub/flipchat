import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CallScreen } from "./components/screens/CallScreen";
import { ChatListScreen } from "./components/screens/ChatListScreen";
import { ChatWindowScreen } from "./components/screens/ChatWindowScreen";
import { CreateGroupScreen } from "./components/screens/CreateGroupScreen";
import { LoginScreen } from "./components/screens/LoginScreen";
import { NewChatScreen } from "./components/screens/NewChatScreen";
import { ProfileScreen } from "./components/screens/ProfileScreen";
import { SetupScreen } from "./components/screens/SetupScreen";
import type { Contact, Group } from "./types/chat";
import {
  createGroup,
  getContacts,
  initializeChatData,
  saveCallRecord,
} from "./utils/chatStorage";

const LOGO_SRC =
  "/assets/uploads/file_0000000002bc71fa916666f6929ea802-019d3ae7-437e-7238-9d98-d280ebef58c4-1.png";

type Screen =
  | "loading"
  | "login"
  | "setup"
  | "chatlist"
  | "newchat"
  | "creategroup"
  | "chat"
  | "profile";

type CallState = "none" | "incoming" | "outgoing" | "active";

interface LocalProfile {
  name: string;
  phone?: string;
  status: string;
  avatar?: string;
  memberSince: string;
}

const LOCAL_PROFILE_KEY = "flipchat_my_profile";
const SESSION_KEY = "flipchat_session";

function getLocalProfile(): LocalProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalProfile(p: LocalProfile) {
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(p));
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [localProfile, setLocalProfile] = useState<LocalProfile | null>(null);
  const [logoError, setLogoError] = useState(false);

  // Call state
  const [callState, setCallState] = useState<CallState>("none");
  const [callContact, setCallContact] = useState<Contact | null>(null);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const callTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const incomingCallFiredRef = useRef(false);

  // On mount: check if user is already logged in
  useEffect(() => {
    initializeChatData();

    const timer = setTimeout(() => {
      const session = localStorage.getItem(SESSION_KEY);
      const lp = getLocalProfile();

      if (session && lp) {
        setLocalProfile(lp);
        setScreen("chatlist");
      } else {
        localStorage.removeItem(SESSION_KEY);
        setScreen("login");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Simulate random incoming call after login
  useEffect(() => {
    if (screen === "chatlist" && !incomingCallFiredRef.current) {
      incomingCallFiredRef.current = true;
      const delay = 20000 + Math.random() * 20000;
      callTimerRef.current = setTimeout(() => {
        const contacts = getContacts().filter((c) => c.isOnline);
        if (contacts.length === 0) return;
        const contact = contacts[Math.floor(Math.random() * contacts.length)];
        const type: "voice" | "video" = Math.random() > 0.5 ? "voice" : "video";
        setCallContact(contact);
        setCallType(type);
        setCallState("incoming");
      }, delay);
    }
    return () => {
      if (callTimerRef.current) clearTimeout(callTimerRef.current);
    };
  }, [screen]);

  function handleNameLogin(loginData: string) {
    // Parse format: "name:Rahul|phone:9876543210"
    let userName = loginData.trim();
    let phoneNumber = "";

    if (loginData.includes("|")) {
      const parts = loginData.split("|");
      const namePart = parts.find((p) => p.startsWith("name:"));
      const phonePart = parts.find((p) => p.startsWith("phone:"));
      userName = namePart ? namePart.slice(5).trim() : "";
      phoneNumber = phonePart ? phonePart.slice(6).trim() : "";
    } else if (loginData.startsWith("name:")) {
      userName = loginData.slice(5).trim();
    }

    if (!userName) return;

    const lp: LocalProfile = {
      name: userName,
      phone: phoneNumber || undefined,
      status: "Hey there! I am using Flipchat 👋",
      memberSince: new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
    saveLocalProfile(lp);
    setLocalProfile(lp);
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ loginTime: Date.now() }),
    );
    setScreen("chatlist");
  }

  function startCall(contact: Contact, type: "voice" | "video") {
    setCallContact(contact);
    setCallType(type);
    setCallState("outgoing");
    const delay = 3000 + Math.random() * 2000;
    callTimerRef.current = setTimeout(() => {
      if (Math.random() > 0.3) {
        setCallState("active");
      } else {
        saveCallRecord({
          id: `call-${Date.now()}`,
          contactId: contact.id,
          contactName: contact.name,
          type,
          direction: "missed",
          timestamp: Date.now(),
        });
        setCallState("none");
        setCallContact(null);
        toast(`${contact.name} didn't answer`);
      }
    }, delay);
  }

  function acceptCall() {
    setCallState("active");
  }

  function declineCall() {
    if (callContact) {
      saveCallRecord({
        id: `call-${Date.now()}`,
        contactId: callContact.id,
        contactName: callContact.name,
        type: callType,
        direction: "missed",
        timestamp: Date.now(),
      });
    }
    setCallState("none");
    setCallContact(null);
  }

  function endCall(duration: number) {
    if (callTimerRef.current) clearTimeout(callTimerRef.current);
    if (callContact) {
      saveCallRecord({
        id: `call-${Date.now()}`,
        contactId: callContact.id,
        contactName: callContact.name,
        type: callType,
        direction: callState === "incoming" ? "incoming" : "outgoing",
        duration: duration > 0 ? duration : undefined,
        timestamp: Date.now(),
      });
    }
    setCallState("none");
    setCallContact(null);
  }

  function handleSetupComplete(
    name: string,
    status: string,
    avatarUrl?: string,
  ) {
    const lp: LocalProfile = {
      name,
      status,
      avatar: avatarUrl,
      memberSince: new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
    saveLocalProfile(lp);
    setLocalProfile(lp);
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ loginTime: Date.now() }),
    );
    setScreen("chatlist");
  }

  function handleProfileSave(name: string, status: string, avatar?: string) {
    const lp: LocalProfile = {
      name,
      phone: localProfile?.phone,
      status,
      avatar,
      memberSince:
        localProfile?.memberSince ??
        new Date().toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
    };
    saveLocalProfile(lp);
    setLocalProfile(lp);
    toast.success("Profile update ho gaya!");
  }

  function handleLogout() {
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    localStorage.removeItem(SESSION_KEY);
    setLocalProfile(null);
    incomingCallFiredRef.current = false;
    setScreen("login");
  }

  function handleOpenChat(item: { contact?: Contact; group?: Group }) {
    if (item.group) {
      setActiveGroup(item.group);
      setActiveContact(null);
    } else if (item.contact) {
      setActiveContact(item.contact);
      setActiveGroup(null);
    }
    setScreen("chat");
  }

  function handleCreateGroup(
    name: string,
    memberIds: string[],
    avatar?: string,
  ) {
    const group = createGroup(name, memberIds, avatar);
    setActiveGroup(group);
    setActiveContact(null);
    setScreen("chat");
    toast.success(`"${name}" group ban gaya!`);
  }

  const variants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[oklch(0.07_0.01_263)] p-0 sm:p-4">
      <div className="relative w-full max-w-[430px] h-screen sm:h-[844px] sm:rounded-[40px] overflow-hidden bg-background sm:shadow-2xl">
        <AnimatePresence mode="wait">
          {screen === "loading" && (
            <motion.div
              key="loading"
              className="absolute inset-0 flex flex-col items-center justify-center bg-background gap-4"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center overflow-hidden">
                {logoError ? (
                  <span className="text-4xl font-black text-primary">F</span>
                ) : (
                  <img
                    src={LOGO_SRC}
                    alt="Flipchat"
                    className="w-full h-full object-cover rounded-3xl"
                    onError={() => setLogoError(true)}
                  />
                )}
              </div>
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
          {screen === "login" && (
            <motion.div
              key="login"
              className="absolute inset-0"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <LoginScreen
                onLogin={() => {}}
                isLoggingIn={false}
                onPhoneLogin={handleNameLogin}
              />
            </motion.div>
          )}
          {screen === "setup" && (
            <motion.div
              key="setup"
              className="absolute inset-0"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <SetupScreen onComplete={handleSetupComplete} isSaving={false} />
            </motion.div>
          )}
          {screen === "chatlist" && (
            <motion.div
              key="chatlist"
              className="absolute inset-0"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <ChatListScreen
                onOpenChat={handleOpenChat}
                onNewChat={() => setScreen("newchat")}
                onProfile={() => setScreen("profile")}
              />
            </motion.div>
          )}
          {screen === "newchat" && (
            <motion.div
              key="newchat"
              className="absolute inset-0"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <NewChatScreen
                onBack={() => setScreen("chatlist")}
                onSelectContact={(contact) => {
                  setActiveContact(contact);
                  setActiveGroup(null);
                  setScreen("chat");
                }}
                onNewGroup={() => setScreen("creategroup")}
              />
            </motion.div>
          )}
          {screen === "creategroup" && (
            <motion.div
              key="creategroup"
              className="absolute inset-0"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <CreateGroupScreen
                onBack={() => setScreen("newchat")}
                onCreateGroup={handleCreateGroup}
              />
            </motion.div>
          )}
          {screen === "chat" && (activeContact || activeGroup) && (
            <motion.div
              key={`chat-${activeContact?.id ?? activeGroup?.id}`}
              className="absolute inset-0"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <ChatWindowScreen
                contact={activeContact ?? undefined}
                group={activeGroup ?? undefined}
                onBack={() => setScreen("chatlist")}
                onStartCall={startCall}
              />
            </motion.div>
          )}
          {screen === "profile" && (
            <motion.div
              key="profile"
              className="absolute inset-0"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <ProfileScreen
                name={localProfile?.name || ""}
                phone={localProfile?.phone}
                status={localProfile?.status || ""}
                avatar={localProfile?.avatar}
                memberSince={
                  localProfile?.memberSince ??
                  new Date().toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                }
                onBack={() => setScreen("chatlist")}
                onLogout={handleLogout}
                onSave={handleProfileSave}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Call Overlay */}
        <AnimatePresence>
          {callState !== "none" && callContact && (
            <CallScreen
              contact={callContact}
              callState={callState}
              callType={callType}
              onAccept={acceptCall}
              onDecline={declineCall}
              onEnd={endCall}
            />
          )}
        </AnimatePresence>
      </div>
      <Toaster />
    </div>
  );
}
