import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
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

interface NewChatScreenProps {
  onBack: () => void;
  onSelectContact: (contact: Contact) => void;
  onNewGroup: () => void;
}

export function NewChatScreen({
  onBack,
  onSelectContact,
  onNewGroup,
}: NewChatScreenProps) {
  const [search, setSearch] = useState("");
  const contacts = getContacts();
  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-4 bg-card border-b border-border">
        <button
          type="button"
          data-ocid="newchat.cancel_button"
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-foreground">New Chat</h2>
          <p className="text-xs text-muted-foreground">
            {contacts.length} contacts
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-card border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="newchat.search_input"
            placeholder="Search contacts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-background border-border rounded-full pl-9 h-10 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* New Group button */}
      <motion.button
        type="button"
        data-ocid="newchat.primary_button"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onNewGroup}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-card transition-colors border-b border-border/40 active:bg-accent"
      >
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-foreground text-sm">New Group</p>
          <p className="text-xs text-muted-foreground">Create a group chat</p>
        </div>
      </motion.button>

      {/* Contacts */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {filtered.map((contact, idx) => (
          <motion.button
            key={contact.id}
            type="button"
            data-ocid={`newchat.item.${idx + 1}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onSelectContact(contact)}
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
            <div className="text-left">
              <p className="font-semibold text-foreground text-sm">
                {contact.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {contact.isOnline ? (
                  <span className="text-online">● online</span>
                ) : (
                  `last seen ${contact.lastSeen || "recently"}`
                )}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
