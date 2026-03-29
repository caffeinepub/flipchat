import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, MessageCircle, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface LoginScreenProps {
  onLogin: () => void;
  isLoggingIn: boolean;
  onPhoneLogin: (phone: string) => void;
}

export function LoginScreen({ onPhoneLogin }: LoginScreenProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleStart() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Apna naam daalo ❌");
      return;
    }
    if (trimmed.length < 2) {
      setError("Naam kam se kam 2 letters ka hona chahiye ❌");
      return;
    }
    onPhoneLogin(`name:${trimmed}`);
  }

  const canSubmit = name.trim().length >= 2;

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
            <img
              src="/assets/generated/flipchat-logo-transparent.png"
              alt="Flipchat"
              className="w-full h-full object-cover rounded-3xl"
            />
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

      {/* Features */}
      <motion.div
        className="w-full space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
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
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Name input + CTA */}
      <motion.div
        className="w-full space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground text-center">
            Apna naam daalo aur shuru karo
          </p>
          <Input
            data-ocid="login.input"
            type="text"
            placeholder="Aapka naam..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            className="h-14 rounded-2xl bg-muted border-border text-foreground placeholder:text-muted-foreground text-base text-center"
            autoFocus
          />
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
          data-ocid="login.primary_button"
          onClick={handleStart}
          disabled={!canSubmit}
          className="w-full h-14 rounded-2xl text-base font-semibold transition-all duration-200"
          style={{
            background: canSubmit ? "oklch(var(--primary))" : undefined,
            opacity: canSubmit ? 1 : 0.45,
            boxShadow: canSubmit
              ? "0 0 20px oklch(var(--primary) / 0.4)"
              : "none",
          }}
        >
          Flipchat Shuru Karo →
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  );
}
