import {
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Contact } from "../../types/chat";
import { getInitials } from "../../utils/chatStorage";

const AVATAR_COLORS = [
  "from-purple-600 to-purple-800",
  "from-blue-600 to-blue-800",
  "from-green-600 to-green-800",
  "from-orange-500 to-orange-700",
  "from-pink-600 to-pink-800",
];
function avatarGradient(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
}

interface CallScreenProps {
  contact: Contact;
  callState: "incoming" | "outgoing" | "active";
  callType: "voice" | "video";
  onAccept: () => void;
  onDecline: () => void;
  onEnd: (duration: number) => void;
}

export function CallScreen({
  contact,
  callState,
  callType,
  onAccept,
  onDecline,
  onEnd,
}: CallScreenProps) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [videoOff, setVideoOff] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    if (callState === "active") {
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function handleEnd() {
    onEnd(seconds);
  }

  return (
    <motion.div
      key="call-screen"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-between bg-black/95 backdrop-blur-xl"
      data-ocid="call.modal"
    >
      {/* Ripple rings */}
      {callState !== "active" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-green-400/20"
              initial={{ width: 120, height: 120, opacity: 0.6 }}
              animate={{ width: 300, height: 300, opacity: 0 }}
              transition={{
                duration: 2,
                delay: i * 0.65,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Top info */}
      <div className="flex flex-col items-center pt-20 gap-4 z-10">
        <p className="text-white/50 text-sm tracking-widest uppercase">
          {callType === "video" ? "Video Call" : "Voice Call"}
        </p>
        <h2 className="text-white text-3xl font-semibold tracking-tight">
          {contact.name}
        </h2>
        <AnimatePresence mode="wait">
          {callState === "outgoing" && (
            <motion.p
              key="outgoing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/60 text-sm flex items-center gap-1"
            >
              Calling
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.3,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                >
                  .
                </motion.span>
              ))}
            </motion.p>
          )}
          {callState === "incoming" && (
            <motion.p
              key="incoming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/60 text-sm"
            >
              Incoming {callType === "video" ? "video" : "voice"} call
            </motion.p>
          )}
          {callState === "active" && (
            <motion.p
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[#25D366] text-base font-mono"
            >
              {formatTime(seconds)}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Avatar */}
      <div className="relative flex items-center justify-center z-10">
        <div
          className={`w-28 h-28 rounded-full bg-gradient-to-br ${avatarGradient(contact.id)} flex items-center justify-center shadow-2xl`}
        >
          {contact.avatar ? (
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-3xl font-bold">
              {getInitials(contact.name)}
            </span>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="pb-16 z-10 w-full px-8">
        {callState === "incoming" && (
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                data-ocid="call.cancel_button"
                onClick={onDecline}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
              <span className="text-white/50 text-xs">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                data-ocid="call.confirm_button"
                onClick={onAccept}
                className="w-16 h-16 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <Phone className="w-7 h-7 text-white" />
              </button>
              <span className="text-white/50 text-xs">Accept</span>
            </div>
          </div>
        )}

        {callState === "outgoing" && (
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                data-ocid="call.cancel_button"
                onClick={() => onEnd(0)}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
              <span className="text-white/50 text-xs">Cancel</span>
            </div>
          </div>
        )}

        {callState === "active" && (
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                data-ocid="call.toggle"
                onClick={() => setMuted((p) => !p)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  muted ? "bg-white/20" : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <MicOff
                  className={`w-6 h-6 ${muted ? "text-white" : "text-white/60"}`}
                />
              </button>
              <span className="text-white/40 text-xs">
                {muted ? "Unmute" : "Mute"}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                data-ocid="call.delete_button"
                onClick={handleEnd}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
              <span className="text-white/50 text-xs">End</span>
            </div>
            {callType === "video" ? (
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  data-ocid="call.secondary_button"
                  onClick={() => setVideoOff((p) => !p)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    videoOff ? "bg-white/20" : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {videoOff ? (
                    <VideoOff className="w-6 h-6 text-white" />
                  ) : (
                    <Video className="w-6 h-6 text-white/60" />
                  )}
                </button>
                <span className="text-white/40 text-xs">Video</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  data-ocid="call.primary_button"
                  onClick={() => setSpeakerOn((p) => !p)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    speakerOn ? "bg-white/20" : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <Volume2
                    className={`w-6 h-6 ${speakerOn ? "text-white" : "text-white/60"}`}
                  />
                </button>
                <span className="text-white/40 text-xs">Speaker</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
