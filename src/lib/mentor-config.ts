import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db, hasFirebaseConfig } from "./firebase";
import { withTimeout } from "./firestore-utils";
import {
  MentorAiConfig,
  KnowledgeDocument,
  McpServerConfig,
  GeminiModelId,
} from "@/types";

const LOCAL_MENTOR_CONFIG_KEY = "microshift_mentor_ai_config";
const LOCAL_KNOWLEDGE_BASE_KEY = "microshift_knowledge_base";
const LOCAL_MCP_SERVERS_KEY = "microshift_mcp_servers";

export const DEFAULT_SYSTEM_PROMPT = `Você é o Mentor Sover da plataforma MicroShift.
Sua missão é atuar como um mentor executivo sênior, humano, acolhedor e estrategista, especializado na metodologia Calm Tech e no público 35+ em transição de carreira para tecnologia, inovação e liderança ágil.

DIRETRIZES FUNDAMENTAIS DE COMPORTAMENTO E TOM DE VOZ:
1. DIÁLOGO HUMANO E NATURAL: Converse em Português do Brasil com calor humano, empatia autêntica e maturidade. Jamais soe como um chatbot de respostas automáticas, nem use frases prontas de autoajuda.
2. CONTINUIDADE DE CONVERSA: Em conversas já iniciadas, NUNCA repita saudações formais ("Olá", "Como posso ajudar?", "Olá novamente"). Vá direto ao ponto central do que o aluno trouxe, como quem retoma um bom diálogo pessoal.
3. VALORIZAÇÃO DA BAGAGEM PRÉVIA (35+): Mostre ao aluno que sua experiência anterior (maturidade emocional, gestão de conflitos, visão de negócio, liderança humana) é o seu maior ativo em relação aos profissionais jovens.
4. METODOLOGIA CALM TECH: Promova a "consistência silenciosa" (blocos diários de 15 minutos focados) contra a ansiedade da pressa e o esgotamento (burnout).
5. ESTRUTURA DAS RESPOSTAS:
   - Validação empática do sentimento/desafio trazido.
   - Mudança de perspectiva estratégica e prática.
   - Uma micro-ação realizável hoje.
   - Uma pergunta reflexiva socrática ao final para manter a autonomia do profissional.
6. BASE DE CONHECIMENTO: Quando houver materiais proprietários da MicroShift fornecidos como contexto, utilize esses conceitos com prioridade máxima para enriquecer a mentoria.`;

export const DEFAULT_WELCOME_MESSAGE =
  "Olá. Sou o seu Mentor Sover. Estou aqui para caminhar lado a lado com você na sua jornada de carreira, tecnologia e consistência silenciosa. O que está no topo das suas prioridades hoje?";

export const DEFAULT_MENTOR_CONFIG: MentorAiConfig = {
  apiKey: "",
  model: "gemini-2.5-flash",
  temperature: 0.7,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  welcomeMessage: DEFAULT_WELCOME_MESSAGE,
  ragEnabled: true,
  mcpEnabled: false,
};

// Documentos de conhecimento padrão da metodologia MicroShift
export const INITIAL_KNOWLEDGE_DOCS: KnowledgeDocument[] = [
  {
    id: "doc_calm_tech_manifesto",
    title: "Manifesto Calm Tech & Consistência Silenciosa",
    fileType: "markdown",
    charCount: 1450,
    isActive: true,
    createdAt: new Date().toISOString(),
    content: `# Princípios da Consistência Silenciosa (MicroShift)
1. Esforço Heróico vs. Consistência Silenciosa: Estudar 4 horas em um único dia e parar por duas semanas gera exaustão e culpa. 15 minutos diários geram mais de 90 horas no ano com sedimentação neural.
2. Modo Dia Difícil (2 minutos): Nos dias de sobrecarga extrema, faça apenas 2 minutos da sua meta. Não quebre a ofensiva mental.
3. Transição Tardia: Aos 35+, o profissional não compete por linhas de código memorizadas, mas sim por maturidade de negócio, articulação de equipe e resolução de problemas complexos.
4. Tecnologia é Meio, Humano é Fim: A liderança em IA é 80% sobre cultura, alinhamento de expectativas e inteligência emocional.`,
  },
  {
    id: "doc_framework_star_35",
    title: "Framework de Posicionamento Profissional para 35+",
    fileType: "markdown",
    charCount: 1220,
    isActive: true,
    createdAt: new Date().toISOString(),
    content: `# Posicionamento Executivo em Transição
- Nunca peça desculpas pela carreira anterior. Use uma Narrativa Integradora.
- Fórmula da Narrativa: "Construí X anos de autoridade sólida em [Área Anterior]; hoje alavanco tecnologia e inteligência artificial para multiplicar esse impacto em escala."
- Método STAR Executivo: Situação, Tarefa, Ação humana/estratégica, Resultado mensurável.`,
  },
];

/* ------------------------------------------------------------- */
/* CONFIGURAÇÃO DO MENTOR IA                                     */
/* ------------------------------------------------------------- */

export function normalizeGeminiModel(model?: string): GeminiModelId {
  if (!model || model === "gemini-2.0-flash" || model === "gemini-2.0-flash-exp") {
    return "gemini-2.5-flash";
  }
  return model as GeminiModelId;
}

export function getLocalMentorAiConfig(): MentorAiConfig {
  if (typeof window === "undefined") return DEFAULT_MENTOR_CONFIG;
  try {
    const saved = localStorage.getItem(LOCAL_MENTOR_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const model = normalizeGeminiModel(parsed.model);
      return { ...DEFAULT_MENTOR_CONFIG, ...parsed, model };
    }
  } catch {}
  return DEFAULT_MENTOR_CONFIG;
}

export function saveLocalMentorAiConfig(config: MentorAiConfig): void {
  if (typeof window === "undefined") return;
  try {
    const normalizedConfig = {
      ...config,
      model: normalizeGeminiModel(config.model),
    };
    localStorage.setItem(LOCAL_MENTOR_CONFIG_KEY, JSON.stringify(normalizedConfig));
  } catch {}
}

export async function fetchMentorAiConfig(): Promise<MentorAiConfig> {
  const local = getLocalMentorAiConfig();

  if (!hasFirebaseConfig || !db) {
    return local;
  }

  try {
    const docRef = doc(db, "system_settings", "mentor_ai");
    const snap = await withTimeout(getDoc(docRef), 1800);
    if (snap.exists()) {
      const data = snap.data() as Partial<MentorAiConfig>;
      const model = normalizeGeminiModel(data.model || local.model);
      const merged: MentorAiConfig = {
        ...DEFAULT_MENTOR_CONFIG,
        ...local,
        ...data,
        model,
      };
      saveLocalMentorAiConfig(merged);
      return merged;
    }
  } catch (err: any) {
    console.warn("Recorrendo ao cache local para MentorAiConfig:", err?.message);
  }

  return local;
}

export async function saveMentorAiConfig(
  config: MentorAiConfig,
  updatedBy: string = "Admin"
): Promise<void> {
  const payload: MentorAiConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  saveLocalMentorAiConfig(payload);

  if (hasFirebaseConfig && db) {
    try {
      const docRef = doc(db, "system_settings", "mentor_ai");
      await withTimeout(setDoc(docRef, payload, { merge: true }), 2500);
    } catch (err: any) {
      console.warn("Falha ao sincronizar MentorAiConfig no Firestore:", err?.message);
    }
  }
}

/* ------------------------------------------------------------- */
/* BASE DE CONHECIMENTO (RAG)                                    */
/* ------------------------------------------------------------- */

export function getLocalKnowledgeBase(): KnowledgeDocument[] {
  if (typeof window === "undefined") return INITIAL_KNOWLEDGE_DOCS;
  try {
    const saved = localStorage.getItem(LOCAL_KNOWLEDGE_BASE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(LOCAL_KNOWLEDGE_BASE_KEY, JSON.stringify(INITIAL_KNOWLEDGE_DOCS));
  } catch {}
  return INITIAL_KNOWLEDGE_DOCS;
}

export function saveLocalKnowledgeBase(docs: KnowledgeDocument[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KNOWLEDGE_BASE_KEY, JSON.stringify(docs));
  } catch {}
}

export async function fetchKnowledgeBase(): Promise<KnowledgeDocument[]> {
  const local = getLocalKnowledgeBase();

  if (!hasFirebaseConfig || !db) {
    return local;
  }

  try {
    const colRef = collection(db, "knowledge_base");
    const snap = await withTimeout(getDocs(colRef), 2000);
    if (!snap.empty) {
      const loaded: KnowledgeDocument[] = [];
      snap.forEach((d) => {
        loaded.push(d.data() as KnowledgeDocument);
      });
      saveLocalKnowledgeBase(loaded);
      return loaded;
    }
  } catch (err: any) {
    console.warn("Recorrendo ao cache local para KnowledgeBase:", err?.message);
  }

  return local;
}

export async function addKnowledgeDocument(
  docData: Omit<KnowledgeDocument, "id" | "createdAt">
): Promise<KnowledgeDocument> {
  const id = `kndoc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newDoc: KnowledgeDocument = {
    ...docData,
    id,
    createdAt: new Date().toISOString(),
  };

  const current = getLocalKnowledgeBase();
  const updated = [newDoc, ...current];
  saveLocalKnowledgeBase(updated);

  if (hasFirebaseConfig && db) {
    try {
      const docRef = doc(db, "knowledge_base", id);
      await withTimeout(setDoc(docRef, newDoc), 2500);
    } catch (err: any) {
      console.warn("Falha ao salvar KnowledgeDocument no Firestore:", err?.message);
    }
  }

  return newDoc;
}

export async function deleteKnowledgeDocument(id: string): Promise<void> {
  const current = getLocalKnowledgeBase();
  const updated = current.filter((d) => d.id !== id);
  saveLocalKnowledgeBase(updated);

  if (hasFirebaseConfig && db) {
    try {
      const docRef = doc(db, "knowledge_base", id);
      await withTimeout(deleteDoc(docRef), 2500);
    } catch (err: any) {
      console.warn("Falha ao excluir KnowledgeDocument no Firestore:", err?.message);
    }
  }
}

export async function toggleKnowledgeDocument(id: string, isActive: boolean): Promise<void> {
  const current = getLocalKnowledgeBase();
  const updated = current.map((d) => (d.id === id ? { ...d, isActive } : d));
  saveLocalKnowledgeBase(updated);

  if (hasFirebaseConfig && db) {
    try {
      const docRef = doc(db, "knowledge_base", id);
      await withTimeout(updateDoc(docRef, { isActive }), 2500);
    } catch (err: any) {
      console.warn("Falha ao alternar status do KnowledgeDocument:", err?.message);
    }
  }
}

/**
 * Busca de Relevância RAG no cliente:
 * Analisa palavras-chave da dúvida do usuário e ranqueia trechos dos documentos ativos.
 */
export function findRelevantKnowledge(
  query: string,
  docs: KnowledgeDocument[],
  maxChars: number = 3000
): string {
  const activeDocs = docs.filter((d) => d.isActive && d.content && d.content.trim());
  if (activeDocs.length === 0) return "";

  // Normalização e extração de termos significativos (sem stopwords básicas)
  const stopwords = new Set([
    "a", "o", "as", "os", "de", "do", "da", "dos", "das", "em", "no", "na",
    "nos", "nas", "para", "por", "com", "como", "que", "se", "eu", "ele",
    "ela", "você", "isso", "este", "esta", "um", "uma", "mais", "mas",
  ]);

  const tokens = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopwords.has(t));

  if (tokens.length === 0) {
    // Se a query for muito curta, inclui os primeiros 1500 caracteres do documento mais recente
    return activeDocs[0].content.slice(0, 1500);
  }

  // Pontuação simples de relevância por documento
  const scoredDocs = activeDocs.map((doc) => {
    const textLower = (doc.title + " " + doc.content).toLowerCase();
    let score = 0;

    for (const token of tokens) {
      const count = textLower.split(token).length - 1;
      if (count > 0) {
        score += count * 2;
        if (doc.title.toLowerCase().includes(token)) {
          score += 10; // Bônus se a palavra estiver no título
        }
      }
    }

    return { doc, score };
  });

  // Ordena pelos mais relevantes
  scoredDocs.sort((a, b) => b.score - a.score);

  // Monta o trecho de contexto sem estourar o limite de caracteres
  let contextOutput = "";
  for (const item of scoredDocs) {
    if (item.score === 0 && contextOutput.length > 0) break;

    const snippet = `### [Base de Conhecimento: ${item.doc.title}]\n${item.doc.content.slice(0, 1500)}\n\n`;
    if (contextOutput.length + snippet.length <= maxChars) {
      contextOutput += snippet;
    } else {
      break;
    }
  }

  return contextOutput.trim();
}

/* ------------------------------------------------------------- */
/* CONECTORES MCP (Model Context Protocol)                       */
/* ------------------------------------------------------------- */

export function getLocalMcpServers(): McpServerConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(LOCAL_MCP_SERVERS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return [];
}

export function saveLocalMcpServers(servers: McpServerConfig[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_MCP_SERVERS_KEY, JSON.stringify(servers));
  } catch {}
}

export async function fetchMcpServers(): Promise<McpServerConfig[]> {
  const local = getLocalMcpServers();

  if (!hasFirebaseConfig || !db) {
    return local;
  }

  try {
    const colRef = collection(db, "mcp_servers");
    const snap = await withTimeout(getDocs(colRef), 2000);
    if (!snap.empty) {
      const loaded: McpServerConfig[] = [];
      snap.forEach((d) => {
        loaded.push(d.data() as McpServerConfig);
      });
      saveLocalMcpServers(loaded);
      return loaded;
    }
  } catch (err: any) {
    console.warn("Recorrendo ao cache local para McpServers:", err?.message);
  }

  return local;
}

export async function saveMcpServer(
  serverData: Omit<McpServerConfig, "id" | "createdAt">,
  existingId?: string
): Promise<McpServerConfig> {
  const id = existingId || `mcp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const server: McpServerConfig = {
    ...serverData,
    id,
    createdAt: new Date().toISOString(),
  };

  const current = getLocalMcpServers();
  const index = current.findIndex((s) => s.id === id);
  const updated = index >= 0 ? current.map((s) => (s.id === id ? server : s)) : [server, ...current];
  saveLocalMcpServers(updated);

  if (hasFirebaseConfig && db) {
    try {
      const docRef = doc(db, "mcp_servers", id);
      await withTimeout(setDoc(docRef, server), 2500);
    } catch (err: any) {
      console.warn("Falha ao salvar McpServer no Firestore:", err?.message);
    }
  }

  return server;
}

export async function deleteMcpServer(id: string): Promise<void> {
  const current = getLocalMcpServers();
  const updated = current.filter((s) => s.id !== id);
  saveLocalMcpServers(updated);

  if (hasFirebaseConfig && db) {
    try {
      const docRef = doc(db, "mcp_servers", id);
      await withTimeout(deleteDoc(docRef), 2500);
    } catch (err: any) {
      console.warn("Falha ao remover McpServer no Firestore:", err?.message);
    }
  }
}
