import { MentorChatMessage, MentorChatSession } from "@/types";

const LOCAL_SESSIONS_PREFIX = "microshift_mentor_sessions";

export function generateDefaultWelcomeMessage(userName: string = "Profissional"): MentorChatMessage {
  return {
    id: "welcome",
    role: "model",
    content: `Olá, ${userName}. Eu sou o seu Mentor Reflexivo no MicroShift.
Minha missão é ajudá-lo a transicionar de carreira com clareza executiva, sem ansiedade e valorizando cada ano da sua bagagem anterior.

Em que desafio ou decisão estratégica de carreira você gostaria de focar hoje?`,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Cria um título conciso e inteligente a partir da primeira pergunta do usuário
 */
export function generateSessionTitleFromMessage(content: string): string {
  const clean = content.replace(/\n+/g, " ").trim();
  if (!clean) return "Nova Reflexão";
  if (clean.length <= 32) return clean;
  
  const words = clean.split(" ");
  let title = "";
  for (const w of words) {
    if ((title + " " + w).length > 28) break;
    title = title ? `${title} ${w}` : w;
  }
  return (title || clean.substring(0, 28)) + "...";
}

/**
 * Recupera todas as sessões salvas do usuário no navegador (0ms)
 */
export function getUserMentorSessions(userId: string, userName?: string): MentorChatSession[] {
  if (typeof window === "undefined" || !userId) return [];
  
  try {
    const raw = localStorage.getItem(`${LOCAL_SESSIONS_PREFIX}_${userId}`);
    if (raw) {
      const parsed: MentorChatSession[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
    }
  } catch (err) {
    console.warn("Erro ao ler sessões do mentor:", err);
  }

  // Se não houver nenhuma sessão, cria a primeira automaticamente
  const initialSession: MentorChatSession = {
    id: `session_${Date.now()}`,
    userId,
    title: "Primeira Reflexão",
    messages: [generateDefaultWelcomeMessage(userName)],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveUserMentorSessions(userId, [initialSession]);
  return [initialSession];
}

/**
 * Salva a lista completa de sessões no localStorage
 */
export function saveUserMentorSessions(userId: string, sessions: MentorChatSession[]): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(`${LOCAL_SESSIONS_PREFIX}_${userId}`, JSON.stringify(sessions));
  } catch (err) {
    console.warn("Erro ao salvar sessões do mentor:", err);
  }
}

/**
 * Cria uma nova conversa limpa para o usuário
 */
export function createMentorSession(userId: string, userName?: string, title: string = "Nova Reflexão"): MentorChatSession {
  const newSession: MentorChatSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    title,
    messages: [generateDefaultWelcomeMessage(userName)],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existing = getUserMentorSessions(userId, userName);
  const updated = [newSession, ...existing];
  saveUserMentorSessions(userId, updated);
  return newSession;
}

/**
 * Salva ou atualiza uma sessão específica
 */
export function saveMentorSession(userId: string, session: MentorChatSession): void {
  const sessions = getUserMentorSessions(userId);
  const index = sessions.findIndex((s) => s.id === session.id);

  const updatedSession = {
    ...session,
    updatedAt: new Date().toISOString(),
  };

  if (index !== -1) {
    sessions[index] = updatedSession;
  } else {
    sessions.unshift(updatedSession);
  }

  saveUserMentorSessions(userId, sessions);
}

/**
 * Remove uma sessão do histórico
 */
export function deleteMentorSession(userId: string, sessionId: string, userName?: string): MentorChatSession[] {
  const sessions = getUserMentorSessions(userId, userName);
  const filtered = sessions.filter((s) => s.id !== sessionId);

  if (filtered.length === 0) {
    // Se apagou a última, cria uma nova em branco
    const fallback = createMentorSession(userId, userName, "Nova Reflexão");
    return [fallback];
  }

  saveUserMentorSessions(userId, filtered);
  return filtered;
}

/**
 * Renomeia o título de uma sessão
 */
export function renameMentorSession(userId: string, sessionId: string, newTitle: string): MentorChatSession[] {
  const sessions = getUserMentorSessions(userId);
  const session = sessions.find((s) => s.id === sessionId);
  if (session && newTitle.trim()) {
    session.title = newTitle.trim();
    session.updatedAt = new Date().toISOString();
    saveUserMentorSessions(userId, sessions);
  }
  return sessions;
}
