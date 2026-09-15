"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Key,
  Check,
  X,
} from "lucide-react";
import {
  chatWithReflectiveMentor,
  getCustomGeminiApiKey,
  setCustomGeminiApiKey,
  hasCustomGeminiApiKey,
} from "@/lib/gemini";

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
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push("/login");
    }
  }, [authLoading, profile, router]);

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
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [keySavedFeedback, setKeySavedFeedback] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasApiKey(hasCustomGeminiApiKey());
    setApiKeyInput(getCustomGeminiApiKey());
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomGeminiApiKey(apiKeyInput.trim());
    setHasApiKey(hasCustomGeminiApiKey());
    setKeySavedFeedback(true);
    setTimeout(() => {
      setKeySavedFeedback(false);
      setIsKeyModalOpen(false);
    }, 1200);
  };

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
      const reply = await chatWithReflectiveMentor(newHistory, profile);
      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: "model",
        content: reply,
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      console.error("Erro ao consultar mentor:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "model",
          content: "Compreendo profundamente seu momento. A consistência silenciosa em pequenos blocos de 15 minutos é o que constrói a transição real. Qual é o menor passo que podemos dar hoje?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <Brain className="w-10 h-10 text-sky-400 mb-4 animate-pulse" />
        <p className="text-sm text-slate-400">Conectando ao Mentor Sover...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

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
                {hasApiKey ? "Gemini 1.5 Flash Ativo" : "Mentor Cognitivo 35+"}
              </span>
            </div>
            <p className="text-xs text-calm-muted">
              Orientação executiva silenciosa • Neurociência aplicada a 35+
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsKeyModalOpen(true)}
            className="text-xs text-calm-muted hover:text-amber-400 gap-1.5 border border-calm-border/60 hover:border-amber-500/40"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chave Gemini</span>
          </Button>
          <Badge variant="plan" plan="SOVER" planStatus="ACTIVE_VIP" />
        </div>
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

      {/* Modal de Configuração de Chave Gemini */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-calm-card border border-calm-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Key className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-calm-text">Chave da API Gemini</h2>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-calm-muted hover:text-calm-text p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-calm-muted leading-relaxed">
              O Mentor Sover possui um motor cognitivo reflexivo integrado. Se desejar conectar sua própria chave do Google Gemini para respostas generativas em tempo real, você pode obtê-la gratuitamente no{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 underline hover:text-amber-300"
              >
                Google AI Studio
              </a>{" "}
              e salvá-la abaixo. A chave fica guardada apenas no seu navegador.
            </p>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-calm-muted mb-1.5">
                  Chave de API do Gemini (AIza...)
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-calm-bg border border-calm-border text-calm-text focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {keySavedFeedback && (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Chave atualizada com sucesso!
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                {hasApiKey && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    onClick={() => {
                      setCustomGeminiApiKey("");
                      setApiKeyInput("");
                      setHasApiKey(false);
                      setIsKeyModalOpen(false);
                    }}
                  >
                    Remover
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-calm-muted"
                  onClick={() => setIsKeyModalOpen(false)}
                >
                  Fechar
                </Button>
                <Button type="submit" size="sm" variant="gold" className="text-xs">
                  Salvar Chave
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
