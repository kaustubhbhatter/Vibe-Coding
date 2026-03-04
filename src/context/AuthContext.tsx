import React, { createContext, useContext, useEffect, useState } from "react";
import { User, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};

    try {
      unsubscribe = onAuthStateChanged(
        auth, 
        (user) => {
          setUser(user);
          setLoading(false);
        },
        (error) => {
          console.error("Auth state change error:", error);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Failed to subscribe to auth state changes:", error);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (!auth) {
      console.warn("Authentication is disabled due to missing configuration. Using Demo User.");
      // Demo Login
      const demoUser: User = {
        uid: "demo-user-123",
        displayName: "Demo User",
        email: "demo@example.com",
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: "",
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => "",
        getIdTokenResult: async () => ({
          token: "",
          signInProvider: "google",
          claims: {},
          authTime: "",
          issuedAtTime: "",
          expirationTime: "",
          signInSecondFactor: null,
        }),
        reload: async () => {},
        toJSON: () => ({}),
        phoneNumber: null,
        providerId: "google.com",
      };
      setUser(demoUser);
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    if (!auth) {
      setUser(null);
      return;
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
