import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db, hasFirebaseConfig } from "./firebase";
import { HabitGoal, SubscriptionPlan } from "@/types";
import { INITIAL_GOALS } from "./mock-data";
import { withTimeout } from "./firestore-utils";

const LOCAL_GOALS_KEY = "microshift_goals";

export function getLocalGoals(userId: string): HabitGoal[] {
  if (typeof window === "undefined") return INITIAL_GOALS;
  const saved = localStorage.getItem(`${LOCAL_GOALS_KEY}_${userId}`);
  if (!saved) {
    localStorage.setItem(`${LOCAL_GOALS_KEY}_${userId}`, JSON.stringify(INITIAL_GOALS));
    return INITIAL_GOALS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_GOALS;
  }
}

export function saveLocalGoals(userId: string, goals: HabitGoal[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LOCAL_GOALS_KEY}_${userId}`, JSON.stringify(goals));
  } catch {}
}

/**
 * Busca metas com abordagem Cache-First.
 * Se o Firestore demorar mais que 1.5s ou estiver indisponível, devolve instantaneamente os dados locais.
 */
export async function fetchUserGoals(userId: string): Promise<HabitGoal[]> {
  const localList = getLocalGoals(userId);

  if (!hasFirebaseConfig) {
    return localList;
  }

  try {
    const q = query(collection(db, "goals"), where("userId", "==", userId));
    const snap = await withTimeout(getDocs(q), 1500, "Firestore goals timeout");
    const goals: HabitGoal[] = [];
    snap.forEach((d) => goals.push(d.data() as HabitGoal));
    if (goals.length > 0) {
      saveLocalGoals(userId, goals);
      return goals;
    }
    return localList;
  } catch (err) {
    console.warn("Falha ou timeout ao buscar metas no Firestore, usando dados locais:", err);
    return localList;
  }
}

export async function createUserGoal(
  userId: string,
  userPlan: SubscriptionPlan,
  titleOrData:
    | string
    | {
        title: string;
        category?: string;
        durationMinutes?: number;
        targetMinutes?: number;
        steps?: any[];
      },
  category?: string,
  targetMinutes: number = 15,
  roadmapSteps?: any[]
): Promise<HabitGoal> {
  const currentGoals = getLocalGoals(userId);

  // Regra de negócio: plano START limitado a 1 meta ativa
  if (userPlan === "START" && currentGoals.length >= 1) {
    throw new Error(
      "O plano Start é limitado a 1 meta diária ativa. Faça upgrade para o Plano Track ou Sover para cadastrar metas ilimitadas!"
    );
  }

  let finalTitle = "";
  let finalCategory = "Geral";
  let finalDuration = targetMinutes;
  let finalSteps: any[] = [];

  if (typeof titleOrData === "object") {
    finalTitle = titleOrData.title;
    finalCategory = titleOrData.category || "Geral";
    finalDuration = titleOrData.durationMinutes || titleOrData.targetMinutes || 15;
    finalSteps = titleOrData.steps || [];
  } else {
    finalTitle = titleOrData;
    finalCategory = category || "Geral";
    finalDuration = targetMinutes;
    finalSteps = roadmapSteps || [];
  }

  const newGoal: HabitGoal = {
    id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    title: finalTitle,
    category: finalCategory,
    targetMinutes: finalDuration,
    durationMinutes: finalDuration,
    completedToday: false,
    streak: 0,
    createdAt: new Date().toISOString(),
    roadmapSteps: finalSteps,
    steps: finalSteps,
  };

  // Salva imediatamente no cache local (0ms)
  const updatedGoals = [...currentGoals, newGoal];
  saveLocalGoals(userId, updatedGoals);

  // Sincroniza com o Firestore em background sem travar a interface
  if (hasFirebaseConfig) {
    const goalRef = doc(db, "goals", newGoal.id);
    withTimeout(setDoc(goalRef, newGoal), 1500).catch((err) => {
      console.warn("Sync do Firestore ao criar meta falhou ou deu timeout:", err);
    });
  }

  return newGoal;
}

export async function completeGoalToday(
  arg1: string,
  arg2?: string,
  difficultModeUsed?: boolean
): Promise<HabitGoal> {
  const todayStr = new Date().toISOString().split("T")[0];

  let goalId = arg1;
  let userId = arg2 || "";

  if (arg1.startsWith("goal_") || (arg2 && !arg2.startsWith("goal_"))) {
    goalId = arg1;
    userId = arg2 || "";
  } else {
    userId = arg1;
    goalId = arg2 || arg1;
  }

  // Atualiza imediatamente localmente
  const goals = getLocalGoals(userId);
  const goalIndex = goals.findIndex((g) => g.id === goalId);
  const targetGoal = goalIndex !== -1 ? goals[goalIndex] : goals[0];

  if (!targetGoal) {
    throw new Error("Meta não encontrada.");
  }

  const updatedGoal: HabitGoal = {
    ...targetGoal,
    completedToday: true,
    streak: (targetGoal.streak || 0) + 1,
    difficultModeUsed: Boolean(difficultModeUsed),
    lastCompletedDate: todayStr,
  };

  if (goalIndex !== -1) {
    goals[goalIndex] = updatedGoal;
  } else {
    goals.push(updatedGoal);
  }
  saveLocalGoals(userId, goals);

  // Sincroniza com o Firestore em background
  if (hasFirebaseConfig) {
    const goalRef = doc(db, "goals", goalId);
    const updatedFields: Partial<HabitGoal> = {
      completedToday: true,
      streak: updatedGoal.streak,
      difficultModeUsed: updatedGoal.difficultModeUsed,
      lastCompletedDate: todayStr,
    };
    withTimeout(updateDoc(goalRef, updatedFields), 1500).catch((err) => {
      console.warn("Sync do Firestore ao completar meta falhou ou deu timeout:", err);
    });
  }

  return updatedGoal;
}

export async function deleteUserGoal(goalIdOrUserId: string, optionalGoalId?: string): Promise<void> {
  const goalId = optionalGoalId || goalIdOrUserId;

  // Remove localmente imediatamente
  if (typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_GOALS_KEY)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const list: HabitGoal[] = JSON.parse(raw);
            const filtered = list.filter((g) => g.id !== goalId);
            localStorage.setItem(key, JSON.stringify(filtered));
          } catch {}
        }
      }
    }
  }

  // Sincroniza com o Firestore em background
  if (hasFirebaseConfig) {
    const goalRef = doc(db, "goals", goalId);
    withTimeout(deleteDoc(goalRef), 1500).catch((err) => {
      console.warn("Sync do Firestore ao excluir meta falhou ou deu timeout:", err);
    });
  }
}
