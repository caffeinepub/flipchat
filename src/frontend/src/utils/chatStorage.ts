import type { Contact, Conversation, Group, Message } from "../types/chat";

const CONTACTS_KEY = "flipchat_contacts";
const MESSAGES_KEY = "flipchat_messages";
const CONVERSATIONS_KEY = "flipchat_conversations";
const GROUPS_KEY = "flipchat_groups";
const GROUP_MESSAGES_KEY = "flipchat_group_messages";

export const DEMO_CONTACTS: Contact[] = [
  { id: "alice", name: "Alice Johnson", isOnline: true, status: "Available" },
  {
    id: "bob",
    name: "Bob Smith",
    isOnline: false,
    lastSeen: "2 hours ago",
    status: "At the gym 💪",
  },
  {
    id: "carol",
    name: "Carol White",
    isOnline: true,
    status: "Working from home",
  },
  {
    id: "david",
    name: "David Lee",
    isOnline: false,
    lastSeen: "Yesterday",
    status: "Out of office",
  },
];

const DEMO_GROUPS: Group[] = [
  {
    id: "group-family",
    name: "Family Group",
    members: ["alice", "carol"],
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: "group-work",
    name: "Work Team",
    members: ["bob", "david", "alice"],
    createdAt: Date.now() - 86400000 * 3,
  },
];

const DEMO_MESSAGES: Record<string, Message[]> = {
  alice: [
    {
      id: "m1",
      conversationId: "alice",
      senderId: "alice",
      text: "Hey! How are you doing? 😊",
      timestamp: Date.now() - 3600000,
      status: "read",
    },
    {
      id: "m2",
      conversationId: "alice",
      senderId: "me",
      text: "I'm great, thanks for asking! Just got back from a trip.",
      timestamp: Date.now() - 3500000,
      status: "read",
    },
    {
      id: "m3",
      conversationId: "alice",
      senderId: "alice",
      text: "That sounds amazing! Where did you go?",
      timestamp: Date.now() - 3400000,
      status: "read",
    },
    {
      id: "m4",
      conversationId: "alice",
      senderId: "me",
      text: "Went to the mountains. The views were incredible! 🏔️",
      timestamp: Date.now() - 3300000,
      status: "read",
    },
    {
      id: "m5",
      conversationId: "alice",
      senderId: "alice",
      text: "I'm so jealous! We should plan a trip together sometime 🤩",
      timestamp: Date.now() - 600000,
      status: "read",
    },
  ],
  bob: [
    {
      id: "m6",
      conversationId: "bob",
      senderId: "bob",
      text: "Did you catch the game last night?",
      timestamp: Date.now() - 7200000,
      status: "read",
    },
    {
      id: "m7",
      conversationId: "bob",
      senderId: "me",
      text: "Yes! What a finish! 🏆",
      timestamp: Date.now() - 7100000,
      status: "delivered",
    },
  ],
  carol: [
    {
      id: "m8",
      conversationId: "carol",
      senderId: "me",
      text: "Can you send me the project files?",
      timestamp: Date.now() - 86400000,
      status: "read",
    },
    {
      id: "m9",
      conversationId: "carol",
      senderId: "carol",
      text: "Sure, I'll send them right away!",
      timestamp: Date.now() - 86000000,
      status: "read",
    },
    {
      id: "m10",
      conversationId: "carol",
      senderId: "carol",
      text: "Let me know if you need anything else 📁",
      timestamp: Date.now() - 85000000,
      status: "read",
    },
  ],
  david: [
    {
      id: "m11",
      conversationId: "david",
      senderId: "david",
      text: "Hey, are you free for a call tomorrow?",
      timestamp: Date.now() - 172800000,
      status: "read",
    },
  ],
};

const DEMO_GROUP_MESSAGES: Record<string, Message[]> = {
  "group-family": [
    {
      id: "gm1",
      conversationId: "group-family",
      senderId: "alice",
      senderName: "Alice Johnson",
      text: "Good morning everyone! ☀️",
      timestamp: Date.now() - 3600000 * 5,
      status: "read",
    },
    {
      id: "gm2",
      conversationId: "group-family",
      senderId: "carol",
      senderName: "Carol White",
      text: "Good morning! Hope you all have a great day 🌸",
      timestamp: Date.now() - 3600000 * 4,
      status: "read",
    },
    {
      id: "gm3",
      conversationId: "group-family",
      senderId: "me",
      text: "Morning! Let's plan dinner this weekend 🍕",
      timestamp: Date.now() - 3600000 * 2,
      status: "read",
    },
  ],
  "group-work": [
    {
      id: "gm4",
      conversationId: "group-work",
      senderId: "bob",
      senderName: "Bob Smith",
      text: "Team, the sprint review is at 3pm today 📅",
      timestamp: Date.now() - 3600000 * 3,
      status: "read",
    },
    {
      id: "gm5",
      conversationId: "group-work",
      senderId: "david",
      senderName: "David Lee",
      text: "Got it! I'll have my part ready 👍",
      timestamp: Date.now() - 3600000 * 2,
      status: "read",
    },
    {
      id: "gm6",
      conversationId: "group-work",
      senderId: "alice",
      senderName: "Alice Johnson",
      text: "See you all there! 🚀",
      timestamp: Date.now() - 3600000,
      status: "read",
    },
  ],
};

export function initializeChatData() {
  if (!localStorage.getItem(CONTACTS_KEY)) {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(DEMO_CONTACTS));
  }
  if (!localStorage.getItem(MESSAGES_KEY)) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(DEMO_MESSAGES));
  }
  if (!localStorage.getItem(GROUPS_KEY)) {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(DEMO_GROUPS));
  }
  if (!localStorage.getItem(GROUP_MESSAGES_KEY)) {
    localStorage.setItem(
      GROUP_MESSAGES_KEY,
      JSON.stringify(DEMO_GROUP_MESSAGES),
    );
  }
  if (!localStorage.getItem(CONVERSATIONS_KEY)) {
    const dmConvos: Conversation[] = DEMO_CONTACTS.map((c) => {
      const msgs = DEMO_MESSAGES[c.id] || [];
      return {
        id: c.id,
        contactId: c.id,
        isGroup: false,
        lastMessage: msgs[msgs.length - 1],
        unreadCount: msgs.filter(
          (m) => m.senderId !== "me" && m.status !== "read",
        ).length,
      };
    });
    const groupConvos: Conversation[] = DEMO_GROUPS.map((g) => {
      const msgs = DEMO_GROUP_MESSAGES[g.id] || [];
      return {
        id: g.id,
        groupId: g.id,
        isGroup: true,
        lastMessage: msgs[msgs.length - 1],
        unreadCount: 0,
      };
    });
    localStorage.setItem(
      CONVERSATIONS_KEY,
      JSON.stringify([...dmConvos, ...groupConvos]),
    );
  }
}

export function getContacts(): Contact[] {
  const raw = localStorage.getItem(CONTACTS_KEY);
  return raw ? JSON.parse(raw) : DEMO_CONTACTS;
}

export function getGroups(): Group[] {
  const raw = localStorage.getItem(GROUPS_KEY);
  return raw ? JSON.parse(raw) : DEMO_GROUPS;
}

export function createGroup(
  name: string,
  memberIds: string[],
  avatar?: string,
): Group {
  const group: Group = {
    id: `group-${Date.now()}`,
    name,
    avatar,
    members: memberIds,
    createdAt: Date.now(),
  };
  const groups = getGroups();
  groups.push(group);
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));

  // Create a conversation for it
  const conv: Conversation = {
    id: group.id,
    groupId: group.id,
    isGroup: true,
    unreadCount: 0,
  };
  const convos = getConversations();
  convos.unshift(conv);
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convos));

  return group;
}

export function getMessages(conversationId: string): Message[] {
  const raw = localStorage.getItem(MESSAGES_KEY);
  if (!raw) return [];
  const all: Record<string, Message[]> = JSON.parse(raw);
  return all[conversationId] || [];
}

export function getGroupMessages(groupId: string): Message[] {
  const raw = localStorage.getItem(GROUP_MESSAGES_KEY);
  if (!raw) return [];
  const all: Record<string, Message[]> = JSON.parse(raw);
  return all[groupId] || [];
}

export function saveGroupMessage(msg: Message) {
  const raw = localStorage.getItem(GROUP_MESSAGES_KEY);
  const all: Record<string, Message[]> = raw ? JSON.parse(raw) : {};
  if (!all[msg.conversationId]) all[msg.conversationId] = [];
  all[msg.conversationId].push(msg);
  localStorage.setItem(GROUP_MESSAGES_KEY, JSON.stringify(all));
  updateConversation(msg.conversationId, msg);
}

export function saveMessage(msg: Message) {
  const raw = localStorage.getItem(MESSAGES_KEY);
  const all: Record<string, Message[]> = raw ? JSON.parse(raw) : {};
  if (!all[msg.conversationId]) all[msg.conversationId] = [];
  all[msg.conversationId].push(msg);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
  updateConversation(msg.conversationId, msg);
}

export function updateConversation(
  conversationId: string,
  lastMessage: Message,
) {
  const raw = localStorage.getItem(CONVERSATIONS_KEY);
  const convos: Conversation[] = raw ? JSON.parse(raw) : [];
  const idx = convos.findIndex((c) => c.id === conversationId);
  if (idx >= 0) {
    convos[idx].lastMessage = lastMessage;
    if (lastMessage.senderId !== "me") convos[idx].unreadCount += 1;
  } else {
    convos.push({
      id: conversationId,
      contactId: conversationId,
      isGroup: false,
      lastMessage,
      unreadCount: lastMessage.senderId !== "me" ? 1 : 0,
    });
  }
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convos));
}

export function getConversations(): Conversation[] {
  const raw = localStorage.getItem(CONVERSATIONS_KEY);
  const convos: Conversation[] = raw ? JSON.parse(raw) : [];
  return convos.sort((a, b) => {
    const tA = a.lastMessage?.timestamp ?? 0;
    const tB = b.lastMessage?.timestamp ?? 0;
    return tB - tA;
  });
}

export function clearUnread(conversationId: string) {
  const raw = localStorage.getItem(CONVERSATIONS_KEY);
  const convos: Conversation[] = raw ? JSON.parse(raw) : [];
  const idx = convos.findIndex((c) => c.id === conversationId);
  if (idx >= 0) {
    convos[idx].unreadCount = 0;
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convos));
  }
}

export function markMessagesRead(conversationId: string) {
  const raw = localStorage.getItem(MESSAGES_KEY);
  if (!raw) return;
  const all: Record<string, Message[]> = JSON.parse(raw);
  if (all[conversationId]) {
    all[conversationId] = all[conversationId].map((m) =>
      m.senderId !== "me" ? { ...m, status: "read" as const } : m,
    );
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
  }
}

export function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const date = new Date(ts);
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000)
    return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ---- Call Log ----
import type { CallRecord } from "../types/chat";

const CALLS_KEY = "flipchat_calls";

export function saveCallRecord(record: CallRecord): void {
  const raw = localStorage.getItem(CALLS_KEY);
  const calls: CallRecord[] = raw ? JSON.parse(raw) : [];
  calls.unshift(record);
  localStorage.setItem(CALLS_KEY, JSON.stringify(calls.slice(0, 100)));
}

export function getCallLog(): CallRecord[] {
  const raw = localStorage.getItem(CALLS_KEY);
  const calls: CallRecord[] = raw ? JSON.parse(raw) : [];
  return calls.sort((a, b) => b.timestamp - a.timestamp);
}
