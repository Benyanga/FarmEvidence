import { create } from "zustand";
import { db } from "./db";

async function sha256(value) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const useAuthStore = create((set) => ({
  currentUser: null,
  isAuthenticated: false,
  authReady: typeof indexedDB === "undefined",
  error: null,

  hydrateAuth: async () => {
    try {
      const session = await db.sessions.get("auth-session");
      if (session?.currentUser) {
        set({ currentUser: session.currentUser, isAuthenticated: true, authReady: true });
        return;
      }
      set({ authReady: true });
    } catch {
      set({ authReady: true });
    }
  },

  register: async ({ name, email, phone, password }) => {
    set({ error: null });
    if (!name || !password || (!email && !phone)) {
      set({ error: "Name, password, and either email or phone are required." });
      return false;
    }
    const existing = await db.accounts.where("email").equals(email || "__none__").first()
      || await db.accounts.where("phone").equals(phone || "__none__").first();
    if (existing) {
      set({ error: "Account already exists. Please login." });
      return false;
    }
    const passwordHash = await sha256(password);
    const user = {
      id: crypto.randomUUID(),
      name,
      email: email || null,
      phone: phone || null,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    await db.accounts.put(user);
    return true;
  },

  login: async ({ identifier, password }) => {
    set({ error: null });
    const user = await db.accounts.where("email").equals(identifier).first()
      || await db.accounts.where("phone").equals(identifier).first();
    if (!user) {
      set({ error: "Account not found. Create an account first." });
      return false;
    }
    const passwordHash = await sha256(password);
    if (user.passwordHash !== passwordHash) {
      set({ error: "Invalid password." });
      return false;
    }
    const currentUser = { id: user.id, name: user.name, email: user.email, phone: user.phone };
    await db.sessions.put({ id: "auth-session", currentUser, updatedAt: new Date().toISOString() });
    set({ currentUser, isAuthenticated: true });
    return true;
  },

  logout: async () => {
    await db.sessions.delete("auth-session");
    set({ currentUser: null, isAuthenticated: false, error: null });
  },
}));

