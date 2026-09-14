"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Sparkles,
  Send,
  Lock,
  Compass,
  ArrowRight,
  ShieldAlert,
  User,
  Ticket,
  HelpCircle,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
}

const QUICK_PROMPTS = [
  "Como traduzir 15 anos de liderança tradicional para gestão ágil de tecnologia?",
  "Síndrome do impostor: sinto que os jovens aprendem mais rápido que eu aos 38 anos.",
  "Simule uma resposta executiva sobre por que estou mudando de área após os 40.",
  "Como blindar minha rotina de 15 minutos sem me culpar nos dias exaustivos?",
];

export default function MentorPage() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      content: `Olá, ${profile?.displayName || "Profissional"}. Eu sou o seu Mentor Reflexivo no MicroShift.
Minha missão é ajudá-lo a transicionar de carreira com clareza executiva, sem ansiedade e valorizando cada ano da sua bagagem anterior. 

Em que desafio ou decisão estratégica de carreira você gostaria de focar hoje?`,
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const isSoverPlan =
    profile?.plan === "SOVER" || profile?.role === "SUPER_ADMIN" || profile?.planStatus === "ACTIVE_VIP";

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          userProfile: {
            displayName: profile?.displayName,
            headline: profile?.headline,
            targetCareer: profile?.targetCareer,
          },
        }),
      });

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: "model",
        content: data.reply || "Refletindo sobre sua colocação...",
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      console.error("Erro ao consultar mentor:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "model",
          content: "Tive um momento de instabilidade na conexão, mas lembre-se: a consistência silenciosa supera qualquer obstáculo técnico. Tente novamente em instantes.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Se o usuário não tiver o plano Sover, exibe tela de upgrade amigável
  if (!isSoverPlan) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
          <Brain className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Recurso Exclusivo Plano Sover
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-calm-text mt-4">
            Mentor Reflexivo com Inteligência Artificial
          </h1>
          <p className="text-sm text-calm-muted max-w-xl mx-auto mt-2 leading-relaxed">
            Uma IA sênior ajustada pelo Google Gemini 2.5 Flash para simular cenários executivos,
            blindar sua mente contra a síndrome do impostor e traduzir sua experiência anterior para o novo mercado.
          </p>
        </div>

        <Card className="max-w-lg mx-auto text-left border-amber-500/30 p-6 space-y-4">
          <CardTitle className="text-base text-amber-300">O que está incluso no Sover:</CardTitle>
          <ul className="space-y-2.5 text-xs text-calm-muted">
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Simulação de perguntas e respostas para entrevistas de transição</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Desconstrução de crenças limitantes sobre idade e velocidade de aprendizado</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Resumo Executivo Semanal de Evolução gerado aos domingos</span>
            </li>
          </ul>

          <div className="pt-4 border-t border-calm-border/80 flex flex-col gap-2.5">
            <Link href="/perfil" className="w-full">
              <Button variant="gold" className="w-full text-xs">
                <Ticket className="w-3.5 h-3.5 mr-1.5" />
                Resgatar Cupom de Degustação (Ex: SOVER90)
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full">
              <Button variant="ghost" className="w-full text-xs text-calm-muted">
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col h-[calc(100vh-8rem)]">
      {/* Cabeçalho do Chat */}
      <div className="flex items-center justify-between border-b border-calm-border pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-calm-text">Mentor Reflexivo IA</h1>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-calm-muted">
              Orientação executiva silenciosa • Neurociência aplicada a 35+
            </p>
          </div>
        </div>

        <Badge variant="plan" plan="SOVER" planStatus="ACTIVE_VIP" />
      </div>

      {/* Sugestões Rápidas de Ativação */}
      <div className="mb-4 overflow-x-auto pb-1 flex items-center gap-2">
        <span className="text-[10px] uppercase font-bold text-calm-muted shrink-0">Tópicos:</span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1 rounded-full bg-calm-card hover:bg-calm-cardHover text-[11px] text-calm-muted hover:text-calm-text border border-calm-border shrink-0 transition"
          >
            {prompt.length > 40 ? prompt.substring(0, 40) + "..." : prompt}
          </button>
        ))}
      </div>

      {/* Caixa de Mensagens */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-1">
                  <Brain className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? "bg-calm-accent text-calm-bg font-medium rounded-tr-none"
                    : "bg-calm-card border border-calm-border text-calm-text rounded-tl-none whitespace-pre-wrap"
                }`}
              >
                {msg.content}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-calm-surface border border-calm-border flex items-center justify-center text-xs font-bold text-calm-accent shrink-0 mt-1">
                  {profile?.displayName?.slice(0, 2).toUpperCase() || "EU"}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-calm-card border border-calm-border text-xs text-calm-muted animate-pulse">
              Refletindo estrategicamente com base na sua experiência...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Formulário de Envio */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 p-2 rounded-2xl bg-calm-card border border-calm-border shadow-calm-card"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Compartilhe um dilema de transição, dúvida de entrevista ou receio..."
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-transparent text-calm-text placeholder-calm-muted/50 focus:outline-none"
        />

        <Button type="submit" size="sm" disabled={!inputMessage.trim() || loading} className="gap-1.5">
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refletir</span>
        </Button>
      </form>
    </div>
  );
}
