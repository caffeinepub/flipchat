import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Globe,
  MessageCircle,
  Phone,
  Shield,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useActor } from "../../hooks/useActor";

const LOGO_SRC =
  "/assets/uploads/file_0000000002bc71fa916666f6929ea802-019d3ae7-437e-7238-9d98-d280ebef58c4-1.png";

interface LoginScreenProps {
  onLogin: () => void;
  isLoggingIn: boolean;
  onPhoneLogin: (phone: string) => void;
}

type Step = "form" | "otp";

const OTP_INDICES = [0, 1, 2, 3, 4, 5] as const;
type OtpIndex = (typeof OTP_INDICES)[number];

const OTP_INPUT_CLASS =
  "w-11 h-14 text-center text-xl font-bold rounded-2xl bg-muted border border-border text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

export function LoginScreen({ onPhoneLogin }: LoginScreenProps) {
  const { actor } = useActor();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [logoError, setLogoError] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startResendTimer() {
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  async function sendOtp() {
    const trimmedName = name.trim();
    const cleaned = phone.replace(/\D/g, "").slice(-10);
    if (trimmedName.length < 2) {
      setError("Naam kam se kam 2 letters ka hona chahiye ❌");
      return;
    }
    if (cleaned.length < 10) {
      setError("Sahi 10 digit number daalo ❌");
      return;
    }
    setIsSending(true);
    setError("");
    try {
      const result = await actor?.sendOtp(cleaned);
      if (!result || !result.ok) {
        setError(
          result?.message || "OTP bhejne mein dikkat hui, dobara try karo ❌",
        );
        setIsSending(false);
        return;
      }
      setOtp(["", "", "", "", "", ""]);
      setStep("otp");
      startResendTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("OTP bhejne mein error aaya, dobara try karo ❌");
    } finally {
      setIsSending(false);
    }
  }

  function handleOtpChange(index: OtpIndex, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: OtpIndex, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function verifyOtp() {
    const entered = otp.join("");
    if (entered.length < 6) {
      setError("6 digit OTP daalo ❌");
      return;
    }
    const cleaned = phone.replace(/\D/g, "").slice(-10);
    try {
      const result = await actor?.verifyOtp(cleaned, entered);
      if (!result || !result.ok) {
        setError(result?.message || "Galat OTP hai, dobara try karo ❌");
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
        return;
      }
      setError("");
      onPhoneLogin(`name:${name.trim()}|phone:${cleaned}`);
    } catch {
      setError("Verify karne mein error aaya ❌");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }

  const variants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  const formReady =
    name.trim().length >= 2 && phone.replace(/\D/g, "").length >= 10;

  return (
    <div className="flex flex-col items-center justify-between h-full px-6 py-12 bg-background">
      {/* Logo */}
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center glow-primary overflow-hidden">
            {logoError ? (
              <span className="text-5xl font-black text-primary">F</span>
            ) : (
              <img
                src={LOGO_SRC}
                alt="Flipchat"
                className="w-full h-full object-cover rounded-3xl"
                onError={() => setLogoError(true)}
              />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-online flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Flipchat
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Fast. Private. Seamless.
          </p>
        </div>
      </motion.div>

      {/* Middle section */}
      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div
            key="features"
            className="w-full space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {[
              {
                icon: MessageCircle,
                title: "Real-time messaging",
                desc: "Instant delivery with blue ticks",
              },
              {
                icon: Shield,
                title: "Secure & private",
                desc: "End-to-end encrypted conversations",
              },
              {
                icon: Globe,
                title: "Always connected",
                desc: "Online status & typing indicators",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-center gap-4 p-3 rounded-2xl bg-card border border-border"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {title}
                  </p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {step === "otp" && (
          <motion.div
            key="otp-info"
            className="w-full flex flex-col items-center gap-3"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Phone className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">
                OTP bheja gaya, {name.trim()}!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                +91 {phone} par 6 digit code gaya hai
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom form */}
      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div
            key="main-form"
            className="w-full space-y-3"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <p className="text-sm font-semibold text-muted-foreground text-center">
              Apna naam aur number daalo
            </p>

            {/* Name input */}
            <Input
              data-ocid="login.input"
              type="text"
              placeholder="Aapka naam..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && sendOtp()}
              className="h-14 rounded-2xl bg-muted border-border text-foreground placeholder:text-muted-foreground text-base"
              autoFocus
            />

            {/* Phone input */}
            <div className="flex gap-2">
              <div className="flex items-center justify-center h-14 px-3 rounded-2xl bg-muted border border-border text-foreground font-semibold text-sm flex-shrink-0">
                +91
              </div>
              <Input
                data-ocid="login.phone"
                type="tel"
                placeholder="10 digit number..."
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                className="h-14 rounded-2xl bg-muted border-border text-foreground placeholder:text-muted-foreground text-base"
                maxLength={10}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center font-medium">
                {error}
              </p>
            )}

            <Button
              data-ocid="login.primary_button"
              onClick={sendOtp}
              disabled={!formReady || isSending}
              className="w-full h-14 rounded-2xl text-base font-semibold transition-all duration-200"
              style={{
                background:
                  formReady && !isSending ? "oklch(var(--primary))" : undefined,
                opacity: formReady && !isSending ? 1 : 0.45,
                boxShadow:
                  formReady && !isSending
                    ? "0 0 20px oklch(var(--primary) / 0.4)"
                    : "none",
              }}
            >
              {isSending ? "Bhej raha hai..." : "OTP Bhejo →"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service
            </p>
          </motion.div>
        )}

        {step === "otp" && (
          <motion.div
            key="otp-form"
            className="w-full space-y-4"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground text-center">
                6 digit OTP daalo
              </p>
              <div className="flex gap-2 justify-center">
                {OTP_INDICES.map((i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i]}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={OTP_INPUT_CLASS}
                  />
                ))}
              </div>
              {error && (
                <p
                  data-ocid="login.error_state"
                  className="text-sm text-destructive text-center font-medium"
                >
                  {error}
                </p>
              )}
            </div>
            <Button
              data-ocid="login.submit_button"
              onClick={verifyOtp}
              disabled={otp.join("").length < 6}
              className="w-full h-14 rounded-2xl text-base font-semibold"
              style={{
                background:
                  otp.join("").length === 6
                    ? "oklch(var(--primary))"
                    : undefined,
                opacity: otp.join("").length === 6 ? 1 : 0.45,
                boxShadow:
                  otp.join("").length === 6
                    ? "0 0 20px oklch(var(--primary) / 0.4)"
                    : "none",
              }}
            >
              Verify Karo ✓
            </Button>
            <div className="flex items-center justify-between">
              <button
                type="button"
                data-ocid="login.cancel_button"
                onClick={() => {
                  setStep("form");
                  setError("");
                }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Wapas jao
              </button>
              <button
                type="button"
                onClick={resendTimer === 0 ? sendOtp : undefined}
                disabled={resendTimer > 0 || isSending}
                className="text-sm text-primary disabled:text-muted-foreground transition-colors"
              >
                {isSending
                  ? "Bhej raha hai..."
                  : resendTimer > 0
                    ? `Resend (${resendTimer}s)`
                    : "OTP dobara bhejo"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
