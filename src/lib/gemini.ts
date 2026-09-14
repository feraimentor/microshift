import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

export async function generateRoadmapSteps(
  careerTarget: string,
  currentLevel: string = "Pleno / Transição"
): Promise<{ title: string; steps: { stepNumber: number; title: string; durationMinutes: number }[] }> {
  if (!aiClient) {
    // Fallback inteligente caso a chave do Gemini ainda não tenha sido adicionada
    return {
      title: `Trilha Ágil: ${careerTarget}`,
      steps: [
        {
          stepNumber: 1,
          title: `Diagnóstico de competências transferíveis para ${careerTarget}`,
          durationMinutes: 10,
        },
        {
          stepNumber: 2,
          title: "Estudo dos 3 pilares mais cobrados em entrevistas técnicas seniores",
          durationMinutes: 15,
        },
        {
          stepNumber: 3,
          title: "Prática com ferramenta essencial do ecossistema",
          durationMinutes: 15,
        },
        {
          stepNumber: 4,
          title: "Refinamento do posicionamento no LinkedIn e narrativas STAR",
          durationMinutes: 10,
        },
      ],
    };
  }

  try {
    const prompt = `Você é um mentor sênior de carreira especialista em profissionais 35+ migrando para tecnologia ou liderança moderna.
O aluno deseja atuar como: "${careerTarget}". Nível atual: "${currentLevel}".
Gere uma trilha inicial composta por 3 a 5 passos realistas, cada um realizável em 10 a 15 minutos diários.
Retorne EXCLUSIVAMENTE um JSON no seguinte formato:
{
  "title": "Trilha para ${careerTarget}",
  "steps": [
    { "stepNumber": 1, "title": "...", "durationMinutes": 15 },
    { "stepNumber": 2, "title": "...", "durationMinutes": 10 }
  ]
}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    return JSON.parse(text);
  } catch (error) {
    console.error("Erro na API Gemini (Roadmap):", error);
    return {
      title: `Trilha de Foco: ${careerTarget}`,
      steps: [
        {
          stepNumber: 1,
          title: `Mapeamento de gaps técnicos e conceituais para ${careerTarget}`,
          durationMinutes: 10,
        },
        {
          stepNumber: 2,
          title: "Estudo direcionado de arquitetura e melhores práticas",
          durationMinutes: 15,
        },
        {
          stepNumber: 3,
          title: "Construção de mini-case para portfólio prático",
          durationMinutes: 15,
        },
      ],
    };
  }
}

export async function chatWithReflectiveMentor(
  messages: { role: string; content: string }[],
  userProfile?: any
): Promise<string> {
  const lastMessage = messages[messages.length - 1]?.content || "";

  if (!aiClient) {
    return (
      "Como seu mentor sênior reflexivo, compreendo a complexidade da sua jornada aos 35+ anos. " +
      "Lembre-se: sua bagagem profissional de anos anteriores não é descartável; ela é seu principal diferencial estratégico em comunicação, estabilidade emocional e visão de negócio. " +
      "Qual é o menor passo prático que você pode dar hoje para destravar sua próxima vitória?"
    );
  }

  try {
    const systemInstruction = `Você é o Mentor Reflexivo Sover da plataforma MicroShift.
Seu público-alvo são profissionais com mais de 35 anos que estão em transição de carreira ou buscando atualização para tecnologia e liderança ágil.
Suas diretrizes:
1. Jamais fale de forma condescendente ou use jargões vazios.
2. Ajude o profissional a enxergar suas habilidades prévias como diferenciais competitivos (maturidade, inteligência emocional, foco em resultado).
3. Seja acolhedor, objetivo, empático e focado na filosofia "Calm Tech": pequenos passos diários sem ansiedade ou sobrecarga.
4. Estimule reflexões ativas fazendo perguntas cirúrgicas ao final.
Contexto do aluno: Nome: ${userProfile?.displayName || "Profissional"}, Plano: ${userProfile?.plan || "SOVER"}, Ofensiva atual: ${userProfile?.streak || 0} dias.`;

    const contents = messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Continue focado nos seus micro-passos diários.";
  } catch (error) {
    console.error("Erro na API Gemini (Mentor):", error);
    return "Estou analisando seu cenário sob a ótica dos profissionais seniores. Pequenas vitórias consistentes superam qualquer esforço desmedido de um único dia. Como você se sente em relação a avançar um bloco de 15 minutos hoje?";
  }
}

export const generateRoadmapWithGemini = generateRoadmapSteps;
