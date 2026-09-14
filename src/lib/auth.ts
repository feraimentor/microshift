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
import { UserProfile } from "@/types";

export const SUPER_ADMIN_EMAIL = "feraimentor@gmail.com";

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Sincroniza o perfil do usuário autenticado no Firebase Auth com o Firestore.
 * Se o Firestore falhar por regras ou rede, preserva os dados reais da conta Google/Email.
 */
export async function syncUserProfile(firebaseUser: User): Promise<UserProfile> {
  const isSuperAdmin = isSuperAdminEmail(firebaseUser.email);

  const realProfile: UserProfile = {
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

  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const existing = userSnap.data() as UserProfile;
      // Garante privilégios master incondicionais para feraimentor@gmail.com
      if (isSuperAdmin && (existing.role !== "SUPER_ADMIN" || existing.plan !== "SOVER" || existing.status !== "ACTIVE_VIP")) {
        const updated: Partial<UserProfile> = {
          role: "SUPER_ADMIN",
          plan: "SOVER",
          status: "ACTIVE_VIP",
        };
        await updateDoc(userRef, updated);
        return { ...existing, ...updated };
      }
      return existing;
    }

    await setDoc(userRef, realProfile);
    return realProfile;
  } catch (err) {
    console.warn("Firestore indisponível ou sem permissão de escrita, mantendo sessão autenticada com dados reais do Google:", err);
    return realProfile;
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
  return syncUserProfile(result.user);
}

/**
 * Login com E-mail e Senha Real
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return syncUserProfile(result.user);
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
  return syncUserProfile(result.user);
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
