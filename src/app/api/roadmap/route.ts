import { NextResponse } from "next/server";
import { generateRoadmapWithGemini } from "@/lib/gemini";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetCareer, currentRole } = body;

    if (!targetCareer) {
      return NextResponse.json(
        { error: "A carreira alvo é obrigatória para gerar o roteiro." },
        { status: 400 }
      );
    }

    const roadmap = await generateRoadmapWithGemini(targetCareer, currentRole);
    return NextResponse.json(roadmap);
  } catch (error: any) {
    console.error("Erro na rota /api/roadmap:", error);
    return NextResponse.json(
      { error: "Falha interna ao gerar roteiro com Gemini." },
      { status: 500 }
    );
  }
}
