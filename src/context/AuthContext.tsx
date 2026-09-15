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
  buildImmediateProfile,
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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Instantâneo (0ms): monta o perfil com dados reais da conta Google/Firebase e cache
        const immediateProfile = buildImmediateProfile(firebaseUser);
        setProfile(immediateProfile);
        setLoading(false);

        // Sincronização resiliente em background com o Firestore (não-bloqueante)
        syncUserProfile(firebaseUser)
          .then((synced) => {
            setProfile(synced);
          })
          .catch((err) => {
            console.warn("Sincronização em background do Firestore não respondeu a tempo:", err);
          });
      } else {
        // Deslogado imediatamente
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
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
