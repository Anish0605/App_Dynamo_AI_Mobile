import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  firebaseUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        let retries = 3;
        while (retries > 0) {
          try {
            const result = await Promise.race([
              api.getUser(u.uid, u.email ?? undefined, u.displayName ?? undefined),
              new Promise(resolve => setTimeout(() => resolve(null), 5000))
            ]);
            if (result) break;
          } catch {}
          retries--;
          if (retries > 0) await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  function formatError(e: unknown): string {
    const msg = (e as { code?: string; message?: string })?.code ?? "";
    if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found"))
      return "Invalid email or password.";
    if (msg.includes("email-already-in-use")) return "An account with this email already exists.";
    if (msg.includes("weak-password")) return "Password should be at least 6 characters.";
    if (msg.includes("invalid-email")) return "Please enter a valid email address.";
    if (msg.includes("too-many-requests")) return "Too many attempts. Please try again later.";
    if (msg.includes("network")) return "Network error. Please check your connection.";
    return (e as { message?: string })?.message ?? "Something went wrong.";
  }

  async function signIn(email: string, password: string) {
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await api.getUser(cred.user.uid, cred.user.email ?? undefined, cred.user.displayName ?? undefined);
    } catch (e) {
      setError(formatError(e));
      throw e;
    }
  }

  async function signUp(email: string, password: string, name: string) {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      await api.getUser(cred.user.uid, email.trim(), name.trim() || undefined);
    } catch (e) {
      setError(formatError(e));
      throw e;
    }
  }

  async function signInWithGoogle(idToken: string) {
    setError(null);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const cred = await signInWithCredential(auth, credential);
      await api.getUser(
        cred.user.uid,
        cred.user.email ?? undefined,
        cred.user.displayName ?? undefined,
      );
    } catch (e) {
      setError(formatError(e));
      throw e;
    }
  }

  async function logout() {
    await firebaseSignOut(auth);
  }

  async function resetPassword(email: string) {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (e) {
      setError(formatError(e));
      throw e;
    }
  }

  function clearError() {
    setError(null);
  }

  const value: AuthContextValue = {
    user,
    firebaseUser: user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    signOut: logout,
    resetPassword,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
