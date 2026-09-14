import { NextResponse } from "next/server";
import { chatWithReflectiveMentor } from "@/lib/gemini";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, userProfile } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "O histórico de mensagens é obrigatório." },
        { status: 400 }
      );
    }

    const reply = await chatWithReflectiveMentor(messages, userProfile);
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Erro na rota /api/mentor:", error);
    return NextResponse.json(
      { error: "Falha ao processar reflexão com o Mentor Gemini." },
      { status: 500 }
    );
  }
}
