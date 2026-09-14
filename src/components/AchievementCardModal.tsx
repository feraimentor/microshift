"use client";

import React, { useRef, useEffect, useState } from "react";
import { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download, Copy, Check, Sparkles, Share2 } from "lucide-react";

interface AchievementCardModalProps {
  profile: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementCardModal({
  profile,
  isOpen,
  onClose,
}: AchievementCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !profile || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resolução HD 1200x630 (padrão Open Graph / LinkedIn)
    canvas.width = 1200;
    canvas.height = 630;

    // Fundo degradê escuro sofisticado
    const bgGradient = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGradient.addColorStop(0, "#020617"); // slate-950
    bgGradient.addColorStop(0.5, "#0f172a"); // slate-900
    bgGradient.addColorStop(1, "#020617");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Efeito de luz ambiente sutil
    const glowGradient = ctx.createRadialGradient(200, 150, 50, 200, 150, 450);
    glowGradient.addColorStop(0, "rgba(14, 165, 233, 0.15)"); // sky-500
    glowGradient.addColorStop(1, "rgba(14, 165, 233, 0)");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Borda exterior delicada
    ctx.strokeStyle = "rgba(51, 65, 85, 0.6)"; // slate-700
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1140, 570);

    // Header: Marca MicroShift
    ctx.fillStyle = "#f8fafc"; // slate-50
    ctx.font = "bold 38px Inter, sans-serif";
    ctx.fillText("Micro", 80, 100);
    ctx.fillStyle = "#38bdf8"; // sky-400
    ctx.fillText("Shift", 185, 100);

    ctx.font = "500 18px Inter, sans-serif";
    ctx.fillStyle = "#94a3b8"; // slate-400
    ctx.fillText("CONSISTÊNCIA CALM TECH • TRANSIÇÃO SÊNIOR", 80, 135);

    // Linha divisória
    ctx.strokeStyle = "#1e293b"; // slate-800
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 160);
    ctx.lineTo(1120, 160);
    ctx.stroke();

    // Nome do Profissional
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 52px Inter, sans-serif";
    ctx.fillText(profile.displayName || "Profissional Sênior", 80, 240);

    // Tag do Plano
    const planText = profile.status === "ACTIVE_VIP" ? "PLANO SOVER VITALÍCIO VIP" : `PLANO ${profile.plan}`;
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillText(planText, 80, 280);

    // Bloco da Ofensiva / Streak
    const streakBoxX = 80;
    const streakBoxY = 320;
    ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 2;
    ctx.roundRect(streakBoxX, streakBoxY, 320, 150, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fbbf24"; // amber-400
    ctx.font = "bold 64px Inter, sans-serif";
    ctx.fillText(`${profile.streak || 1} 🔥`, streakBoxX + 30, streakBoxY + 85);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "500 20px Inter, sans-serif";
    ctx.fillText("Dias de Foco Ininterruptos", streakBoxX + 30, streakBoxY + 125);

    // Bloco Filosofia dos 15 minutos
    const quoteBoxX = 440;
    const quoteBoxY = 320;
    ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
    ctx.strokeStyle = "rgba(51, 65, 85, 0.8)";
    ctx.lineWidth = 2;
    ctx.roundRect(quoteBoxX, quoteBoxY, 680, 150, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillText("«Pequenos passos diários de 15 minutos superam o esgotamento.»", quoteBoxX + 30, quoteBoxY + 60);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "400 18px Inter, sans-serif";
    ctx.fillText("Mapeamento contínuo de competências sênior, blindagem cognitiva", quoteBoxX + 30, quoteBoxY + 95);
    ctx.fillText("e aprendizado livre de ruído algorítmico.", quoteBoxX + 30, quoteBoxY + 122);

    // Rodapé de Validação
    ctx.fillStyle = "#64748b";
    ctx.font = "400 16px Inter, sans-serif";
    const dateFormatted = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    ctx.fillText(`Emitido em ${dateFormatted} via MicroShift Platform`, 80, 550);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText("microshift.pages.dev", 1000, 550);
  }, [isOpen, profile]);

  const handleDownloadImage = () => {
    if (!canvasRef.current || !profile) return;
    const url = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    const safeName = profile.displayName ? profile.displayName.toLowerCase().replace(/\s+/g, "-") : "aluno";
    link.download = `microshift-conquista-${safeName}.png`;
    link.href = url;
    link.click();
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } catch (err) {
      console.error("Falha ao copiar imagem:", err);
    }
  };

  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <Card className="w-full max-w-3xl bg-slate-900 border-slate-800 shadow-2xl p-6 relative flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 text-sky-400 mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Card de Conquistas 1200x630</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100">Compartilhe sua Consistência</h3>
          <p className="text-xs text-slate-400">
            Formato pronto para publicação no LinkedIn, WhatsApp ou Instagram.
          </p>
        </div>

        {/* Canvas de alta resolução exibido em preview responsivo */}
        <div className="w-full rounded-xl overflow-hidden border border-slate-800 shadow-lg mb-6 bg-slate-950 flex justify-center">
          <canvas ref={canvasRef} className="w-full h-auto max-h-[340px] object-contain" />
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <Button
            onClick={handleDownloadImage}
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold"
          >
            <Download className="w-4 h-4 mr-2" /> Baixar Imagem (PNG)
          </Button>

          <Button
            variant="outline"
            onClick={handleCopyImage}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-emerald-400" /> Copiado para a Área de Transferência!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" /> Copiar Imagem
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
