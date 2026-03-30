import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Camera,
  Check,
  Edit2,
  Eye,
  EyeOff,
  Key,
  LogOut,
  Save,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { getInitials } from "../../utils/chatStorage";

const SMS_API_KEY_STORAGE = "smsApiKey";

interface ProfileScreenProps {
  name: string;
  status: string;
  avatar?: string;
  memberSince: string;
  onBack: () => void;
  onLogout: () => void;
  onSave: (name: string, status: string, avatar?: string) => void;
}

export function ProfileScreen({
  name: initialName,
  status: initialStatus,
  avatar: initialAvatar,
  memberSince,
  onBack,
  onLogout,
  onSave,
}: ProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState(initialStatus);
  const [avatar, setAvatar] = useState(initialAvatar);
  const fileRef = useRef<HTMLInputElement>(null);

  // SMS API Key state
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(SMS_API_KEY_STORAGE) ?? "",
  );
  const [showKey, setShowKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    onSave(name, status, avatar);
    setEditing(false);
  }

  async function handleSaveApiKey() {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      toast.error("API key khali nahi ho sakti");
      return;
    }
    setIsSavingKey(true);
    try {
      localStorage.setItem(SMS_API_KEY_STORAGE, trimmed);
      toast.success("SMS API key save ho gayi! ✅");
    } catch {
      toast.error("Key save karne mein error aaya");
    } finally {
      setIsSavingKey(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-4 bg-card border-b border-border">
        <button
          type="button"
          data-ocid="profile.cancel_button"
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-foreground">Profile</h2>
        <button
          type="button"
          data-ocid="profile.edit_button"
          onClick={() => (editing ? handleSave() : setEditing(true))}
          className="w-9 h-9 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
        >
          {editing ? (
            <Check className="w-5 h-5" />
          ) : (
            <Edit2 className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-8 gap-4"
        >
          <div className="relative">
            <Avatar className="w-28 h-28">
              <AvatarImage src={avatar} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            {editing && (
              <button
                type="button"
                data-ocid="profile.upload_button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-glow"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {editing ? (
            <div className="w-full px-6 space-y-3">
              <Input
                id="profile-name"
                data-ocid="profile.input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-card border-border rounded-xl h-12 text-foreground text-center font-semibold"
              />
              <Input
                id="profile-status"
                data-ocid="profile.textarea"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-card border-border rounded-xl h-12 text-foreground text-center text-sm"
              />
            </div>
          ) : (
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground">{name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{status}</p>
            </div>
          )}
        </motion.div>

        <div className="mx-4 space-y-3">
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">Display Name</p>
            <p className="text-sm font-medium text-foreground">{name}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <p className="text-sm font-medium text-foreground">{status}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">Member Since</p>
            <p className="text-sm font-medium text-foreground">{memberSince}</p>
          </div>
        </div>

        {/* SMS API Key Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mx-4 mt-4"
        >
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                <Key className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  SMS API Key
                </p>
                <p className="text-xs text-muted-foreground">
                  Fast2SMS / RapidAPI key for OTP
                </p>
              </div>
            </div>

            <div className="relative">
              <Input
                data-ocid="profile.input"
                type={showKey ? "text" : "password"}
                placeholder="API key yahan daalo..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-muted border-border rounded-xl h-11 text-foreground pr-10 text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <Button
              data-ocid="profile.save_button"
              onClick={handleSaveApiKey}
              disabled={isSavingKey || !apiKey.trim()}
              size="sm"
              className="w-full h-10 rounded-xl text-sm font-semibold"
            >
              {isSavingKey ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  Save ho raha hai...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5" />
                  API Key Save Karo
                </span>
              )}
            </Button>

            {apiKey.trim() && (
              <p className="text-xs text-primary text-center font-medium">
                ✓ API key set hai — OTP SMS bhejna active hai
              </p>
            )}
            {!apiKey.trim() && (
              <p className="text-xs text-muted-foreground text-center">
                Bina API key ke OTP SMS nahi jaayega
              </p>
            )}
          </div>
        </motion.div>

        <div className="mx-4 mt-4 mb-8">
          <Button
            data-ocid="profile.delete_button"
            onClick={onLogout}
            variant="destructive"
            className="w-full h-12 rounded-2xl font-semibold"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
