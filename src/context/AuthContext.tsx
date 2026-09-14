"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, hasFirebaseConfig } from "@/lib/firebase";
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  linkEmailPasswordCredential,
  syncUserProfile,
  SUPER_ADMIN_EMAIL,
} from "@/lib/auth";
import { redeemCouponTransaction } from "@/lib/coupons";
import { UserProfile, SubscriptionPlan, PlanStatus } from "@/types";
import { MOCK_SUPER_ADMIN, MOCK_START_USER, MOCK_SOVER_USER } from "@/lib/mock-data";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isMockMode: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  linkEmailPassword: (password: string) => Promise<void>;
  redeemCoupon: (code: string) => Promise<{ success: boolean; plan: SubscriptionPlan; status: PlanStatus; message: string }>;
  switchDemoUser: (target: "SUPER_ADMIN" | "STANDARD" | "START" | "SOVER") => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_ACTIVE_USER_KEY = "microshift_active_demo_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMockMode, setIsMockMode] = useState<boolean>(!hasFirebaseConfig);

  useEffect(() => {
    if (!hasFirebaseConfig) {
      const savedType = localStorage.getItem(LOCAL_ACTIVE_USER_KEY) || "SUPER_ADMIN";
      if (savedType === "START") {
        setProfile(MOCK_START_USER);
      } else if (savedType === "SOVER") {
        setProfile(MOCK_SOVER_USER);
      } else {
        setProfile(MOCK_SUPER_ADMIN);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userProf = await syncUserProfile(firebaseUser);
          setProfile(userProf);
          setIsMockMode(false);
        } catch (err) {
          console.error("Erro ao sincronizar perfil do usuário:", err);
          // Fallback para mock admin
          setProfile(MOCK_SUPER_ADMIN);
          setIsMockMode(true);
        }
      } else {
        setUser(null);
        // No modo demo/deslogado, preserva acesso de testes
        const savedType = localStorage.getItem(LOCAL_ACTIVE_USER_KEY) || "SUPER_ADMIN";
        if (savedType === "START") setProfile(MOCK_START_USER);
        else if (savedType === "SOVER") setProfile(MOCK_SOVER_USER);
        else setProfile(MOCK_SUPER_ADMIN);
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
      setIsMockMode(!hasFirebaseConfig);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const prof = await loginWithEmail(email, pass);
      setProfile(prof);
      setIsMockMode(!hasFirebaseConfig);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const prof = await registerWithEmail(email, pass, name);
      setProfile(prof);
      setIsMockMode(!hasFirebaseConfig);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setProfile(MOCK_START_USER);
      localStorage.setItem(LOCAL_ACTIVE_USER_KEY, "START");
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

  const switchDemoUser = (target: "SUPER_ADMIN" | "STANDARD" | "START" | "SOVER") => {
    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, target);
    if (target === "SUPER_ADMIN") {
      setProfile(MOCK_SUPER_ADMIN);
    } else if (target === "START" || target === "STANDARD") {
      setProfile(MOCK_START_USER);
    } else {
      setProfile(MOCK_SOVER_USER);
    }
  };

  const refreshProfile = async () => {
    if (user && hasFirebaseConfig) {
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
        isMockMode,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        linkEmailPassword,
        redeemCoupon,
        switchDemoUser,
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
