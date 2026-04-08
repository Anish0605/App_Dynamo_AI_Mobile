import { fetch } from "expo/fetch";
import { ConvStorage, StoredConversation, StoredMessage } from "./conversations";

const BASE_URL = "https://app.dynamoai.in";

async function post(path: string, body: object): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function get(path: string, params?: Record<string, string>): Promise<Response> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
  }
  return fetch(url.toString());
}

export type UserInfo = {
  user_id: string;
  email?: string;
  name?: string;
  plan?: string;
  messages_used?: number;
  messages_limit?: number;
  images_used?: number;
  images_limit?: number;
  videos_used?: number;
  videos_limit?: number;
};

export const PLAN_LIMITS: Record<string, number> = {
  free: 50,
  plus: 500,
  pro: 999999,
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type Memory = {
  id: string;
  content: string;
  created_at?: string;
};

export type Conversation = {
  id: string;
  title: string;
  updatedAt?: number;
};

export const api = {
  async getUser(userId: string, email?: string, name?: string): Promise<UserInfo | null> {
    try {
      const res = await post("/get-user", { user_id: userId, email, name });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getConversations(userId: string): Promise<Conversation[]> {
    const stored = await ConvStorage.getConversations(userId);
    return stored.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }));
  },

  async createConversation(userId: string, title?: string): Promise<string | null> {
    const conv = await ConvStorage.createConversation(userId, title ?? "New Chat");
    return conv.id;
  },

  async deleteConversation(userId: string, chatId: string): Promise<boolean> {
    await ConvStorage.deleteConversation(userId, chatId);
    return true;
  },

  async getMessages(userId: string, chatId: string): Promise<Message[]> {
    const stored = await ConvStorage.getMessages(chatId);
    return stored.map((m) => ({ id: m.id, role: m.role, content: m.content }));
  },

  async saveMessages(chatId: string, userId: string, messages: Message[]): Promise<void> {
    const stored: StoredMessage[] = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: Date.now(),
    }));
    await ConvStorage.appendMessages(chatId, stored);
    await ConvStorage.touchConversation(userId, chatId);
  },

  async getFollowUps(
    _userId: string,
    _chatId: string,
    aiResponse: string,
    userMessage: string,
  ): Promise<string[]> {
    try {
      const res = await post("/follow-ups", { message: userMessage, response: aiResponse });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.follow_ups ?? []);
    } catch {
      return [];
    }
  },

  async getMemory(userId: string): Promise<Memory[]> {
    try {
      const res = await get("/memory", { user_id: userId });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.memories ?? []);
    } catch {
      return [];
    }
  },

  async addMemory(userId: string, content: string): Promise<Memory | null> {
    try {
      const res = await post("/memory", { user_id: userId, content });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async deleteMemory(userId: string, memoryId: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/memory/${memoryId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async createOrder(userId: string, plan: "plus" | "pro"): Promise<{ order_id: string; amount: number; currency: string } | null> {
    try {
      const res = await post("/create-order", { user_id: userId, plan });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async verifyPayment(
    userId: string,
    orderId: string,
    paymentId: string,
    signature: string,
    plan: string,
  ): Promise<boolean> {
    try {
      const res = await post("/verify-payment", {
        user_id: userId,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        plan,
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  exportChatUrl(userId: string, chatId: string, format: "pdf" | "word" | "ppt"): string {
    return `${BASE_URL}/export/${format}?user_id=${encodeURIComponent(userId)}&chat_id=${encodeURIComponent(chatId)}`;
  },

  async exportChat(userId: string, chatId: string, format: "pdf" | "word" | "ppt"): Promise<string | null> {
    try {
      const url = this.exportChatUrl(userId, chatId, format);
      const res = await fetch(url);
      if (!res.ok) return null;
      return url;
    } catch {
      return null;
    }
  },

  async uploadFileAndChat(
    userId: string,
    chatId: string,
    fileUri: string,
    fileName: string,
    mimeType: string,
    message?: string,
  ): Promise<{ response: string } | null> {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as unknown as Blob);

      const url = new URL(`${BASE_URL}/chat-with-file`);
      url.searchParams.set("user_id", userId);
      url.searchParams.set("chat_id", chatId);
      if (message) url.searchParams.set("message", message);

      const res = await fetch(url.toString(), {
        method: "POST",
        body: formData,
      });
      if (!res.ok) return null;
      const data = await res.json();
      return { response: data.response ?? data.content ?? data.text ?? "File processed." };
    } catch {
      return null;
    }
  },

  async transcribeAudio(audioUri: string): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append("audio", {
        uri: audioUri,
        name: "voice.m4a",
        type: "audio/m4a",
      } as unknown as Blob);

      const res = await fetch(`${BASE_URL}/transcribe-audio`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.text ?? data.transcript ?? null;
    } catch {
      return null;
    }
  },

  async streamChat(
    userId: string,
    chatId: string,
    message: string,
    useSearch: boolean,
    deepDive: boolean,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: string) => void,
    signal?: AbortSignal,
    smartAction?: boolean,
  ): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          chat_id: chatId,
          message,
          use_search: useSearch,
          deep_dive: deepDive,
          ...(smartAction ? { smart_action: true } : {}),
        }),
        signal,
      });

      if (!res.ok) {
        let errText = "";
        try { errText = await res.text(); } catch {}
        onError(errText || `Error ${res.status}`);
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("text/event-stream")) {
        const reader = res.body?.getReader();
        if (!reader) { onError("No response stream"); return; }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") { onDone(); return; }
              try {
                const parsed = JSON.parse(data);
                const text =
                  parsed.choices?.[0]?.delta?.content ??
                  parsed.text ?? parsed.content ?? parsed.chunk ?? "";
                if (text) onChunk(text);
              } catch {
                if (data && data !== "[DONE]") onChunk(data);
              }
            }
          }
        }

        if (buffer.trim()) {
          try {
            const parsed = JSON.parse(buffer);
            const text = parsed.text ?? parsed.content ?? "";
            if (text) onChunk(text);
          } catch {
            if (buffer.trim()) onChunk(buffer.trim());
          }
        }
        onDone();
      } else {
        const text = await res.text();
        try {
          const parsed = JSON.parse(text);
          const content =
            parsed.content ?? parsed.text ?? parsed.response ?? parsed.message ?? text;
          if (content) onChunk(content);
        } catch {
          if (text.trim()) onChunk(text.trim());
        }
        onDone();
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      onError(String(e));
    }
  },
};
