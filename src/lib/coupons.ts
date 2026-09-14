import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
  query,
  orderBy,
} from "firebase/firestore";
import { db, hasFirebaseConfig } from "./firebase";
import { Coupon, CouponType, UserProfile, SubscriptionPlan, PlanStatus } from "@/types";
import { INITIAL_COUPONS, MOCK_SUPER_ADMIN, MOCK_START_USER, MOCK_SOVER_USER } from "./mock-data";

const LOCAL_COUPONS_KEY = "microshift_coupons";
const LOCAL_USERS_KEY = "microshift_users_admin";

function getLocalCoupons(): Coupon[] {
  if (typeof window === "undefined") return INITIAL_COUPONS;
  const saved = localStorage.getItem(LOCAL_COUPONS_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_COUPONS_KEY, JSON.stringify(INITIAL_COUPONS));
    return INITIAL_COUPONS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_COUPONS;
  }
}

function saveLocalCoupons(coupons: Coupon[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_COUPONS_KEY, JSON.stringify(coupons));
}

function getLocalUsers(): UserProfile[] {
  if (typeof window === "undefined") return [MOCK_SUPER_ADMIN, MOCK_START_USER, MOCK_SOVER_USER];
  const saved = localStorage.getItem(LOCAL_USERS_KEY);
  if (!saved) {
    const init = [MOCK_SUPER_ADMIN, MOCK_START_USER, MOCK_SOVER_USER];
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(init));
    return init;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return [MOCK_SUPER_ADMIN, MOCK_START_USER, MOCK_SOVER_USER];
  }
}

export async function createCoupon(code: string, type: CouponType): Promise<Coupon> {
  const cleanCode = code.trim().toUpperCase();
  const coupon: Coupon = {
    id: `coupon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    code: cleanCode,
    type,
    used: false,
    isRedeemed: false,
    createdAt: new Date().toISOString(),
  };

  if (!hasFirebaseConfig) {
    const list = getLocalCoupons();
    list.unshift(coupon);
    saveLocalCoupons(list);
    return coupon;
  }

  const couponRef = doc(db, "coupons", cleanCode);
  await setDoc(couponRef, coupon);
  return coupon;
}

export async function createBatchCoupons(
  prefix: string,
  count: number,
  type: CouponType
): Promise<Coupon[]> {
  const generated: Coupon[] = [];
  const cleanPrefix = prefix.trim().toUpperCase();

  for (let i = 1; i <= count; i++) {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${cleanPrefix}-${randomSuffix}`;
    const coupon: Coupon = {
      id: `batch_${Date.now()}_${i}`,
      code,
      type,
      used: false,
      isRedeemed: false,
      createdAt: new Date().toISOString(),
    };
    generated.push(coupon);

    if (hasFirebaseConfig) {
      const couponRef = doc(db, "coupons", code);
      await setDoc(couponRef, coupon);
    }
  }

  if (!hasFirebaseConfig) {
    const list = getLocalCoupons();
    saveLocalCoupons([...generated, ...list]);
  }

  return generated;
}

export async function listAllCoupons(): Promise<Coupon[]> {
  if (!hasFirebaseConfig) {
    return getLocalCoupons();
  }

  try {
    const q = query(collection(db, "coupons"));
    const snap = await getDocs(q);
    const list: Coupon[] = [];
    snap.forEach((d) => list.push(d.data() as Coupon));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn("Falha ao buscar cupons no Firestore, usando fallback:", err);
    return getLocalCoupons();
  }
}

export async function listAllUsers(): Promise<UserProfile[]> {
  if (!hasFirebaseConfig) {
    return getLocalUsers();
  }

  try {
    const snap = await getDocs(collection(db, "users"));
    const list: UserProfile[] = [];
    snap.forEach((d) => list.push(d.data() as UserProfile));
    return list;
  } catch (err) {
    console.warn("Falha ao listar usuários no Firestore, usando fallback:", err);
    return getLocalUsers();
  }
}

export async function updateUserPlanManual(
  userId: string,
  plan: SubscriptionPlan,
  status: PlanStatus
): Promise<void> {
  if (!hasFirebaseConfig) {
    const users = getLocalUsers();
    const idx = users.findIndex((u) => u.uid === userId);
    if (idx !== -1) {
      users[idx].plan = plan;
      users[idx].status = status;
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      }
    }
    return;
  }

  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { plan, status });
}

export async function redeemCouponTransaction(
  userId: string,
  couponCode: string
): Promise<{ success: boolean; plan: SubscriptionPlan; status: PlanStatus; message: string }> {
  const code = couponCode.trim().toUpperCase();

  if (!hasFirebaseConfig) {
    const coupons = getLocalCoupons();
    const coupon = coupons.find((c) => c.code === code);
    if (!coupon) {
      throw new Error("Cupom inválido ou não encontrado.");
    }
    if (coupon.used) {
      throw new Error("Este cupom já foi resgatado anteriormente.");
    }

    coupon.used = true;
    coupon.usedBy = userId;
    coupon.usedAt = new Date().toISOString();
    saveLocalCoupons(coupons);

    let plan: SubscriptionPlan = "START";
    let status: PlanStatus = "ACTIVE";
    let message = "";

    if (coupon.type === "LIFETIME_VIP") {
      plan = "SOVER";
      status = "ACTIVE_VIP";
      message = "Parabéns! Você ativou o Plano Sover Vitalício (VIP perpétuo)!";
    } else if (coupon.type === "TRIAL_3M_TRACK") {
      plan = "TRACK";
      status = "ACTIVE";
      message = "Cupom resgatado! Você ganhou 90 dias de degustação do Plano Track!";
    } else if (coupon.type === "TRIAL_3M_SOVER") {
      plan = "SOVER";
      status = "ACTIVE";
      message = "Cupom resgatado! Você ganhou 90 dias de degustação do Plano Sover!";
    }

    return { success: true, plan, status, message };
  }

  const couponRef = doc(db, "coupons", code);
  const userRef = doc(db, "users", userId);

  return await runTransaction(db, async (transaction) => {
    const couponDoc = await transaction.get(couponRef);
    if (!couponDoc.exists()) {
      throw new Error("Cupom inválido ou não encontrado.");
    }

    const couponData = couponDoc.data() as Coupon;
    if (couponData.used) {
      throw new Error("Este cupom já foi utilizado.");
    }

    let plan: SubscriptionPlan = "START";
    let status: PlanStatus = "ACTIVE";
    let message = "";

    if (couponData.type === "LIFETIME_VIP") {
      plan = "SOVER";
      status = "ACTIVE_VIP";
      message = "Parabéns! Plano Sover Vitalício ativado com sucesso!";
    } else if (couponData.type === "TRIAL_3M_TRACK") {
      plan = "TRACK";
      status = "ACTIVE";
      message = "Cupom ativado! 90 dias de acesso ao Plano Track!";
    } else if (couponData.type === "TRIAL_3M_SOVER") {
      plan = "SOVER";
      status = "ACTIVE";
      message = "Cupom ativado! 90 dias de acesso ao Plano Sover!";
    }

    const now = new Date().toISOString();
    transaction.update(couponRef, {
      used: true,
      usedBy: userId,
      usedAt: now,
    });

    transaction.update(userRef, {
      plan,
      status,
      lastActiveDate: now,
    });

    return { success: true, plan, status, message };
  });
}
