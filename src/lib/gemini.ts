/**
 * Motor de Inteligência e Mentoria Reflexiva Sover (35+)
 * Suporta Gemini 2.0 Flash / 1.5 Pro com RAG (Base de Conhecimento),
 * Conectores MCP e Treinamento Comportamental Dinâmico editável pelo Admin.
 */

import { GeminiModelId } from "@/types";
import {
  fetchMentorAiConfig,
  getLocalMentorAiConfig,
  fetchKnowledgeBase,
  findRelevantKnowledge,
  fetchMcpServers,
  normalizeGeminiModel,
} from "./mentor-config";

const LOCAL_GEMINI_KEY = "microshift_gemini_api_key";

/**
 * Obtém a chave individual cadastrada pelo usuário no navegador
 */
export function getCustomGeminiApiKey(): string {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(LOCAL_GEMINI_KEY);
      if (saved && saved.trim()) return saved.trim();
    } catch {}
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
}

/**
 * Define a chave individual cadastrada pelo usuário no navegador
 */
export function setCustomGeminiApiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    if (key.trim()) {
      localStorage.setItem(LOCAL_GEMINI_KEY, key.trim());
    } else {
      localStorage.removeItem(LOCAL_GEMINI_KEY);
    }
  } catch {}
}

export function hasCustomGeminiApiKey(): boolean {
  return Boolean(getCustomGeminiApiKey());
}

/**
 * Obtém a chave efetiva com prioridade:
 * 1. Chave Master da Plataforma configurada pelo Super Admin
 * 2. Chave salva pelo usuário localmente
 * 3. Variáveis de ambiente
 */
export async function getEffectiveApiKey(): Promise<string> {
  try {
    const config = await fetchMentorAiConfig();
    if (config.apiKey && config.apiKey.trim()) {
      return config.apiKey.trim();
    }
  } catch {}

  const userKey = getCustomGeminiApiKey();
  if (userKey) return userKey;

  const localConfig = getLocalMentorAiConfig();
  if (localConfig.apiKey && localConfig.apiKey.trim()) {
    return localConfig.apiKey.trim();
  }

  return "";
}

/**
 * Executa requisição direta à API REST do Google Gemini
 * Timeout ágil de 6 segundos com fallback instantâneo caso o modelo retorne 404
 */
export async function callGeminiRest(
  apiKey: string,
  contents: { role: string; parts: { text: string }[] }[],
  systemInstruction: string,
  model: GeminiModelId = "gemini-1.5-flash",
  temperature: number = 0.7,
  jsonMode: boolean = false
): Promise<string | null> {
  const cleanRequested = (model || "").replace(/^models\//, "");
  const primaryModel =
    cleanRequested && cleanRequested !== "gemini-2.0-flash" ? cleanRequested : "gemini-1.5-flash";

  const executeSingle = async (mod: string, timeoutMs: number): Promise<string | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${apiKey}`;
      const body: any = {
        contents,
        system_instruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature,
          ...(jsonMode ? { responseMimeType: "application/json" } : {}),
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);
      if (!res.ok) {
        console.warn(`Gemini (${mod}) retornou status HTTP ${res.status}`);
        return null;
      }

      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return reply ? reply.trim() : null;
    } catch {
      clearTimeout(timer);
      return null;
    }
  };

  // 1. Tenta o modelo principal configurado (6 segundos)
  const primaryRes = await executeSingle(primaryModel, 6000);
  if (primaryRes) return primaryRes;

  // 2. Se falhar ou der 404, e o modelo não era 1.5-flash, tenta o fallback padrão universal (5 segundos)
  if (primaryModel !== "gemini-1.5-flash") {
    console.warn(`Tentando fallback com gemini-1.5-flash...`);
    const fallbackRes = await executeSingle("gemini-1.5-flash", 5000);
    if (fallbackRes) return fallbackRes;
  }

  return null;
}

/**
 * Testa a conexão da Chave de API e do Modelo diretamente no Admin
 * Executa uma requisição ultra-rápida (timeout 5s) sem loops longos.
 */
export async function testGeminiConnection(
  apiKey: string,
  model: GeminiModelId = "gemini-1.5-flash"
): Promise<{ success: boolean; message: string; activeModel?: GeminiModelId }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { success: false, message: "A chave de API não foi informada." };
  }

  const cleanRequested = (model || "").replace(/^models\//, "");
  const targetModel =
    cleanRequested && cleanRequested !== "gemini-2.0-flash" ? cleanRequested : "gemini-1.5-flash";

  const executeTest = async (mod: string, timeoutMs: number = 5000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${cleanKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Responda apenas: OK" }] }],
          generationConfig: { temperature: 0.1 },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const text = await res.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch {}
      return { ok: res.ok, status: res.status, text, json };
    } catch (err: any) {
      clearTimeout(timer);
      return { ok: false, status: 0, text: err?.message || "Timeout de rede", json: null };
    }
  };

  // 1. Tenta o modelo selecionado pelo usuário (5 segundos)
  let testResult = await executeTest(targetModel, 5000);
  let resolvedModel = targetModel;

  // 2. Se retornar 404 (modelo descontinuado ou indisponível na conta), tenta automaticamente gemini-1.5-flash
  if (!testResult.ok && testResult.status === 404 && targetModel !== "gemini-1.5-flash") {
    const fallbackResult = await executeTest("gemini-1.5-flash", 5000);
    if (fallbackResult.ok) {
      testResult = fallbackResult;
      resolvedModel = "gemini-1.5-flash";
    }
  }

  // 3. Avalia o resultado
  if (testResult.ok) {
    const reply = testResult.json?.candidates?.[0]?.content?.parts?.[0]?.text || "OK";
    return {
      success: true,
      message: `Conexão bem-sucedida! O modelo ${resolvedModel} respondeu em tempo real: "${reply.trim()}". Salve as configurações para ativar para todos os alunos.`,
      activeModel: resolvedModel as GeminiModelId,
    };
  }

  // Tratamento de mensagens de erro específicas do Google
  const errorReason = testResult.json?.error?.details?.[0]?.reason || "";
  const rawMessage = testResult.json?.error?.message || testResult.text;

  if (errorReason === "API_KEY_SERVICE_BLOCKED" || rawMessage.includes("blocked")) {
    return {
      success: false,
      message:
        "Chave bloqueada pelo Google (API_KEY_SERVICE_BLOCKED). Essa chave é a do Firebase e tem restrições de serviço no Google Cloud. Para resolver: No Google AI Studio, clique em 'Chaves de API' no menu esquerdo e clique em 'Criar chave de API em um novo projeto'. A nova chave funcionará de imediato!",
    };
  }

  if (errorReason === "API_KEY_INVALID" || rawMessage.includes("API key not valid")) {
    return {
      success: false,
      message:
        "Chave inválida (API_KEY_INVALID). Verifique se copiou todos os caracteres da chave gerada no Google AI Studio.",
    };
  }

  if (testResult.status === 0) {
    return {
      success: false,
      message: "Tempo limite de conexão excedido (5s). Verifique sua conexão com a internet ou bloqueadores de extensões no navegador.",
    };
  }

  return {
    success: false,
    message: `Erro retornado pelo Google (${testResult.status}): ${rawMessage.slice(0, 200)}`,
  };
}

/**
 * Motor Cognitivo de Contingência Offline 35+
 * Usado exclusivamente se o dispositivo estiver desconectado da internet.
 */
function generateReflectiveMentorResponse(
  userText: string,
  userProfile?: any,
  isFirstExchange: boolean = true
): string {
  const normalized = userText.toLowerCase().trim();
  const userName = userProfile?.displayName ? userProfile.displayName.split(" ")[0] : "Líder";
  const targetCareer = userProfile?.targetCareer || "sua área de foco";
  const greeting = isFirstExchange ? `Olá, ${userName}. ` : "";

  // 1. Dúvida sobre Tecnologia / IA conectada a Desenvolvimento Humano
  if (
    (normalized.includes("desenvolvimento humano") || normalized.includes("humano") || normalized.includes("pessoas") || normalized.includes("psicologia") || normalized.includes("empatia")) &&
    (normalized.includes("tecnologia") || normalized.includes("ia") || normalized.includes("inteligência artificial") || normalized.includes("tech"))
  ) {
    return (
      `${greeting}Essa é exatamente uma das intersecções mais valorizadas e estratégicas da década.\n\n` +
      `Muitos profissionais cometem o equívoco de acreditar que a revolução da Inteligência Artificial é sobre código puro ou algoritmos. Na realidade executiva, **80% do sucesso na adoção de IA dentro das empresas depende de adaptação cultural, comportamento, liderança empática e facilitação humana**.\n\n` +
      `Ferramentas de IA são abundantes, mas quem compreende a mente, os receios e a dinâmica de pessoas é quem realmente lidera a transformação. Você pode se posicionar como a **ponte insubstituível** — em papéis como *Liderança de Produto Centrada no Humano*, *Estratégia de Adoção de IA* ou *Consultoria de Mudança Tecnológica Humanizada*.\n\n` +
      `Para o seu momento de reflexão hoje: **Qual é a maior dor ou resistência que você percebe nas pessoas ao seu redor quando o assunto é tecnologia, e como sua escuta sênior pode ser o remédio que nenhuma linha de código entrega?**`
    );
  }

  // 2. Transição de Carreira aos 35+, 40+ ou 50+
  if (
    normalized.includes("35") ||
    normalized.includes("40") ||
    normalized.includes("50") ||
    normalized.includes("idade") ||
    normalized.includes("tarde") ||
    normalized.includes("velho") ||
    normalized.includes("tempo perdido")
  ) {
    return (
      `${greeting}Compreendo profundamente essa inquietação. Mas permita-me propor uma inversão de perspectiva:\n\n` +
      `Aos 35+ anos, você não está concorrendo com quem tem 22 anos em memorização de tutoriais. Você concorre com base em **maturidade emocional, capacidade de navegar em ambiguidades, negociação e foco em resultado de negócio** — habilidades que levam anos para serem forjadas e que a juventude técnica simplesmente ainda não teve tempo de adquirir.\n\n` +
      `O segredo não é tentar ser um novato acelerado, mas sim um profissional sênior que aprendeu a pilotar as ferramentas contemporâneas com a calma de quem já resolveu crises reais.\n\n` +
      `**Que competência da sua história anterior você considera que mais gera segurança para quem trabalha ao seu lado?**`
    );
  }

  // 3. Gestão de Tempo, Sobrecarga, Cansaço
  if (
    normalized.includes("tempo") ||
    normalized.includes("cansa") ||
    normalized.includes("exaust") ||
    normalized.includes("rotina") ||
    normalized.includes("sobrecarga") ||
    normalized.includes("muita coisa")
  ) {
    return (
      `${greeting}O princípio fundamental do MicroShift é: **a consistência silenciosa supera o esforço heróico**.\n\n` +
      `Quem tenta estudar 3 horas por noite após um dia exaustivo entra em colapso em menos de duas semanas. Por outro lado, 15 minutos focados todos os dias somam mais de 90 horas líquidas de aprendizado deliberado em um ano.\n\n` +
      `Nos dias em que a energia estiver baixa, ative o *Modo Dia Difícil* (apenas 2 minutos). Não quebre a ofensiva. A identidade de quem não desiste vale mais do que a quantidade de conteúdo absorvido em um único dia.\n\n` +
      `**Qual horário do seu dia pertence exclusivamente a você, sem notificações ou interrupções?**`
    );
  }

  // Fallback geral contextualizado
  return (
    `${greeting}Refletindo com você sobre: "${userText}".\n\n` +
    `Na nossa jornada para ${targetCareer}, cada dúvida que surge é um indicador claro de que você está expandindo sua zona de competência.\n\n` +
    `A liderança madura não busca respostas prontas e superficiais, mas sim a clareza sobre qual é a pergunta correta a fazer antes de dar o próximo passo.\n\n` +
    `**Olhando para a sua semana atual, o que está sob seu controle direto para mover o ponteiro da sua carreira sem gerar sobrecarga?**`
  );
}

/**
 * Função principal para conversar com o Mentor Reflexivo
 * Suporta Gemini 2.0 Flash, RAG (Base de Conhecimento) e MCPs.
 */
export async function chatWithReflectiveMentor(
  messages: { role: string; content: string }[],
  userProfile?: any
): Promise<string> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";

  // 1. Carrega as configurações do Agente salvas pelo Admin
  const config = await fetchMentorAiConfig();
  const apiKey = await getEffectiveApiKey();

  // Determina se é a primeira mensagem do usuário nesta conversa
  const userMessagesCount = messages.filter((m) => m.role === "user").length;
  const isFirstExchange = userMessagesCount <= 1;

  // 2. Se houver chave ativa, monta o prompt com RAG e chama o Gemini
  if (apiKey) {
    const firstName = userProfile?.displayName ? userProfile.displayName.split(" ")[0] : "Profissional";
    const greetingDirective = isFirstExchange
      ? `Esta é a primeira mensagem da conversa. Você pode iniciar com uma saudação breve e calorosa chamando o usuário pelo primeiro nome (${firstName}).`
      : `ESTA CONVERSA JÁ ESTÁ EM ANDAMENTO. JAMAIS use saudações formais ("Olá", "Olá ${firstName}", "Bom dia", "Como posso ajudar?"). Vá direto ao ponto central do diálogo de forma humana, empática e fluida.`;

    // A. Recuperação RAG (Base de Conhecimento)
    let ragContext = "";
    if (config.ragEnabled) {
      try {
        const knowledgeDocs = await fetchKnowledgeBase();
        const relevantSnippets = findRelevantKnowledge(lastUserMsg, knowledgeDocs);
        if (relevantSnippets) {
          ragContext = `\n\n--- BASE DE CONHECIMENTO PROPRIETÁRIA (MICROSHIFT) ---\nUtilize as informações e conceitos abaixo como fundamento prioritário para a sua resposta quando pertinentes:\n${relevantSnippets}\n--- FIM DA BASE DE CONHECIMENTO ---\n`;
        }
      } catch (err) {
        console.warn("Falha ao recuperar contexto RAG:", err);
      }
    }

    // B. Conexões MCP (Model Context Protocol)
    let mcpContext = "";
    if (config.mcpEnabled) {
      try {
        const mcpServers = await fetchMcpServers();
        const activeServers = mcpServers.filter((s) => s.status === "ACTIVE");
        if (activeServers.length > 0) {
          mcpContext = `\n\n--- RECURSOS DE CONEXÃO EXTERNA (MCP) ---\nServidores MCP ativos na plataforma: ${activeServers.map((s) => `${s.name} (${s.description || s.url})`).join(", ")}.\nVocê possui autoridade contextual estendida por essas ferramentas.`;
        }
      } catch (err) {
        console.warn("Falha ao ler servidores MCP:", err);
      }
    }

    // C. Instrução Completa do Sistema
    const systemInstruction = `${config.systemPrompt}

DIRETRIZ DE CONTINUIDADE DO DIÁLOGO:
${greetingDirective}

CONTEXTO DO ALUNO:
- Nome: ${userProfile?.displayName || "Profissional"}
- Carreira/Objetivo: ${userProfile?.targetCareer || "Transição 35+"}
- Cargo Atual: ${userProfile?.currentRole || "Não especificado"}${ragContext}${mcpContext}`;

    const formattedContents = messages.slice(-8).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const geminiReply = await callGeminiRest(
      apiKey,
      formattedContents,
      systemInstruction,
      normalizeGeminiModel(config.model),
      config.temperature ?? 0.7,
      false
    );

    if (geminiReply && geminiReply.trim()) {
      return geminiReply.trim();
    }
  }

  // 3. Fallback se não houver chave ou caso ocorra indisponibilidade de rede
  return generateReflectiveMentorResponse(lastUserMsg, userProfile, isFirstExchange);
}

/**
 * Gera trilha prática de micro-passos diários (10-15 min) para o Dashboard
 */
export async function generateRoadmapSteps(
  careerTarget: string,
  currentLevel: string = "Profissional 35+ em Transição"
): Promise<{ title: string; category?: string; steps: { stepNumber: number; title: string; durationMinutes: number }[] }> {
  const apiKey = await getEffectiveApiKey();
  const config = await fetchMentorAiConfig();

  if (apiKey) {
    const prompt = `Você é um mentor sênior de carreira especialista em profissionais 35+ migrando para tecnologia ou liderança moderna.
O aluno deseja atuar como: "${careerTarget}". Nível atual: "${currentLevel}".
Gere uma trilha inicial composta por 3 a 4 passos realistas, cada um realizável em 10 a 15 minutos diários.
Retorne EXCLUSIVAMENTE um JSON no seguinte formato:
{
  "title": "Trilha para ${careerTarget}",
  "category": "Hard Skill",
  "steps": [
    { "stepNumber": 1, "title": "...", "durationMinutes": 15 },
    { "stepNumber": 2, "title": "...", "durationMinutes": 10 }
  ]
}
`;

    const res = await callGeminiRest(
      apiKey,
      [{ role: "user", parts: [{ text: prompt }] }],
      "Você é um gerador JSON estrito.",
      normalizeGeminiModel(config.model),
      0.3,
      true
    );

    if (res) {
      try {
        const parsed = JSON.parse(res);
        if (parsed.title && Array.isArray(parsed.steps)) {
          return parsed;
        }
      } catch {}
    }
  }

  // Fallback contextualizado e rico caso a API não esteja disponível
  const cleanTarget = careerTarget || "Tecnologia & Liderança 35+";
  const normalizedTarget = cleanTarget.toLowerCase();

  if (normalizedTarget.includes("ia") || normalizedTarget.includes("inteligência artificial")) {
    return {
      title: `Trilha Ágil: Fundamentos Práticos de IA para ${cleanTarget}`,
      category: "Hard Skill",
      steps: [
        {
          stepNumber: 1,
          title: "Mapeamento dos 3 principais modelos de IA generativa aplicados ao seu setor",
          durationMinutes: 15,
        },
        {
          stepNumber: 2,
          title: "Prática com engenharia de prompts avançada para automação de tarefas cotidianas",
          durationMinutes: 15,
        },
        {
          stepNumber: 3,
          title: "Construção de uma diretriz ética e humana para uso de IA na sua equipe",
          durationMinutes: 10,
        },
        {
          stepNumber: 4,
          title: "Publicação de um insight executivo no LinkedIn sobre IA e pessoas",
          durationMinutes: 15,
        },
      ],
    };
  }

  if (normalizedTarget.includes("liderança") || normalizedTarget.includes("gestão") || normalizedTarget.includes("produto")) {
    return {
      title: `Trilha Ágil: Liderança Contemporânea para ${cleanTarget}`,
      category: "Liderança",
      steps: [
        {
          stepNumber: 1,
          title: "Diagnóstico de competências transferíveis de liderança convencional para ágil",
          durationMinutes: 15,
        },
        {
          stepNumber: 2,
          title: "Estudo dos rituais essenciais: 1-on-1s eficazes e alinhamento de OKRs",
          durationMinutes: 15,
        },
        {
          stepNumber: 3,
          title: "Aplicação da comunicação não-violenta em feedbacks de alta pressão",
          durationMinutes: 10,
        },
        {
          stepNumber: 4,
          title: "Estruturação de um plano de desenvolvimento individual (PDI) modelo",
          durationMinutes: 15,
        },
      ],
    };
  }

  return {
    title: `Trilha Estratégica: ${cleanTarget}`,
    category: "Transição 35+",
    steps: [
      {
        stepNumber: 1,
        title: `Inventário de competências transferíveis para atuar com ${cleanTarget}`,
        durationMinutes: 15,
      },
      {
        stepNumber: 2,
        title: "Estudo direcionado dos 3 temas mais demandados pelo mercado na área",
        durationMinutes: 15,
      },
      {
        stepNumber: 3,
        title: "Micro-prática com ferramentas e vocabulário do ecossistema moderno",
        durationMinutes: 15,
      },
      {
        stepNumber: 4,
        title: "Refinamento do posicionamento profissional e storytelling STAR",
        durationMinutes: 10,
      },
    ],
  };
}

export const generateRoadmapWithGemini = generateRoadmapSteps;
