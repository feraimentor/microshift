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

const LOCAL_GOALS_KEY = "microshift_goals";

function getLocalGoals(userId: string): HabitGoal[] {
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

function saveLocalGoals(userId: string, goals: HabitGoal[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${LOCAL_GOALS_KEY}_${userId}`, JSON.stringify(goals));
}

export async function fetchUserGoals(userId: string): Promise<HabitGoal[]> {
  if (!hasFirebaseConfig) {
    return getLocalGoals(userId);
  }

  try {
    const q = query(collection(db, "goals"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const goals: HabitGoal[] = [];
    snap.forEach((d) => goals.push(d.data() as HabitGoal));
    if (goals.length === 0) return getLocalGoals(userId);
    return goals;
  } catch (err) {
    console.warn("Falha ao buscar metas no Firestore, usando fallback local:", err);
    return getLocalGoals(userId);
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
  const currentGoals = await fetchUserGoals(userId);

  // Regra de negócio da SPEC: Start pode ter no máximo 1 meta ativa
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

  if (!hasFirebaseConfig) {
    const goals = getLocalGoals(userId);
    goals.push(newGoal);
    saveLocalGoals(userId, goals);
    return newGoal;
  }

  const goalRef = doc(db, "goals", newGoal.id);
  await setDoc(goalRef, newGoal);
  return newGoal;
}

export async function completeGoalToday(
  arg1: string,
  arg2?: string,
  difficultModeUsed?: boolean
): Promise<HabitGoal> {
  const todayStr = new Date().toISOString().split("T")[0];

  // Detecta se chamado como (goalId, userId, diff) ou (userId, goalId, diff)
  let goalId = arg1;
  let userId = arg2 || "";

  if (arg1.startsWith("goal_") || (arg2 && !arg2.startsWith("goal_"))) {
    goalId = arg1;
    userId = arg2 || "";
  } else {
    userId = arg1;
    goalId = arg2 || arg1;
  }

  if (!hasFirebaseConfig) {
    const goals = getLocalGoals(userId);
    const goal = goals.find((g) => g.id === goalId) || goals[0];
    if (!goal) throw new Error("Meta não encontrada.");

    goal.completedToday = true;
    goal.streak += 1;
    goal.difficultModeUsed = Boolean(difficultModeUsed);
    goal.lastCompletedDate = todayStr;
    saveLocalGoals(userId, goals);
    return goal;
  }

  const goalRef = doc(db, "goals", goalId);
  const currentGoals = await fetchUserGoals(userId);
  const goal = currentGoals.find((g) => g.id === goalId);
  if (!goal) throw new Error("Meta não encontrada.");

  const updated: Partial<HabitGoal> = {
    completedToday: true,
    streak: (goal.streak || 0) + 1,
    difficultModeUsed: Boolean(difficultModeUsed),
    lastCompletedDate: todayStr,
  };

  await updateDoc(goalRef, updated);
  return { ...goal, ...updated };
}

export async function deleteUserGoal(goalIdOrUserId: string, optionalGoalId?: string): Promise<void> {
  const goalId = optionalGoalId || goalIdOrUserId;
  const userId = optionalGoalId ? goalIdOrUserId : "";

  if (!hasFirebaseConfig) {
    if (typeof window !== "undefined") {
      // Procura em todas as chaves do localStorage que começam com microshift_goals
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
    return;
  }

  const goalRef = doc(db, "goals", goalId);
  await deleteDoc(goalRef);
}
