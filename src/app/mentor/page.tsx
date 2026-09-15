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
  Plus,
  Trash2,
  MessageSquare,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
  Sliders,
} from "lucide-react";
import {
  chatWithReflectiveMentor,
  getCustomGeminiApiKey,
  setCustomGeminiApiKey,
  hasCustomGeminiApiKey,
  getEffectiveApiKey,
} from "@/lib/gemini";
import { fetchMentorAiConfig } from "@/lib/mentor-config";
import {
  getUserMentorSessions,
  createMentorSession,
  saveMentorSession,
  deleteMentorSession,
  generateSessionTitleFromMessage,
} from "@/lib/mentor-sessions";
import { MentorChatMessage, MentorChatSession } from "@/types";

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

  // Estados de Histórico de Conversas (Sessions)
  const [sessions, setSessions] = useState<MentorChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Estados de Chat e Entrada
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estados do Modal da Chave Gemini e Status do Agente
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasEffectiveKey, setHasEffectiveKey] = useState(false);
  const [activeModel, setActiveModel] = useState("gemini-2.0-flash");
  const [isRagActive, setIsRagActive] = useState(true);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [keySavedFeedback, setKeySavedFeedback] = useState(false);

  // Carrega sessões salvas do usuário ao iniciar
  useEffect(() => {
    if (profile?.uid) {
      const userSessions = getUserMentorSessions(profile.uid, profile.displayName);
      setSessions(userSessions);
      if (userSessions.length > 0) {
        setActiveSessionId(userSessions[0].id);
      }
    }
  }, [profile?.uid, profile?.displayName]);

  // Carrega status da IA, modelo ativo e chaves
  useEffect(() => {
    async function loadAgentStatus() {
      try {
        const config = await fetchMentorAiConfig();
        setActiveModel(config.model || "gemini-2.0-flash");
        setIsRagActive(config.ragEnabled);
        const effKey = await getEffectiveApiKey();
        setHasEffectiveKey(Boolean(effKey));
      } catch {}
    }
    loadAgentStatus();
    setHasApiKey(hasCustomGeminiApiKey());
    setApiKeyInput(getCustomGeminiApiKey());
  }, []);

  // Sessão atual selecionada
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  // Auto scroll para a última mensagem da conversa ativa
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const isSoverPlan =
    profile?.plan === "SOVER" || profile?.role === "SUPER_ADMIN" || profile?.planStatus === "ACTIVE_VIP";

  // Criação de Nova Conversa
  const handleNewSession = () => {
    if (!profile?.uid) return;
    const newSession = createMentorSession(profile.uid, profile.displayName, "Nova Reflexão");
    const updated = getUserMentorSessions(profile.uid, profile.displayName);
    setSessions(updated);
    setActiveSessionId(newSession.id);
    setInputMessage("");
  };

  // Exclusão de Conversa
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile?.uid) return;
    const remaining = deleteMentorSession(profile.uid, sessionId, profile.displayName);
    setSessions(remaining);
    if (activeSessionId === sessionId && remaining.length > 0) {
      setActiveSessionId(remaining[0].id);
    }
  };

  // Envio de Mensagem
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading || !profile?.uid || !activeSession) return;

    const userMsg: MentorChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    // Gera título automático na primeira pergunta se o título ainda for genérico
    let sessionTitle = activeSession.title;
    const isFirstUserMessage = activeSession.messages.filter((m) => m.role === "user").length === 0;
    if (isFirstUserMessage || sessionTitle === "Nova Reflexão" || sessionTitle === "Primeira Reflexão") {
      sessionTitle = generateSessionTitleFromMessage(userMsg.content);
    }

    const updatedMessages = [...activeSession.messages, userMsg];
    const updatedSession: MentorChatSession = {
      ...activeSession,
      title: sessionTitle,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    // Atualiza imediatamente na memória e cache local
    saveMentorSession(profile.uid, updatedSession);
    setSessions(getUserMentorSessions(profile.uid, profile.displayName));
    setInputMessage("");
    setLoading(true);

    try {
      const reply = await chatWithReflectiveMentor(updatedMessages, profile);
      const modelMsg: MentorChatMessage = {
        id: `model-${Date.now()}`,
        role: "model",
        content: reply,
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, modelMsg];
      const finalSession: MentorChatSession = {
        ...updatedSession,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      };

      saveMentorSession(profile.uid, finalSession);
      setSessions(getUserMentorSessions(profile.uid, profile.displayName));
    } catch (err) {
      console.error("Erro ao consultar mentor:", err);
      const errorMsg: MentorChatMessage = {
        id: `err-${Date.now()}`,
        role: "model",
        content: "Compreendo profundamente seu momento. A consistência silenciosa em pequenos blocos de 15 minutos é o que constrói a transição real. Qual é o menor passo que podemos focar hoje?",
        createdAt: new Date().toISOString(),
      };
      const fallbackMessages = [...updatedMessages, errorMsg];
      const fallbackSession = {
        ...updatedSession,
        messages: fallbackMessages,
        updatedAt: new Date().toISOString(),
      };
      saveMentorSession(profile.uid, fallbackSession);
      setSessions(getUserMentorSessions(profile.uid, profile.displayName));
    } finally {
      setLoading(false);
    }
  };

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
            Uma IA sênior ajustada para simular cenários executivos,
            blindar sua mente contra a síndrome do impostor e traduzir sua experiência anterior para o novo mercado.
          </p>
        </div>

        <Card className="max-w-lg mx-auto text-left border-amber-500/30 p-6 space-y-4">
          <CardTitle className="text-base text-amber-300">O que está incluso no Sover:</CardTitle>
          <ul className="space-y-2.5 text-xs text-calm-muted">
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Histórico de conversas com salvamento contínuo das reflexões</span>
            </li>
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
    <div className="flex h-[calc(100vh-4.5rem)] w-full overflow-hidden bg-calm-bg text-calm-text">
      {/* Barra Lateral: Histórico de Conversas (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 flex flex-col w-72 bg-calm-card/95 backdrop-blur-md md:bg-calm-card border-r border-calm-border transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:hidden"
        }`}
      >
        {/* Cabeçalho da Barra Lateral */}
        <div className="p-4 border-b border-calm-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-calm-text font-semibold text-sm">
            <History className="w-4 h-4 text-amber-400" />
            <span>Histórico de Conversas</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 text-calm-muted hover:text-calm-text rounded-lg"
            title="Fechar histórico"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Botão de Nova Conversa */}
        <div className="p-3">
          <Button
            onClick={handleNewSession}
            variant="gold"
            className="w-full justify-center gap-2 text-xs font-semibold py-2.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conversa</span>
          </Button>
        </div>

        {/* Lista de Sessões Anteriores */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2">
          {sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() => {
                  setActiveSessionId(s.id);
                  if (window.innerWidth < 768) {
                    setIsSidebarOpen(false);
                  }
                }}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition border ${
                  isActive
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-medium"
                    : "bg-transparent border-transparent hover:bg-calm-surface/60 text-calm-muted hover:text-calm-text"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-amber-400" : "text-calm-muted/70"}`} />
                  <span className="truncate">{s.title}</span>
                </div>

                <button
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  title="Excluir conversa"
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-calm-muted p-1 rounded transition shrink-0 ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {sessions.length === 0 && (
            <p className="text-center text-xs text-calm-muted/60 py-6">Nenhuma conversa salva ainda.</p>
          )}
        </div>

        {/* Rodapé da Barra Lateral com Perfil */}
        <div className="p-3 border-t border-calm-border flex items-center justify-between text-xs text-calm-muted">
          <span className="truncate max-w-[140px]">{profile?.displayName}</span>
          <Badge variant="plan" plan="SOVER" planStatus="ACTIVE_VIP" />
        </div>
      </aside>

      {/* Overlay mobile para fechar sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Área Principal de Mensagens */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Cabeçalho Superior do Chat */}
        <div className="flex items-center justify-between border-b border-calm-border px-4 py-3 bg-calm-card/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            {/* Botão de Alternar Sidebar */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg border border-calm-border hover:bg-calm-surface text-calm-muted hover:text-calm-text transition"
              title={isSidebarOpen ? "Recolher histórico" : "Ver histórico de conversas"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Brain className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-calm-text truncate">
                  {activeSession?.title || "Mentor Reflexivo Sover"}
                </h1>
                <p className="text-[11px] text-calm-muted hidden sm:block">
                  Orientação executiva silenciosa • Neurociência aplicada a 35+
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasEffectiveKey ? (
              <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 hidden sm:inline-flex">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{activeModel} {isRagActive ? "• RAG Ativo" : ""}</span>
              </span>
            ) : (
              <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5 hidden sm:inline-flex">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Modo Offline (Configure no Admin)</span>
              </span>
            )}

            {profile?.role === "SUPER_ADMIN" && (
              <Link href="/admin">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-calm-border hover:bg-calm-surface text-calm-accent gap-1.5 px-2.5 py-1"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Treinar Agente & RAG</span>
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsKeyModalOpen(true)}
              className="text-xs text-calm-muted hover:text-amber-400 gap-1.5 border border-calm-border/60 hover:border-amber-500/40 px-2.5 py-1"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Chave Gemini</span>
            </Button>
          </div>
        </div>

        {/* Sugestões Rápidas de Ativação (se for conversa recente) */}
        {messages.length <= 1 && (
          <div className="px-4 py-2 border-b border-calm-border/40 bg-calm-surface/30 overflow-x-auto flex items-center gap-2 scrollbar-none">
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
        )}

        {/* Caixa de Mensagens (com scroll) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
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
                  className={`max-w-2xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
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

        {/* Formulário de Envio Inferior */}
        <div className="p-4 border-t border-calm-border bg-calm-card/40 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 max-w-4xl mx-auto p-2 rounded-2xl bg-calm-card border border-calm-border shadow-calm-card"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Compartilhe um dilema de transição, dúvida de entrevista ou receio..."
              className="flex-1 px-4 py-2 text-xs sm:text-sm bg-transparent text-calm-text placeholder-calm-muted/50 focus:outline-none"
            />

            <Button type="submit" size="sm" disabled={!inputMessage.trim() || loading} className="gap-1.5 shrink-0">
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refletir</span>
            </Button>
          </form>
        </div>
      </main>

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
