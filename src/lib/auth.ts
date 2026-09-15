import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  linkWithCredential,
  EmailAuthProvider,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { withTimeout } from "./firestore-utils";
import { UserProfile } from "@/types";

export const SUPER_ADMIN_EMAIL = "feraimentor@gmail.com";

const LOCAL_PROFILE_KEY = "microshift_cached_profile";

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Recupera o perfil do cache local em 0ms
 */
export function getCachedProfile(uid: string): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_PROFILE_KEY}_${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Salva perfil no cache local
 */
export function saveCachedProfile(uid: string, profile: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LOCAL_PROFILE_KEY}_${uid}`, JSON.stringify(profile));
  } catch {}
}

/**
 * Constrói instantaneamente o perfil com os dados reais da conta Google/Firebase
 * sem depender de chamadas remotas.
 */
export function buildImmediateProfile(firebaseUser: User): UserProfile {
  const cached = getCachedProfile(firebaseUser.uid);
  if (cached) {
    // Atualiza nome/foto da conta Google se tiverem mudado
    return {
      ...cached,
      displayName: firebaseUser.displayName || cached.displayName,
      photoURL: firebaseUser.photoURL || cached.photoURL,
    };
  }

  const isSuperAdmin = isSuperAdminEmail(firebaseUser.email);
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || (isSuperAdmin ? "Fera Mentor" : "Membro MicroShift"),
    photoURL: firebaseUser.photoURL || undefined,
    role: isSuperAdmin ? "SUPER_ADMIN" : "USER",
    plan: isSuperAdmin ? "SOVER" : "START",
    status: isSuperAdmin ? "ACTIVE_VIP" : "ACTIVE",
    streak: 0,
    completedLessons: [],
    createdAt: new Date().toISOString(),
    lastActiveDate: new Date().toISOString(),
  };
}

/**
 * Sincroniza o perfil com o Firestore com timeout rígido de 1.2 segundos.
 * NUNCA bloqueia a aplicação caso o Firestore esteja em provisionamento ou sem regras.
 */
export async function syncUserProfile(firebaseUser: User): Promise<UserProfile> {
  const isSuperAdmin = isSuperAdminEmail(firebaseUser.email);
  const baseProfile = buildImmediateProfile(firebaseUser);

  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    // Limite de 1200ms para a chamada do Firestore não travar a experiência do usuário
    const userSnap = await withTimeout(getDoc(userRef), 1200);

    if (userSnap.exists()) {
      const existing = userSnap.data() as UserProfile;
      if (isSuperAdmin && (existing.role !== "SUPER_ADMIN" || existing.plan !== "SOVER" || existing.status !== "ACTIVE_VIP")) {
        const updated: Partial<UserProfile> = {
          role: "SUPER_ADMIN",
          plan: "SOVER",
          status: "ACTIVE_VIP",
        };
        withTimeout(updateDoc(userRef, updated), 1200).catch(() => {});
        const finalProf = { ...existing, ...updated };
        saveCachedProfile(firebaseUser.uid, finalProf);
        return finalProf;
      }
      saveCachedProfile(firebaseUser.uid, existing);
      return existing;
    }

    // Salva em background sem bloquear
    withTimeout(setDoc(userRef, baseProfile), 1200).catch(() => {});
    saveCachedProfile(firebaseUser.uid, baseProfile);
    return baseProfile;
  } catch (err) {
    // Timeout ou erro do Firestore: usa imediatamente o perfil real do Google em cache
    saveCachedProfile(firebaseUser.uid, baseProfile);
    return baseProfile;
  }
}

/**
 * Autenticação Social Google Real
 * Abre o popup oficial do Google com seletor de contas.
 */
export async function loginWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const immediate = buildImmediateProfile(result.user);
  saveCachedProfile(result.user.uid, immediate);
  syncUserProfile(result.user).catch((err) => {
    console.warn("Sync em background após login Google:", err);
  });
  return immediate;
}

/**
 * Login com E-mail e Senha Real
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  const immediate = buildImmediateProfile(result.user);
  saveCachedProfile(result.user.uid, immediate);
  syncUserProfile(result.user).catch((err) => {
    console.warn("Sync em background após login Email:", err);
  });
  return immediate;
}

/**
 * Cadastro com E-mail e Senha Real
 */
export async function registerWithEmail(email: string, pass: string, name: string): Promise<UserProfile> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  try {
    await updateProfile(result.user, { displayName: name });
  } catch (e) {
    console.warn("Não foi possível atualizar o displayName no Auth:", e);
  }
  const immediate = buildImmediateProfile(result.user);
  immediate.displayName = name;
  saveCachedProfile(result.user.uid, immediate);
  syncUserProfile(result.user).catch((err) => {
    console.warn("Sync em background após cadastro:", err);
  });
  return immediate;
}

export async function linkEmailPasswordCredential(password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Nenhum usuário conectado ou e-mail ausente para vinculação.");
  }
  const credential = EmailAuthProvider.credential(user.email, password);
  await linkWithCredential(user, credential);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
