"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FocusTimerModal } from "@/components/FocusTimerModal";
import { AchievementCardModal } from "@/components/AchievementCardModal";
import {
  Compass,
  Flame,
  Clock,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Users,
  CheckCircle2,
  ArrowRight,
  User,
  Plus,
  Trash2,
  HeartHandshake,
  Calendar,
  AlertCircle,
  Play,
  Share2,
} from "lucide-react";
import { HabitGoal } from "@/types";
import { fetchUserGoals, createUserGoal, completeGoalToday, deleteUserGoal, getLocalGoals } from "@/lib/goals";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading, refreshProfile } = useAuth();

  useEffect(() => {
    if (!loading && !profile) {
      router.push("/login");
    }
  }, [loading, profile, router]);

  // Estados de Metas
  const [goals, setGoals] = useState<HabitGoal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);

  // Estados do Timer Modal
  const [selectedGoal, setSelectedGoal] = useState<HabitGoal | null>(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isDifficultDay, setIsDifficultDay] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Estados do Modal de Criação de Metas
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Hard Skill");
  const [newDuration, setNewDuration] = useState(15);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [generatingAiRoadmap, setGeneratingAiRoadmap] = useState(false);
  const [generatedSteps, setGeneratedSteps] = useState<any[] | undefined>(undefined);

  // Sugestão de meta com Gemini 2.5 Flash
  const handleGenerateAiRoadmap = async () => {
    try {
      setGeneratingAiRoadmap(true);
      setGoalError(null);
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCareer: profile?.targetCareer || "Liderança Executiva em Tecnologia",
          currentRole: profile?.headline || "Profissional em Transição 35+",
        }),
      });
      const data = await res.json();
      if (data.title) {
        setNewTitle(data.title);
        setNewCategory(data.category || "Hard Skill");
        setGeneratedSteps(data.steps);
      }
    } catch (err: any) {
      setGoalError("Não foi possível gerar com IA no momento.");
    } finally {
      setGeneratingAiRoadmap(false);
    }
  };

  const loadGoals = async () => {
    if (!profile) return;
    const cached = getLocalGoals(profile.uid);
    if (cached.length > 0 && goals.length === 0) {
      setGoals(cached);
      setLoadingGoals(false);
    }
    try {
      const userGoals = await fetchUserGoals(profile.uid);
      setGoals(userGoals);
    } catch (err) {
      console.error("Erro ao carregar metas:", err);
    } finally {
      setLoadingGoals(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [profile?.uid]);

  // Abertura do Timer para meta normal (15 min)
  const handleStartTimer = (goal: HabitGoal) => {
    setSelectedGoal(goal);
    setIsDifficultDay(false);
    setIsTimerOpen(true);
  };

  // Abertura do Timer para Modo Dia Difícil (2 min)
  const handleStartDifficultMode = (goal: HabitGoal) => {
    setSelectedGoal(goal);
    setIsDifficultDay(true);
    setIsTimerOpen(true);
  };

  // Conclusão da meta
  const handleGoalCompleted = async (goalId: string, difficultModeUsed: boolean) => {
    if (!profile) return;
    await completeGoalToday(goalId, profile.uid, difficultModeUsed);
    await refreshProfile();
    await loadGoals();
  };

  // Criação de nova meta
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newTitle.trim()) return;

    try {
      setCreatingGoal(true);
      setGoalError(null);
      await createUserGoal(profile.uid, profile.plan, {
        title: newTitle.trim(),
        category: newCategory,
        durationMinutes: Number(newDuration),
        steps: generatedSteps,
      });
      setNewTitle("");
      setGeneratedSteps(undefined);
      setIsNewGoalModalOpen(false);
      await loadGoals();
    } catch (err: any) {
      setGoalError(err?.message || "Erro ao criar micro-meta.");
    } finally {
      setCreatingGoal(false);
    }
  };

  // Exclusão de meta
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Deseja realmente remover esta micro-meta?")) return;
    await deleteUserGoal(goalId);
    await loadGoals();
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <Compass className="w-10 h-10 text-sky-400 mb-4 animate-spin" />
        <p className="text-sm text-slate-400">Carregando seu espaço executivo...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isSuperAdmin = profile.role === "SUPER_ADMIN";
  const primaryGoal = goals[0];
  const canAddMoreGoals = profile.plan !== "START" || goals.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header Executivo de Boas-Vindas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-calm-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-calm-text">
              Olá, {profile.displayName}
            </h1>
            <Badge variant="plan" plan={profile.plan} planStatus={profile.planStatus} />
            {isSuperAdmin && <Badge variant="admin" />}
          </div>
          <p className="text-sm text-calm-muted mt-1">
            {profile.headline || "Profissional em Transição Silenciosa"} • Alvo:{" "}
            <span className="text-calm-accent font-medium">{profile.targetCareer || "Tecnologia & IA"}</span>
          </p>
        </div>

        {/* Indicador de Consistência Silenciosa */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-calm-card border border-calm-border shadow-sm">
            <Flame className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
            <div>
              <div className="text-sm font-bold text-calm-text">{profile.streakDays} Dias</div>
              <div className="text-[10px] text-calm-muted uppercase tracking-wider">Ofensiva Ativa</div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCardModalOpen(true)}
            className="text-xs"
          >
            <Share2 className="w-4 h-4 mr-1.5 text-calm-accent" />
            <span className="hidden sm:inline">Compartilhar</span> Conquista
          </Button>
          <Link href="/perfil">
            <Button variant="outline" size="sm">
              <User className="w-4 h-4 mr-1.5" />
              Perfil
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid Central */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Meta Principal & Listagem de Hábitos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card da Meta Ativa em Destaque */}
          {primaryGoal ? (
            <Card className="border-calm-accent/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-calm-accent/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-calm-accent">
                  <Clock className="w-4 h-4" />
                  <span>Bloco Silencioso do Dia</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-calm-muted font-medium">
                    {primaryGoal.durationMinutes} minutos
                  </span>
                  {primaryGoal.completedToday && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Concluído Hoje
                    </span>
                  )}
                </div>
              </div>

              <CardTitle className="text-xl sm:text-2xl">{primaryGoal.title}</CardTitle>
              <CardDescription className="mt-2 text-sm leading-relaxed">
                Categoria: <strong className="text-calm-text">{primaryGoal.category}</strong>.
                Dividida em micro-etapas de alto rendimento para execução sem atrito.
              </CardDescription>

              {/* Micro-etapas do Roadmap */}
              {primaryGoal.aiRoadmap && primaryGoal.aiRoadmap.length > 0 && (
                <div className="mt-5 space-y-2">
                  <span className="text-[11px] font-semibold text-calm-muted uppercase tracking-wider">
                    Roteiro Estruturado:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {primaryGoal.aiRoadmap.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-calm-surface border border-calm-border/80 text-xs"
                      >
                        <span className="font-semibold text-calm-text block">
                          Passo {idx + 1}: {step.title} ({step.durationMinutes}m)
                        </span>
                        <span className="text-[11px] text-calm-muted">{step.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="mt-6 pt-6 border-t border-calm-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-calm-muted">
                  {primaryGoal.completedToday ? (
                    <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Meta realizada com foco hoje!
                    </span>
                  ) : (
                    <span>Pronto para iniciar seu foco de hoje</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleStartTimer(primaryGoal)}
                    className="w-full sm:w-auto shadow-calm-glow"
                  >
                    <Play className="w-4 h-4 mr-1.5 fill-current" />
                    Iniciar Foco (15 min)
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => handleStartDifficultMode(primaryGoal)}
                    title="Ajusta dinamicamente a meta para 2 minutos sem quebrar seu streak"
                    className="w-full sm:w-auto text-xs text-amber-300 hover:text-amber-200 border-amber-500/30"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                    Modo Dia Difícil (2 min)
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="text-center py-12">
              <Clock className="w-12 h-12 text-calm-muted mx-auto mb-3 opacity-60" />
              <CardTitle className="text-lg">Nenhuma micro-meta ativa</CardTitle>
              <CardDescription className="max-w-md mx-auto mt-2">
                Comece definindo um bloco de 10 a 15 minutos de foco diário para alavancar sua transição de carreira.
              </CardDescription>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsNewGoalModalOpen(true)}
                className="mt-5"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Criar Primeira Meta
              </Button>
            </Card>
          )}

          {/* Seção Todas as Micro-Metas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-calm-text uppercase tracking-wider flex items-center gap-2">
                <span>Minhas Metas de Reskilling</span>
                <span className="text-xs text-calm-muted">({goals.length})</span>
              </h3>

              {canAddMoreGoals ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewGoalModalOpen(true)}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Nova Meta
                </Button>
              ) : (
                <span className="text-[11px] text-amber-400 font-medium">
                  Limite do plano Start atingido (1 meta)
                </span>
              )}
            </div>

            <div className="space-y-2">
              {goals.map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-xl bg-calm-card border border-calm-border flex items-center justify-between gap-4 hover:border-calm-borderSubtle transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        g.completedToday
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-calm-surface text-calm-accent"
                      }`}
                    >
                      {g.completedToday ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-calm-text">{g.title}</h4>
                      <p className="text-xs text-calm-muted">
                        {g.category} • {g.durationMinutes} min •{" "}
                        {g.completedToday ? "Concluída hoje" : "Pendente"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartTimer(g)}
                      className="text-xs"
                    >
                      Focar
                    </Button>
                    <button
                      onClick={() => handleDeleteGoal(g.id!)}
                      title="Excluir meta"
                      className="p-2 text-calm-muted hover:text-rose-400 rounded-lg hover:bg-calm-surface transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna 3: Pilares & Semana de Consistência */}
        <div className="space-y-6">
          {/* Card de Consistência Silenciosa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Semana de Consistência</span>
              </CardTitle>
              <CardDescription>
                Cada dia marcado consolida neuroplasticidade e novos caminhos sinápticos.
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-7 gap-1.5 text-center mt-2">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day, idx) => {
                const isToday = idx === 4; // Exemplo de representação
                const isPastDone = idx < 4;
                return (
                  <div key={day} className="flex flex-col items-center">
                    <span className="text-[10px] text-calm-muted mb-1">{day}</span>
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition ${
                        isPastDone
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : isToday
                          ? "bg-calm-accent/20 text-calm-accent border border-calm-accent animate-pulse"
                          : "bg-calm-surface text-calm-muted border border-calm-border"
                      }`}
                    >
                      {isPastDone ? "✓" : idx + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-calm-border text-xs text-calm-muted">
              <span className="font-semibold text-calm-text">Filosofia Calm Tech:</span> Não busque
              a perfeição exaustiva. Se o dia for pesado, 2 minutos no Modo Dia Difícil mantêm sua
              chama acesa.
            </div>
          </Card>

          {/* Atalhos Rápidos */}
          <div className="space-y-3">
            <Card className="hover:border-calm-borderSubtle transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-calm-accent">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-calm-text">Microlearning</h4>
                  <p className="text-xs text-calm-muted">Aulas curtas sem distrações</p>
                </div>
              </div>
              <Link href="/microlearning" className="mt-3 block">
                <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                  Acessar aulas
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </Card>

            <Card className="hover:border-calm-borderSubtle transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-calm-text">Tribo 35+</h4>
                  <p className="text-xs text-calm-muted">Vitórias e ajuda prática</p>
                </div>
              </div>
              <Link href="/tribo" className="mt-3 block">
                <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                  Ver comunidade
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>

      {/* MODAL DO TIMER DE FOCO IMERSIVO */}
      <FocusTimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        goal={selectedGoal}
        isDifficultDayMode={isDifficultDay}
        onGoalCompleted={handleGoalCompleted}
      />

      {/* MODAL DE CRIAÇÃO DE META */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 shadow-2xl relative">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-calm-accent" />
                <span>Nova Micro-Meta de Carreira</span>
              </CardTitle>
              <CardDescription>
                Defina um hábito diário executivo de 10 a 15 minutos.
              </CardDescription>
            </CardHeader>

            {goalError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{goalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-calm-muted">
                    Título da Meta
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAiRoadmap}
                    disabled={generatingAiRoadmap}
                    className="text-[11px] font-semibold text-calm-accent hover:text-calm-accentHover flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3 h-3" />
                    {generatingAiRoadmap ? "Gerando com IA..." : "Sugerir com Gemini 2.5 Flash"}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Estudo de Caso de Liderança Tech"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent"
                />
                {generatedSteps && (
                  <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Roteiro de 2 etapas estruturado com sucesso pela IA!
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-calm-muted mb-1">
                  Categoria Estratégica
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text focus:outline-none focus:border-calm-accent"
                >
                  <option value="Hard Skill">Hard Skill (IA, Código, Cloud, Dados)</option>
                  <option value="Soft Skill">Soft Skill (Comunicação Executiva, Gestão)</option>
                  <option value="Posicionamento">Posicionamento (LinkedIn, Portfólio)</option>
                  <option value="Networking">Networking Estruturado</option>
                  <option value="Saúde & Foco">Saúde & Clareza Decisória</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-calm-muted mb-1">
                  Duração Diária ({newDuration} minutos)
                </label>
                <input
                  type="range"
                  min={10}
                  max={20}
                  step={5}
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full accent-calm-accent cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-calm-muted mt-1">
                  <span>10 min</span>
                  <span>15 min (Padrão)</span>
                  <span>20 min</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-calm-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsNewGoalModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={creatingGoal}>
                  {creatingGoal ? "Salvando..." : "Criar Meta"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL DO CARD EXECUTIVO DE CONQUISTAS (CANVAS HTML5) */}
      <AchievementCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        profile={profile}
      />
    </div>
  );
}
