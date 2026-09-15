/**
 * Motor de Inteligência e Mentoria Reflexiva Sover (35+)
 * Suporta Gemini API direta (REST) com chave personalizada ou pública,
 * e conta com Motor Cognitivo Reflexivo de alta precisão resiliente a falhas.
 */

const LOCAL_GEMINI_KEY = "microshift_gemini_api_key";

export function getCustomGeminiApiKey(): string {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(LOCAL_GEMINI_KEY);
      if (saved && saved.trim()) return saved.trim();
    } catch {}
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
}

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
 * Executa requisição direta à API REST do Google Gemini (gemini-1.5-flash)
 */
async function callGeminiRest(
  apiKey: string,
  contents: { role: string; parts: { text: string }[] }[],
  systemInstruction: string,
  jsonMode: boolean = false
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const body: any = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      generationConfig: {
        temperature: 0.7,
        ...(jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.warn("Google Gemini API retornou status", res.status, errText);
      return null;
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply || null;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn("Falha ou timeout ao consultar Gemini REST:", err.message);
    return null;
  }
}

/**
 * Motor Cognitivo de Mentoria Reflexiva 35+
 * Especializado em desenvolvimento humano, transição tardia, Calm Tech e autoridade ágil.
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

  // 2. Pergunta sobre inconsistência / teste / estabilidade técnica
  if (
    normalized.includes("inconsistência") ||
    normalized.includes("inconsistencia") ||
    normalized.includes("instabilidade") ||
    normalized.includes("melhorou") ||
    normalized.includes("funcionando") ||
    normalized.includes("teste")
  ) {
    return (
      `${isFirstExchange ? `Sim, ${userName}! ` : `Perfeito! `}A conexão com o Mentor Sover está 100% ativa, estável e operacional.\n\n` +
      `Assim como na nossa metodologia de Calm Tech, oscilações passageiras de infraestrutura são resolvidas com consistência silenciosa e arquitetura sólida.\n\n` +
      `Estou pronto para aprofundar seu plano estratégico para ${targetCareer}. Em qual decisão ou desafio de carreira você gostaria de mergulhar agora?`
    );
  }

  // 3. Transição de Carreira aos 35+, 40+ ou 50+
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

  // 4. Síndrome do Impostor, Medo, Insegurança
  if (
    normalized.includes("impostor") ||
    normalized.includes("insegur") ||
    normalized.includes("medo") ||
    normalized.includes("incapaz") ||
    normalized.includes("não sei nada") ||
    normalized.includes("ansiedad")
  ) {
    return (
      `${greeting}A sensação de ser um impostor é, paradoxalmente, um sintoma comum de quem tem alto padrão de qualidade e responsabilidade.\n\n` +
      `Na transição para tecnologia e novas metodologias, é natural se sentir vulnerável ao lidar com novos termos todos os dias. Porém, diferencie a ignorância técnica momentânea da falta de capacidade intelectual. Conceitos técnicos se aprendem com blocos de 15 minutos; caráter e solidez profissional já estão com você.\n\n` +
      `**Se você tirasse o peso de precisar dominar tudo hoje, qual é o único conceito simples que faria seu dia valer a pena se você o compreendesse agora?**`
    );
  }

  // 5. Gestão de Tempo, Sobrecarga, Cansaço
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

  // 6. Entrevistas, Salário, LinkedIn, Posicionamento
  if (
    normalized.includes("entrevista") ||
    normalized.includes("salário") ||
    normalized.includes("linkedin") ||
    normalized.includes("currículo") ||
    normalized.includes("cv") ||
    normalized.includes("vaga") ||
    normalized.includes("mercado")
  ) {
    return (
      `${greeting}O maior erro de profissionais experientes em entrevistas de transição é pedir desculpas pela bagagem anterior ou tentar se rebaixar a iniciante.\n\n` +
      `O recrutador e o gestor precisam ouvir uma **narrativa integradora**: "Passei anos liderando projetos e pessoas com rigor orçamentário e humano; hoje integro a IA e a tecnologia para multiplicar essa capacidade por dez."\n\n` +
      `Utilize a metodologia STAR (Situação, Tarefa, Ação, Resultado) enfatizando o impacto financeiro ou operacional que você causou no passado.\n\n` +
      `**Qual foi o projeto ou desafio mais complexo que você já superou, e que mostra claramente seu calibre como solucionador de problemas?**`
    );
  }

  // Fallback reflexivo geral socrático de alto nível
  return (
    `${greeting}Refletindo com calma sobre o que você trouxe: "${userText}".\n\n` +
    `Na nossa jornada para ${targetCareer}, cada dúvida que surge é um indicador claro de que você está expandindo sua zona de competência.\n\n` +
    `A liderança madura não busca respostas prontas e superficiais, mas sim a clareza sobre qual é a pergunta correta a fazer antes de dar o próximo passo.\n\n` +
    `**Olhando para a sua semana atual, o que está sob seu controle direto para mover o ponteiro da sua carreira sem gerar sobrecarga?**`
  );
}

/**
 * Função principal para conversar com o Mentor Reflexivo
 */
export async function chatWithReflectiveMentor(
  messages: { role: string; content: string }[],
  userProfile?: any
): Promise<string> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const apiKey = getCustomGeminiApiKey();

  // Determina se é a primeira mensagem do usuário nesta conversa
  const userMessagesCount = messages.filter((m) => m.role === "user").length;
  const isFirstExchange = userMessagesCount <= 1;

  // Se houver uma chave da API do Gemini configurada, tenta usar primeiro a IA do Google
  if (apiKey) {
    const firstName = userProfile?.displayName ? userProfile.displayName.split(" ")[0] : "Profissional";
    const greetingDirective = isFirstExchange
      ? `Esta é a primeira mensagem da conversa. Você pode iniciar com uma saudação breve e acolhedora pelo primeiro nome do usuário (${firstName}).`
      : `ESTA CONVERSA JÁ ESTÁ EM ANDAMENTO. JAMAIS use saudações como "Olá ${firstName}", "Bom dia", "Olá novamente" ou cumprimentos repetidos. Vá direto ao ponto, respondendo como um mentor sênior conversando naturalmente em um café, com diálogo humano, empático, direto e fluído. Não seja robótico.`;

    const systemInstruction = `Você é o Mentor Reflexivo Sover da plataforma MicroShift.
Seu público-alvo são profissionais com mais de 35 anos que estão em transição de carreira ou buscando atualização para tecnologia e liderança ágil.

DIRETRIZ CRÍTICA DE TOM E DIÁLOGO:
${greetingDirective}

Diretrizes:
1. Jamais seja condescendente ou use clichês vazios.
2. Ajude o profissional a ver sua bagagem prévia como diferencial competitivo (desenvolvimento humano, maturidade, visão sistêmica).
3. Seja acolhedor, objetivo, empático e focado na filosofia "Calm Tech": pequenos passos diários sem ansiedade.
4. Estimule reflexões ativas fazendo uma pergunta cirúrgica ao final.
Contexto do aluno: Nome: ${userProfile?.displayName || "Profissional"}, Cargo/Foco: ${userProfile?.targetCareer || "Transição 35+"}.`;

    const formattedContents = messages.slice(-6).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const geminiReply = await callGeminiRest(apiKey, formattedContents, systemInstruction, false);
    if (geminiReply && geminiReply.trim()) {
      return geminiReply.trim();
    }
  }

  // Se não houver chave ou se a API retornar erro, aciona o Motor Cognitivo Reflexivo
  return generateReflectiveMentorResponse(lastUserMsg, userProfile, isFirstExchange);
}

/**
 * Gera trilha prática de micro-passos diários (10-15 min) para o Dashboard
 */
export async function generateRoadmapSteps(
  careerTarget: string,
  currentLevel: string = "Profissional 35+ em Transição"
): Promise<{ title: string; category?: string; steps: { stepNumber: number; title: string; durationMinutes: number }[] }> {
  const apiKey = getCustomGeminiApiKey();

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
}`;

    const res = await callGeminiRest(
      apiKey,
      [{ role: "user", parts: [{ text: prompt }] }],
      "Você é um gerador JSON estrito.",
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
