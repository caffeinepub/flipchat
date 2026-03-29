export interface Contact {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  status?: string;
}

export type MessageStatus = "sent" | "delivered" | "read";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  timestamp: number;
  status: MessageStatus;
}

export interface Group {
  id: string;
  name: string;
  avatar?: string;
  members: string[];
  createdAt: number;
}

export interface Conversation {
  id: string;
  contactId?: string;
  groupId?: string;
  isGroup: boolean;
  lastMessage?: Message;
  unreadCount: number;
}

export interface CallRecord {
  id: string;
  contactId: string;
  contactName: string;
  type: "voice" | "video";
  direction: "incoming" | "outgoing" | "missed";
  duration?: number;
  timestamp: number;
}
