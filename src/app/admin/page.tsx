"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Ticket,
  Users,
  Plus,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  Filter,
  Sparkles,
  ArrowUpRight,
  UserCheck,
  BookOpen,
  Video,
  Play,
  ExternalLink,
} from "lucide-react";
import {
  Coupon,
  CouponType,
  SubscriptionPlan,
  PlanStatus,
  UserProfile,
  MicrolearningLesson,
} from "@/types";
import {
  createCoupon,
  createBatchCoupons,
  listAllCoupons,
  listAllUsers,
  updateUserPlanManual,
} from "@/lib/coupons";
import {
  fetchMicrolearningLessons,
  createMicrolearningLesson,
} from "@/lib/microlearning";

export default function AdminPage() {
  const { profile } = useAuth();

  // Estados de Abas
  const [activeTab, setActiveTab] = useState<"COUPONS" | "USERS" | "LESSONS">("COUPONS");

  // Estados de Cupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [couponCreationMode, setCouponCreationMode] = useState<"SINGLE" | "BATCH">("SINGLE");
  const [singleCode, setSingleCode] = useState("");
  const [batchPrefix, setBatchPrefix] = useState("TURMA35");
  const [batchCount, setBatchCount] = useState(5);
  const [selectedType, setSelectedType] = useState<CouponType>("LIFETIME_VIP");
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSearch, setCouponSearch] = useState("");
  const [couponFilter, setCouponFilter] = useState<"ALL" | "AVAILABLE" | "REDEEMED">("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Estados de Usuários
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userFeedback, setUserFeedback] = useState<string | null>(null);

  // Estados de Microlearning (Aulas)
  const [lessons, setLessons] = useState<MicrolearningLesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [lessonModule, setLessonModule] = useState("Neurociência da Mudança Tardia");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonUrl, setLessonUrl] = useState("");
  const [lessonDuration, setLessonDuration] = useState("4 min");
  const [lessonFeedback, setLessonFeedback] = useState<string | null>(null);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [creatingLesson, setCreatingLesson] = useState(false);

  // Carregamento de dados
  const loadData = async () => {
    try {
      setLoadingCoupons(true);
      setLoadingUsers(true);
      setLoadingLessons(true);
      const [loadedCoupons, loadedUsers, loadedLessons] = await Promise.all([
        listAllCoupons(),
        listAllUsers(),
        fetchMicrolearningLessons(),
      ]);
      setCoupons(loadedCoupons);
      setUsers(loadedUsers);
      setLessons(loadedLessons);
    } catch (err: any) {
      console.error("Erro ao carregar dados do admin:", err);
    } finally {
      setLoadingCoupons(false);
      setLoadingUsers(false);
      setLoadingLessons(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Criação Unitária de Cupom
  const handleCreateSingleCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleCode.trim()) return;

    try {
      setCouponError(null);
      setCouponFeedback(null);
      const created = await createCoupon(singleCode, selectedType);
      setCoupons([created, ...coupons]);
      setSingleCode("");
      setCouponFeedback(`Cupom ${created.code} criado com sucesso!`);
      setTimeout(() => setCouponFeedback(null), 4000);
    } catch (err: any) {
      setCouponError(err?.message || "Erro ao emitir cupom.");
    }
  };

  // Criação em Lote de Cupons
  const handleCreateBatchCoupons = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCouponError(null);
      setCouponFeedback(null);
      const createdBatch = await createBatchCoupons(batchPrefix, batchCount, selectedType);
      setCoupons([...createdBatch, ...coupons]);
      setCouponFeedback(`Lote de ${createdBatch.length} cupons gerado com sucesso!`);
      setTimeout(() => setCouponFeedback(null), 4000);
    } catch (err: any) {
      setCouponError(err?.message || "Erro ao emitir lote de cupons.");
    }
  };

  // Copiar código do cupom
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Alteração manual de plano do usuário
  const handlePlanChange = async (
    userId: string,
    newPlan: SubscriptionPlan,
    newStatus: PlanStatus
  ) => {
    try {
      await updateUserPlanManual(userId, newPlan, newStatus);
      setUsers(
        users.map((u) =>
          u.uid === userId ? { ...u, plan: newPlan, planStatus: newStatus } : u
        )
      );
      setUserFeedback("Plano do usuário atualizado com sucesso!");
      setTimeout(() => setUserFeedback(null), 3000);
    } catch (err: any) {
      alert("Erro ao alterar plano: " + err.message);
    }
  };

  // Cadastro de Nova Aula do YouTube
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !lessonUrl.trim()) return;

    try {
      setCreatingLesson(true);
      setLessonError(null);
      setLessonFeedback(null);
      const newLesson = await createMicrolearningLesson(
        lessonModule,
        lessonTitle,
        lessonUrl,
        lessonDuration
      );
      setLessons([...lessons, newLesson]);
      setLessonTitle("");
      setLessonUrl("");
      setLessonFeedback(`Aula "${newLesson.title}" cadastrada e vinculada com sucesso!`);
      setTimeout(() => setLessonFeedback(null), 4000);
    } catch (err: any) {
      setLessonError(err?.message || "Erro ao cadastrar aula do YouTube.");
    } finally {
      setCreatingLesson(false);
    }
  };

  // Filtro de cupons
  const filteredCoupons = coupons.filter((c) => {
    const matchesCode = c.code.toLowerCase().includes(couponSearch.toLowerCase());
    if (!matchesCode) return false;
    if (couponFilter === "AVAILABLE") return !c.isRedeemed;
    if (couponFilter === "REDEEMED") return c.isRedeemed;
    return true;
  });

  // Filtro de usuários
  const filteredUsers = users.filter((u) => {
    const term = userSearch.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.targetCareer && u.targetCareer.toLowerCase().includes(term))
    );
  });

  const totalCoupons = coupons.length;
  const availableCoupons = coupons.filter((c) => !c.isRedeemed).length;
  const redeemedCoupons = coupons.filter((c) => c.isRedeemed).length;
  const vipUsers = users.filter((u) => u.planStatus === "ACTIVE_VIP").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Cabeçalho de Governança */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-calm-text">
              Painel Master de Governança
            </h1>
            <Badge variant="admin" />
          </div>
          <p className="text-xs text-calm-muted mt-1">
            Acesso exclusivo para <strong>{profile?.email}</strong>. Gestão de planos, usuários,
            aulas e cupons atômicos do MicroShift.
          </p>
        </div>

        {/* Métricas Executivas Rápidas */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <div className="px-3 py-1.5 rounded-xl bg-calm-card border border-calm-border text-center shrink-0">
            <span className="text-base font-bold text-calm-text">{users.length}</span>
            <span className="text-[10px] text-calm-muted block uppercase tracking-wider">
              Usuários
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-calm-card border border-calm-border text-center shrink-0">
            <span className="text-base font-bold text-emerald-400">{availableCoupons}</span>
            <span className="text-[10px] text-calm-muted block uppercase tracking-wider">
              Cupons Livres
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-calm-card border border-calm-border text-center shrink-0">
            <span className="text-base font-bold text-amber-300">{vipUsers}</span>
            <span className="text-[10px] text-calm-muted block uppercase tracking-wider">
              Membros VIP
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-calm-card border border-calm-border text-center shrink-0">
            <span className="text-base font-bold text-sky-400">{lessons.length}</span>
            <span className="text-[10px] text-calm-muted block uppercase tracking-wider">
              Aulas
            </span>
          </div>
        </div>
      </div>

      {/* Seletor de Módulos (Abas) */}
      <div className="flex items-center gap-2.5 border-b border-calm-border pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("COUPONS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
            activeTab === "COUPONS"
              ? "bg-calm-card text-calm-accent border border-calm-border shadow-sm"
              : "text-calm-muted hover:text-calm-text hover:bg-calm-card/40"
          }`}
        >
          <Ticket className="w-4 h-4 text-amber-400" />
          <span>Gerenciador de Cupons ({totalCoupons})</span>
        </button>

        <button
          onClick={() => setActiveTab("USERS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
            activeTab === "USERS"
              ? "bg-calm-card text-calm-accent border border-calm-border shadow-sm"
              : "text-calm-muted hover:text-calm-text hover:bg-calm-card/40"
          }`}
        >
          <Users className="w-4 h-4 text-calm-accent" />
          <span>Gestão de Usuários ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("LESSONS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
            activeTab === "LESSONS"
              ? "bg-calm-card text-calm-accent border border-calm-border shadow-sm"
              : "text-calm-muted hover:text-calm-text hover:bg-calm-card/40"
          }`}
        >
          <Video className="w-4 h-4 text-sky-400" />
          <span>Gestor de Microlearning ({lessons.length})</span>
        </button>
      </div>

      {/* ABA 1: GERENCIADOR DE CUPONS */}
      {activeTab === "COUPONS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-calm-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="w-4 h-4 text-calm-accent" />
                    <span>Emitir Cupons</span>
                  </CardTitle>
                  <div className="flex rounded-lg bg-calm-surface p-0.5 border border-calm-border text-xs">
                    <button
                      type="button"
                      onClick={() => setCouponCreationMode("SINGLE")}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${
                        couponCreationMode === "SINGLE"
                          ? "bg-calm-card text-calm-text shadow-sm"
                          : "text-calm-muted hover:text-calm-text"
                      }`}
                    >
                      Unitário
                    </button>
                    <button
                      type="button"
                      onClick={() => setCouponCreationMode("BATCH")}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${
                        couponCreationMode === "BATCH"
                          ? "bg-calm-card text-calm-text shadow-sm"
                          : "text-calm-muted hover:text-calm-text"
                      }`}
                    >
                      Em Lote
                    </button>
                  </div>
                </div>
                <CardDescription>
                  Gera cupons com validação atômica no Firestore para resgate único.
                </CardDescription>
              </CardHeader>

              {couponFeedback && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{couponFeedback}</span>
                </div>
              )}

              {couponError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}

              {couponCreationMode === "SINGLE" ? (
                <form onSubmit={handleCreateSingleCoupon} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-calm-muted mb-1">
                      Código Personalizado
                    </label>
                    <input
                      type="text"
                      required
                      value={singleCode}
                      onChange={(e) => setSingleCode(e.target.value.toUpperCase())}
                      placeholder="Ex: DIRETORIA2026"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text uppercase placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-calm-muted mb-1">
                      Benefício Concedido
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as CouponType)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text focus:outline-none focus:border-calm-accent"
                    >
                      <option value="LIFETIME_VIP">LIFETIME_VIP (Sover Perpétuo 100% Grátis)</option>
                      <option value="TRIAL_3M_TRACK">TRIAL_3M_TRACK (Track por 90 dias)</option>
                      <option value="TRIAL_3M_SOVER">TRIAL_3M_SOVER (Sover por 90 dias)</option>
                    </select>
                  </div>

                  <Button type="submit" className="w-full text-xs">
                    Criar Cupom Unitário
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleCreateBatchCoupons} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-calm-muted mb-1">
                      Prefixo do Lote
                    </label>
                    <input
                      type="text"
                      required
                      value={batchPrefix}
                      onChange={(e) => setBatchPrefix(e.target.value.toUpperCase())}
                      placeholder="Ex: TURMA35"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text uppercase placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-calm-muted mb-1">
                      Quantidade de Cupons ({batchCount})
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={batchCount}
                      onChange={(e) => setBatchCount(Number(e.target.value))}
                      className="w-full accent-calm-accent cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-calm-muted mt-1">
                      <span>1 cupom</span>
                      <span>10 cupons</span>
                      <span>20 cupons</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-calm-muted mb-1">
                      Benefício Concedido
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as CouponType)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text focus:outline-none focus:border-calm-accent"
                    >
                      <option value="LIFETIME_VIP">LIFETIME_VIP (Sover Perpétuo 100% Grátis)</option>
                      <option value="TRIAL_3M_TRACK">TRIAL_3M_TRACK (Track por 90 dias)</option>
                      <option value="TRIAL_3M_SOVER">TRIAL_3M_SOVER (Sover por 90 dias)</option>
                    </select>
                  </div>

                  <Button type="submit" variant="primary" className="w-full text-xs">
                    Gerar Lote de {batchCount} Cupons
                  </Button>
                </form>
              )}
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-amber-400" />
                      <span>Catálogo de Cupons</span>
                    </CardTitle>
                    <CardDescription>
                      {availableCoupons} disponíveis • {redeemedCoupons} resgatados
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-calm-muted" />
                      <input
                        type="text"
                        value={couponSearch}
                        onChange={(e) => setCouponSearch(e.target.value)}
                        placeholder="Buscar código..."
                        className="pl-8 pr-2.5 py-1 text-xs rounded-lg bg-calm-surface border border-calm-border text-calm-text placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent w-36 sm:w-44"
                      />
                    </div>

                    <select
                      value={couponFilter}
                      onChange={(e) => setCouponFilter(e.target.value as any)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-calm-surface border border-calm-border text-calm-text focus:outline-none focus:border-calm-accent"
                    >
                      <option value="ALL">Todos</option>
                      <option value="AVAILABLE">Disponíveis</option>
                      <option value="REDEEMED">Resgatados</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-calm-card z-10">
                    <tr className="border-b border-calm-border text-calm-muted uppercase tracking-wider">
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Resgatado Por</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-calm-border/60">
                    {filteredCoupons.map((coupon) => (
                      <tr key={coupon.code} className="hover:bg-calm-cardHover/40 transition">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-calm-text flex items-center gap-1.5">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {coupon.type === "LIFETIME_VIP" ? (
                            <span className="text-amber-300 font-semibold">VIP Perpétuo</span>
                          ) : coupon.type === "TRIAL_3M_TRACK" ? (
                            <span className="text-sky-300">Track 90d</span>
                          ) : (
                            <span className="text-amber-400">Sover 90d</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {coupon.isRedeemed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              Resgatado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Disponível
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-calm-muted truncate max-w-[150px]">
                          {coupon.redeemedByUserId || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            title="Copiar código do cupom"
                            className="p-1.5 rounded-md hover:bg-calm-surface text-calm-muted hover:text-calm-text transition"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ABA 2: GESTÃO DE USUÁRIOS */}
      {activeTab === "USERS" && (
        <div className="space-y-6">
          {userFeedback && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{userFeedback}</span>
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-calm-accent" />
                    <span>Usuários Cadastrados</span>
                  </CardTitle>
                  <CardDescription>
                    Gerencie o tier de assinatura e permissões de cada profissional da plataforma.
                  </CardDescription>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-calm-muted" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar por nome ou e-mail..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-calm-surface border border-calm-border text-calm-text placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-calm-border text-calm-muted uppercase tracking-wider">
                    <th className="py-3 px-4">Profissional</th>
                    <th className="py-3 px-4">Carreira Alvo</th>
                    <th className="py-3 px-4">Plano Atual</th>
                    <th className="py-3 px-4">Ofensiva</th>
                    <th className="py-3 px-4 text-right">Upgrade Manual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-calm-border/60">
                  {filteredUsers.map((u) => {
                    const isMaster = u.email === "feraimentor@gmail.com";
                    return (
                      <tr key={u.uid} className="hover:bg-calm-cardHover/40 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-calm-surface border border-calm-border flex items-center justify-center font-bold text-calm-accent shrink-0 overflow-hidden">
                              {u.photoURL ? (
                                <img
                                  src={u.photoURL}
                                  alt={u.displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                u.displayName.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-calm-text flex items-center gap-1.5">
                                {u.displayName}
                                {isMaster && <Badge variant="admin" />}
                              </span>
                              <span className="text-[11px] text-calm-muted">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-calm-muted">
                          <span className="text-calm-text font-medium">
                            {u.targetCareer || "Em definição"}
                          </span>
                          <span className="text-[10px] text-calm-subtle block truncate max-w-[180px]">
                            {u.headline || "Transição Silenciosa"}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant="plan" plan={u.plan} planStatus={u.planStatus} />
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-emerald-400">{u.streakDays} dias</span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {isMaster ? (
                            <span className="text-[11px] text-calm-subtle font-medium">
                              Fundador Mestre
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handlePlanChange(u.uid, "SOVER", "ACTIVE_VIP")}
                                title="Conceder Acesso Sover VIP Perpétuo"
                                className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-medium transition"
                              >
                                + Sover VIP
                              </button>
                              <button
                                onClick={() => handlePlanChange(u.uid, "TRACK", "TRIAL")}
                                title="Ativar degustação do Track"
                                className="px-2 py-1 rounded bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[11px] font-medium transition"
                              >
                                + Track
                              </button>
                              <button
                                onClick={() => handlePlanChange(u.uid, "START", "ACTIVE")}
                                title="Retornar para o plano gratuito Start"
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                              >
                                Start
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ABA 3: GESTOR DE MICROLEARNING (YOUTUBE EMBED) */}
      {activeTab === "LESSONS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulário de Cadastro via YouTube */}
            <Card className="lg:col-span-1 border-calm-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="w-4 h-4 text-sky-400" />
                  <span>Cadastrar Aula do YouTube</span>
                </CardTitle>
                <CardDescription>
                  Cole o link público do YouTube. O sistema extrai o ID do vídeo e configura o player sem distrações.
                </CardDescription>
              </CardHeader>

              {lessonFeedback && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{lessonFeedback}</span>
                </div>
              )}

              {lessonError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{lessonError}</span>
                </div>
              )}

              <form onSubmit={handleCreateLesson} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-calm-muted mb-1">
                    Módulo / Trilha
                  </label>
                  <input
                    type="text"
                    required
                    value={lessonModule}
                    onChange={(e) => setLessonModule(e.target.value)}
                    placeholder="Ex: Neurociência da Mudança Tardia"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-calm-muted mb-1">
                    Título da Aula
                  </label>
                  <input
                    type="text"
                    required
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="Ex: Vencendo a Fadiga Decisória aos 35+"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-calm-muted mb-1">
                    Link Público do YouTube
                  </label>
                  <input
                    type="url"
                    required
                    value={lessonUrl}
                    onChange={(e) => setLessonUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-calm-muted mb-1">
                    Duração Estimada
                  </label>
                  <input
                    type="text"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(e.target.value)}
                    placeholder="Ex: 4 min"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent"
                  />
                </div>

                <Button type="submit" disabled={creatingLesson} className="w-full text-xs">
                  {creatingLesson ? "Salvando Aula..." : "Publicar Micro-Aula"}
                </Button>
              </form>
            </Card>

            {/* Listagem de Aulas Cadastradas */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sky-400" />
                    <span>Catálogo de Micro-Aulas</span>
                  </div>
                  <span className="text-xs text-calm-muted font-normal">
                    {lessons.length} aulas ativas
                  </span>
                </CardTitle>
                <CardDescription>
                  Aulas exibidas no player blindado sem sugestões do YouTube.
                </CardDescription>
              </CardHeader>

              <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-calm-card z-10">
                    <tr className="border-b border-calm-border text-calm-muted uppercase tracking-wider">
                      <th className="py-2.5 px-3">Título</th>
                      <th className="py-2.5 px-3">Módulo</th>
                      <th className="py-2.5 px-3">YouTube ID</th>
                      <th className="py-2.5 px-3">Duração</th>
                      <th className="py-2.5 px-3 text-right">Ver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-calm-border/60">
                    {lessons.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-calm-cardHover/40 transition">
                        <td className="py-2.5 px-3 font-medium text-calm-text">
                          {lesson.title}
                        </td>
                        <td className="py-2.5 px-3 text-calm-muted">
                          {lesson.moduleTitle}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-calm-accent">
                          {lesson.youtubeId}
                        </td>
                        <td className="py-2.5 px-3 text-calm-muted">
                          {lesson.durationText}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <a
                            href={`https://www.youtube.com/watch?v=${lesson.youtubeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-calm-surface text-calm-muted hover:text-calm-text inline-flex items-center transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
