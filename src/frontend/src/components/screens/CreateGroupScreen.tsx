import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera, Check, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import type { Contact } from "../../types/chat";
import { getContacts, getInitials } from "../../utils/chatStorage";

const AVATAR_COLORS = [
  "bg-purple-600",
  "bg-blue-600",
  "bg-green-600",
  "bg-orange-500",
  "bg-pink-600",
];
function avatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
}

interface CreateGroupScreenProps {
  onBack: () => void;
  onCreateGroup: (name: string, memberIds: string[], avatar?: string) => void;
}

export function CreateGroupScreen({
  onBack,
  onCreateGroup,
}: CreateGroupScreenProps) {
  const [step, setStep] = useState<"select" | "name">("select");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [groupAvatar, setGroupAvatar] = useState<string | undefined>();
  const contacts: Contact[] = getContacts();
  const avatarRef = useRef<HTMLInputElement>(null);

  function toggleContact(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setGroupAvatar(url);
  }

  function handleCreate() {
    if (!groupName.trim() || selected.size === 0) return;
    onCreateGroup(groupName.trim(), Array.from(selected), groupAvatar);
  }

  const selectedContacts = contacts.filter((c) => selected.has(c.id));

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-4 bg-card border-b border-border">
        <button
          type="button"
          data-ocid="creategroup.cancel_button"
          onClick={step === "name" ? () => setStep("select") : onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-foreground">New Group</h2>
          <p className="text-xs text-muted-foreground">
            {step === "select"
              ? `${selected.size} of ${contacts.length} selected`
              : "Group details"}
          </p>
        </div>
        {step === "select" && selected.size > 0 && (
          <Button
            data-ocid="creategroup.primary_button"
            size="sm"
            onClick={() => setStep("name")}
            className="bg-primary text-white hover:bg-primary/90 rounded-full px-4"
          >
            Next
          </Button>
        )}
      </div>

      {/* Selected chips */}
      <AnimatePresence>
        {step === "select" && selected.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide bg-card border-b border-border">
              {selectedContacts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleContact(c.id)}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={c.avatar} />
                      <AvatarFallback
                        className={`${avatarColor(c.id)} text-white text-xs font-semibold`}
                      >
                        {getInitials(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      ×
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground max-w-[44px] truncate">
                    {c.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === "select" ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto scrollbar-hide"
          >
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Contacts
            </p>
            {contacts.map((contact, idx) => (
              <motion.button
                key={contact.id}
                type="button"
                data-ocid={`creategroup.item.${idx + 1}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => toggleContact(contact.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-card transition-colors border-b border-border/40 active:bg-accent"
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
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground text-sm">
                    {contact.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {contact.status || "Hey there!"}
                  </p>
                </div>
                {/* Checkbox */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selected.has(contact.id)
                      ? "bg-primary border-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {selected.has(contact.id) && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-y-auto scrollbar-hide"
          >
            {/* Group avatar picker */}
            <div className="flex flex-col items-center py-8 gap-4">
              <button
                type="button"
                data-ocid="creategroup.upload_button"
                onClick={() => avatarRef.current?.click()}
                className="relative w-24 h-24 rounded-full overflow-hidden"
              >
                {groupAvatar ? (
                  <img
                    src={groupAvatar}
                    alt="Group avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Users className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="text-xs text-muted-foreground">Add group icon</p>
            </div>

            {/* Group name input */}
            <div className="px-6 pb-4">
              <Input
                data-ocid="creategroup.input"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
                autoFocus
                className="bg-background border-0 border-b-2 border-primary rounded-none h-12 text-foreground text-base placeholder:text-muted-foreground focus-visible:ring-0 px-0"
              />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {groupName.length}/50
              </p>
            </div>

            {/* Members preview */}
            <div className="px-6 pb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Members ({selected.size})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedContacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 bg-card rounded-full px-3 py-1.5"
                  >
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={c.avatar} />
                      <AvatarFallback
                        className={`${avatarColor(c.id)} text-white text-[8px] font-semibold`}
                      >
                        {getInitials(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-foreground font-medium">
                      {c.name.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto px-6 pb-8">
              <Button
                data-ocid="creategroup.submit_button"
                onClick={handleCreate}
                disabled={!groupName.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-12 text-base font-semibold"
              >
                Create Group
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
