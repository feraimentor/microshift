"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  linkEmailPasswordCredential,
  syncUserProfile,
} from "@/lib/auth";
import { redeemCouponTransaction } from "@/lib/coupons";
import { UserProfile, SubscriptionPlan, PlanStatus } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  linkEmailPassword: (password: string) => Promise<void>;
  redeemCoupon: (code: string) => Promise<{ success: boolean; plan: SubscriptionPlan; status: PlanStatus; message: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Monitoramento reativo e oficial de sessão do Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userProf = await syncUserProfile(firebaseUser);
          setProfile(userProf);
        } catch (err) {
          console.error("Erro ao sincronizar perfil do usuário:", err);
          // Mesmo com falha de rede/firestore, monta com os dados reais do Google
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "Usuário",
            photoURL: firebaseUser.photoURL || undefined,
            role: firebaseUser.email?.toLowerCase() === "feraimentor@gmail.com" ? "SUPER_ADMIN" : "USER",
            plan: firebaseUser.email?.toLowerCase() === "feraimentor@gmail.com" ? "SOVER" : "START",
            status: firebaseUser.email?.toLowerCase() === "feraimentor@gmail.com" ? "ACTIVE_VIP" : "ACTIVE",
            streak: 0,
            completedLessons: [],
            createdAt: new Date().toISOString(),
            lastActiveDate: new Date().toISOString(),
          });
        }
      } else {
        // Deslogado
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const prof = await loginWithGoogle();
      setProfile(prof);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const prof = await loginWithEmail(email, pass);
      setProfile(prof);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const prof = await registerWithEmail(email, pass, name);
      setProfile(prof);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const linkEmailPassword = async (password: string) => {
    await linkEmailPasswordCredential(password);
  };

  const redeemCoupon = async (code: string) => {
    if (!profile) throw new Error("Usuário não autenticado.");
    const result = await redeemCouponTransaction(profile.uid, code);
    if (result.success) {
      setProfile((prev) => (prev ? { ...prev, plan: result.plan, status: result.status } : null));
    }
    return result;
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await syncUserProfile(user);
      setProfile(prof);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        linkEmailPassword,
        redeemCoupon,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
