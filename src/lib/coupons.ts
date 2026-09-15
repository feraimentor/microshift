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
import { withTimeout } from "./firestore-utils";

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

  // Salva no cache local imediatamente (0ms)
  const list = getLocalCoupons();
  list.unshift(coupon);
  saveLocalCoupons(list);

  // Sincroniza no Firestore em background
  if (hasFirebaseConfig) {
    const couponRef = doc(db, "coupons", cleanCode);
    withTimeout(setDoc(couponRef, coupon), 1500).catch((err) => {
      console.warn("Sync do Firestore ao criar cupom falhou ou deu timeout:", err);
    });
  }

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
      withTimeout(setDoc(couponRef, coupon), 1500).catch(() => {});
    }
  }

  const list = getLocalCoupons();
  saveLocalCoupons([...generated, ...list]);

  return generated;
}

export async function listAllCoupons(): Promise<Coupon[]> {
  const localCoupons = getLocalCoupons();
  if (!hasFirebaseConfig) {
    return localCoupons;
  }

  try {
    const q = query(collection(db, "coupons"));
    const snap = await withTimeout(getDocs(q), 1500, "Firestore coupons timeout");
    const list: Coupon[] = [];
    snap.forEach((d) => list.push(d.data() as Coupon));
    if (list.length === 0) return localCoupons;
    const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    saveLocalCoupons(sorted);
    return sorted;
  } catch (err) {
    console.warn("Falha ou timeout ao buscar cupons no Firestore, usando fallback local:", err);
    return localCoupons;
  }
}

export async function listAllUsers(): Promise<UserProfile[]> {
  const localUsers = getLocalUsers();
  if (!hasFirebaseConfig) {
    return localUsers;
  }

  try {
    const snap = await withTimeout(getDocs(collection(db, "users")), 1500, "Firestore users timeout");
    const list: UserProfile[] = [];
    snap.forEach((d) => list.push(d.data() as UserProfile));
    if (list.length === 0) return localUsers;
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(list));
    }
    return list;
  } catch (err) {
    console.warn("Falha ou timeout ao listar usuários no Firestore, usando fallback local:", err);
    return localUsers;
  }
}

export async function updateUserPlanManual(
  userId: string,
  plan: SubscriptionPlan,
  status: PlanStatus
): Promise<void> {
  // Atualiza localmente em 0ms
  const users = getLocalUsers();
  const idx = users.findIndex((u) => u.uid === userId);
  if (idx !== -1) {
    users[idx].plan = plan;
    users[idx].status = status;
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    }
  }

  // Sincroniza no Firestore em background
  if (hasFirebaseConfig) {
    const userRef = doc(db, "users", userId);
    withTimeout(updateDoc(userRef, { plan, status }), 1500).catch((err) => {
      console.warn("Sync do Firestore ao atualizar plano manual falhou ou deu timeout:", err);
    });
  }
}

function redeemLocalCoupon(
  userId: string,
  code: string
): { success: boolean; plan: SubscriptionPlan; status: PlanStatus; message: string } {
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

export async function redeemCouponTransaction(
  userId: string,
  couponCode: string
): Promise<{ success: boolean; plan: SubscriptionPlan; status: PlanStatus; message: string }> {
  const code = couponCode.trim().toUpperCase();

  if (!hasFirebaseConfig) {
    return redeemLocalCoupon(userId, code);
  }

  try {
    const couponRef = doc(db, "coupons", code);
    const userRef = doc(db, "users", userId);

    return await withTimeout(
      runTransaction(db, async (transaction) => {
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
      }),
      2500,
      "Firestore coupon transaction timeout"
    );
  } catch (err: any) {
    // Se a transação do Firestore falhar por timeout ou indisponibilidade de rede/permissão,
    // usamos o fallback local para não frustrar o usuário
    console.warn("Transação remota de cupom falhou, aplicando localmente:", err.message);
    return redeemLocalCoupon(userId, code);
  }
}
