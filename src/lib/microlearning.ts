import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db, hasFirebaseConfig } from "./firebase";
import { MicrolearningLesson } from "@/types";
import { withTimeout } from "./firestore-utils";

export function extractYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : "dQw4w9WgXcQ";
}

export const INITIAL_MICROLEARNING_LESSONS: MicrolearningLesson[] = [
  {
    id: "lesson-1",
    title: "O Paradoxo dos 35+: Como converter bagagem prévia em autoridade ágil",
    moduleTitle: "Módulo 1: Reposicionamento Sênior",
    youtubeId: "dQw4w9WgXcQ",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    durationText: "7 min",
    durationMinutes: 7,
    description: "Aprenda a reinterpretar anos de gestão convencional em competências de alto impacto.",
    category: "Transição de Carreira",
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "lesson-2",
    title: "Blindagem de Atenção: Micro-hábitos de 15 minutos contra a sobrecarga cognitiva",
    moduleTitle: "Módulo 2: Foco & Neurociência",
    youtubeId: "dQw4w9WgXcQ",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    durationText: "8 min",
    durationMinutes: 8,
    description: "Princípios da neurociência aplicada para blocos de foco inabaláveis.",
    category: "Foco & Neurociência",
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "lesson-3",
    title: "Negociação Salarial Sênior: Posicionando-se como ativo estratégico e não despesa",
    moduleTitle: "Módulo 3: Liderança & Estratégia",
    youtubeId: "dQw4w9WgXcQ",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    durationText: "10 min",
    durationMinutes: 10,
    description: "Técnicas de enquadramento de valor e comunicação assertiva.",
    category: "Estratégia & Liderança",
    order: 3,
    createdAt: new Date().toISOString(),
  },
];

const LOCAL_LESSONS_KEY = "microshift_lessons";
const LOCAL_PROGRESS_KEY = "microshift_user_lessons_progress";

function getLocalLessons(): MicrolearningLesson[] {
  if (typeof window === "undefined") return INITIAL_MICROLEARNING_LESSONS;
  const saved = localStorage.getItem(LOCAL_LESSONS_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_LESSONS_KEY, JSON.stringify(INITIAL_MICROLEARNING_LESSONS));
    return INITIAL_MICROLEARNING_LESSONS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_MICROLEARNING_LESSONS;
  }
}

function saveLocalLessons(lessons: MicrolearningLesson[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_LESSONS_KEY, JSON.stringify(lessons));
}

function getLocalCompletedLessons(userId: string): string[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(`${LOCAL_PROGRESS_KEY}_${userId}`);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveLocalCompletedLessons(userId: string, completed: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${LOCAL_PROGRESS_KEY}_${userId}`, JSON.stringify(completed));
}

export async function fetchMicrolearningLessons(): Promise<MicrolearningLesson[]> {
  const localList = getLocalLessons();
  if (!hasFirebaseConfig) {
    return localList;
  }

  try {
    const q = query(collection(db, "lessons"));
    const snap = await withTimeout(getDocs(q), 1500, "Firestore lessons timeout");
    const lessons: MicrolearningLesson[] = [];
    snap.forEach((d) => lessons.push(d.data() as MicrolearningLesson));
    if (lessons.length === 0) return localList;
    const sorted = lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
    saveLocalLessons(sorted);
    return sorted;
  } catch (err) {
    console.warn("Falha ou timeout ao buscar aulas no Firestore, usando fallback local:", err);
    return localList;
  }
}

export async function createMicrolearningLesson(
  moduleTitleOrData: string | any,
  title?: string,
  youtubeUrl?: string,
  durationText?: string
): Promise<MicrolearningLesson> {
  let lesson: MicrolearningLesson;

  if (typeof moduleTitleOrData === "object") {
    const data = moduleTitleOrData;
    const yId = extractYouTubeId(data.youtubeUrl || "");
    lesson = {
      id: `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: data.title || "",
      moduleTitle: data.moduleTitle || data.category || "Geral",
      youtubeId: yId,
      youtubeUrl: data.youtubeUrl || "",
      durationText: data.durationText || `${data.durationMinutes || 5} min`,
      durationMinutes: data.durationMinutes || 5,
      description: data.description || "",
      category: data.category || "Transição",
      order: data.order || Date.now(),
      createdAt: new Date().toISOString(),
    };
  } else {
    const moduleTitle = moduleTitleOrData;
    const yId = extractYouTubeId(youtubeUrl || "");
    lesson = {
      id: `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title || "",
      moduleTitle: moduleTitle || "Geral",
      youtubeId: yId,
      youtubeUrl: youtubeUrl || "",
      durationText: durationText || "5 min",
      durationMinutes: parseInt(durationText || "5", 10) || 5,
      category: moduleTitle,
      order: Date.now(),
      createdAt: new Date().toISOString(),
    };
  }

  // Salva localmente em 0ms
  const list = getLocalLessons();
  list.push(lesson);
  saveLocalLessons(list);

  // Sincroniza com o Firestore em background
  if (hasFirebaseConfig) {
    const lessonRef = doc(db, "lessons", lesson.id);
    withTimeout(setDoc(lessonRef, lesson), 1500).catch((err) => {
      console.warn("Sync do Firestore ao criar aula falhou ou deu timeout:", err);
    });
  }

  return lesson;
}

export async function fetchUserCompletedLessons(userId: string): Promise<string[]> {
  const localCompleted = getLocalCompletedLessons(userId);
  if (!hasFirebaseConfig) {
    return localCompleted;
  }

  try {
    const userRef = doc(db, "users", userId);
    const snap = await withTimeout(getDoc(userRef), 1200, "Firestore user completed lessons timeout");
    if (snap.exists()) {
      const remote = snap.data()?.completedLessons || [];
      saveLocalCompletedLessons(userId, remote);
      return remote;
    }
    return localCompleted;
  } catch (err) {
    console.warn("Falha ou timeout ao buscar progresso no Firestore, usando fallback local:", err);
    return localCompleted;
  }
}

export async function toggleLessonCompletion(
  userId: string,
  lessonId: string
): Promise<{ completed: boolean; completedLessons: string[] }> {
  // Atualiza localmente em 0ms
  let completed = getLocalCompletedLessons(userId);
  const exists = completed.includes(lessonId);
  if (exists) {
    completed = completed.filter((id) => id !== lessonId);
  } else {
    completed.push(lessonId);
  }
  saveLocalCompletedLessons(userId, completed);

  // Sincroniza com o Firestore em background
  if (hasFirebaseConfig) {
    const userRef = doc(db, "users", userId);
    withTimeout(
      updateDoc(userRef, {
        completedLessons: exists ? arrayRemove(lessonId) : arrayUnion(lessonId),
      }),
      1500
    ).catch((err) => {
      console.warn("Sync do progresso de aulas no Firestore falhou ou deu timeout:", err);
    });
  }

  return { completed: !exists, completedLessons: completed };
}
