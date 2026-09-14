import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  linkWithCredential,
  EmailAuthProvider,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, hasFirebaseConfig } from "./firebase";
import { UserProfile } from "@/types";
import { MOCK_SUPER_ADMIN, MOCK_START_USER } from "./mock-data";

export const SUPER_ADMIN_EMAIL = "feraimentor@gmail.com";

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export async function syncUserProfile(firebaseUser: User): Promise<UserProfile> {
  if (!hasFirebaseConfig) {
    return MOCK_SUPER_ADMIN;
  }

  const userRef = doc(db, "users", firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  const isSuperAdmin = firebaseUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  if (userSnap.exists()) {
    const existing = userSnap.data() as UserProfile;
    // Se for feraimentor@gmail.com, garante que sempre é SUPER_ADMIN e SOVER VIP
    if (isSuperAdmin && (existing.role !== "SUPER_ADMIN" || existing.plan !== "SOVER")) {
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

  const newProfile: UserProfile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || (isSuperAdmin ? "Fera Mentor" : "Aluno MicroShift"),
    photoURL: firebaseUser.photoURL || undefined,
    role: isSuperAdmin ? "SUPER_ADMIN" : "USER",
    plan: isSuperAdmin ? "SOVER" : "START",
    status: isSuperAdmin ? "ACTIVE_VIP" : "ACTIVE",
    streak: 0,
    completedLessons: [],
    createdAt: new Date().toISOString(),
    lastActiveDate: new Date().toISOString(),
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}

export async function loginWithGoogle(): Promise<UserProfile> {
  if (!hasFirebaseConfig) {
    return MOCK_START_USER;
  }
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return syncUserProfile(result.user);
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  if (!hasFirebaseConfig) {
    if (isSuperAdminEmail(email)) {
      return MOCK_SUPER_ADMIN;
    }
    return {
      ...MOCK_START_USER,
      email,
      displayName: email.split("@")[0] || "Usuário MicroShift",
    };
  }
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return syncUserProfile(result.user);
}

export async function registerWithEmail(email: string, pass: string, name: string): Promise<UserProfile> {
  const isSuperAdmin = isSuperAdminEmail(email);

  if (!hasFirebaseConfig) {
    if (isSuperAdmin) {
      return MOCK_SUPER_ADMIN;
    }
    return {
      uid: "mock-" + Date.now(),
      email,
      displayName: name || email.split("@")[0] || "Usuário MicroShift",
      role: "USER",
      plan: "START",
      status: "ACTIVE",
      streak: 0,
      completedLessons: [],
      createdAt: new Date().toISOString(),
      lastActiveDate: new Date().toISOString(),
    };
  }
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  const userRef = doc(db, "users", result.user.uid);

  const newProfile: UserProfile = {
    uid: result.user.uid,
    email: result.user.email || email,
    displayName: name,
    role: isSuperAdmin ? "SUPER_ADMIN" : "USER",
    plan: isSuperAdmin ? "SOVER" : "START",
    status: isSuperAdmin ? "ACTIVE_VIP" : "ACTIVE",
    streak: 0,
    completedLessons: [],
    createdAt: new Date().toISOString(),
    lastActiveDate: new Date().toISOString(),
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}

export async function linkEmailPasswordCredential(password: string): Promise<void> {
  if (!hasFirebaseConfig) {
    return;
  }
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Nenhum usuário conectado ou e-mail ausente para vinculação.");
  }
  const credential = EmailAuthProvider.credential(user.email, password);
  await linkWithCredential(user, credential);
}

export async function logoutUser(): Promise<void> {
  if (hasFirebaseConfig) {
    await signOut(auth);
  }
}
