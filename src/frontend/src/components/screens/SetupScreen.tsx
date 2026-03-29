import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { getInitials } from "../../utils/chatStorage";

interface SetupScreenProps {
  onComplete: (name: string, status: string, avatarUrl?: string) => void;
  isSaving: boolean;
}

export function SetupScreen({ onComplete, isSaving }: SetupScreenProps) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Hey there! I am using Flipchat 👋");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!name.trim()) return;
    onComplete(name.trim(), status.trim(), avatarPreview || undefined);
    void avatarFile;
  }

  return (
    <div className="flex flex-col h-full px-6 py-12 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-8 flex-1"
      >
        <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto">
          <img
            src="/assets/generated/flipchat-logo-transparent.png"
            alt="Flipchat"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Set up your profile
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Tell us a bit about yourself
          </p>
        </div>

        {/* Avatar */}
        <button
          type="button"
          data-ocid="setup.upload_button"
          onClick={() => fileRef.current?.click()}
          className="relative w-28 h-28 rounded-full bg-card border-2 border-primary/40 flex items-center justify-center overflow-hidden hover:border-primary transition-colors"
        >
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-primary">
              {name ? getInitials(name) : "?"}
            </span>
          )}
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="w-full space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="setup-name"
              className="text-sm font-medium text-foreground"
            >
              Display Name
            </label>
            <Input
              id="setup-name"
              data-ocid="setup.input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-card border-border rounded-xl h-12 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="setup-status"
              className="text-sm font-medium text-foreground"
            >
              Status
            </label>
            <Input
              id="setup-status"
              data-ocid="setup.textarea"
              placeholder="Your status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-card border-border rounded-xl h-12 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </motion.div>

      <Button
        data-ocid="setup.submit_button"
        onClick={handleSubmit}
        disabled={!name.trim() || isSaving}
        className="w-full h-14 rounded-2xl text-base font-semibold bg-primary hover:bg-primary/90 shadow-glow mt-6"
      >
        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
      </Button>
    </div>
  );
}
