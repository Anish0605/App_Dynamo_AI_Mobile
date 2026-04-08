import AsyncStorage from "@react-native-async-storage/async-storage";

export type StoredConversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
};

export type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

const CONVERSATIONS_KEY = (userId: string) => `dynamo_convs_${userId}`;
const MESSAGES_KEY = (chatId: string) => `dynamo_msgs_${chatId}`;

export const ConvStorage = {
  async getConversations(userId: string): Promise<StoredConversation[]> {
    try {
      const raw = await AsyncStorage.getItem(CONVERSATIONS_KEY(userId));
      if (!raw) return [];
      const items = JSON.parse(raw) as StoredConversation[];
      return items.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  },

  async createConversation(userId: string, title: string): Promise<StoredConversation> {
    const conv: StoredConversation = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
      title: title.trim().slice(0, 80) || "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId,
    };
    const existing = await this.getConversations(userId);
    await AsyncStorage.setItem(
      CONVERSATIONS_KEY(userId),
      JSON.stringify([conv, ...existing]),
    );
    return conv;
  },

  async deleteConversation(userId: string, chatId: string): Promise<void> {
    try {
      const existing = await this.getConversations(userId);
      const updated = existing.filter((c) => c.id !== chatId);
      await AsyncStorage.setItem(CONVERSATIONS_KEY(userId), JSON.stringify(updated));
      await AsyncStorage.removeItem(MESSAGES_KEY(chatId));
    } catch {}
  },

  async touchConversation(userId: string, chatId: string, newTitle?: string): Promise<void> {
    try {
      const existing = await this.getConversations(userId);
      const idx = existing.findIndex((c) => c.id === chatId);
      if (idx >= 0) {
        existing[idx].updatedAt = Date.now();
        if (newTitle) existing[idx].title = newTitle;
        await AsyncStorage.setItem(CONVERSATIONS_KEY(userId), JSON.stringify(existing));
      }
    } catch {}
  },

  async getMessages(chatId: string): Promise<StoredMessage[]> {
    try {
      const raw = await AsyncStorage.getItem(MESSAGES_KEY(chatId));
      if (!raw) return [];
      return JSON.parse(raw) as StoredMessage[];
    } catch {
      return [];
    }
  },

  async appendMessages(chatId: string, messages: StoredMessage[]): Promise<void> {
    try {
      const existing = await this.getMessages(chatId);
      const updated = [...existing, ...messages];
      await AsyncStorage.setItem(MESSAGES_KEY(chatId), JSON.stringify(updated));
    } catch {}
  },

  async clearMessages(chatId: string): Promise<void> {
    await AsyncStorage.removeItem(MESSAGES_KEY(chatId));
  },
};
