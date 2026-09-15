"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Bot,
  FileText,
  UploadCloud,
  Network,
  Sliders,
  Key,
  RefreshCw,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  MessageSquare,
  Send,
  Zap,
} from "lucide-react";
import {
  Coupon,
  CouponType,
  SubscriptionPlan,
  PlanStatus,
  UserProfile,
  MicrolearningLesson,
  MentorAiConfig,
  KnowledgeDocument,
  McpServerConfig,
  GeminiModelId,
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
  INITIAL_MICROLEARNING_LESSONS,
} from "@/lib/microlearning";
import { INITIAL_COUPONS } from "@/lib/mock-data";
import {
  fetchMentorAiConfig,
  saveMentorAiConfig,
  fetchKnowledgeBase,
  addKnowledgeDocument,
  deleteKnowledgeDocument,
  toggleKnowledgeDocument,
  fetchMcpServers,
  saveMcpServer,
  deleteMcpServer,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_WELCOME_MESSAGE,
  DEFAULT_MENTOR_CONFIG,
} from "@/lib/mentor-config";
import { testGeminiConnection, callGeminiRest } from "@/lib/gemini";
import { parseKnowledgeFile } from "@/lib/file-parser";

export default function AdminPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== "SUPER_ADMIN")) {
      router.push("/login");
    }
  }, [authLoading, profile, router]);

  // Estados de Abas
  const [activeTab, setActiveTab] = useState<"COUPONS" | "USERS" | "LESSONS" | "MENTOR_AI">("COUPONS");

  // Estados de Cupons
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
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
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userFeedback, setUserFeedback] = useState<string | null>(null);

  // Estados de Microlearning (Aulas)
  const [lessons, setLessons] = useState<MicrolearningLesson[]>(INITIAL_MICROLEARNING_LESSONS);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [lessonModule, setLessonModule] = useState("Neurociência da Mudança Tardia");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonUrl, setLessonUrl] = useState("");
  const [lessonDuration, setLessonDuration] = useState("4 min");
  const [lessonFeedback, setLessonFeedback] = useState<string | null>(null);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [creatingLesson, setCreatingLesson] = useState(false);

  // Estados do Agente IA, RAG e MCP
  const [aiSubTab, setAiSubTab] = useState<"PROMPT" | "RAG" | "MCP">("PROMPT");
  const [mentorConfig, setMentorConfig] = useState<MentorAiConfig>(DEFAULT_MENTOR_CONFIG);
  const [savingAiConfig, setSavingAiConfig] = useState(false);
  const [aiConfigFeedback, setAiConfigFeedback] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Teste de Conexão
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Chat de Teste ao Vivo no Admin
  const [testPrompt, setTestPrompt] = useState("");
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testingChat, setTestingChat] = useState(false);

  // Base de Conhecimento (RAG)
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFeedback, setDocFeedback] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [savingManualDoc, setSavingManualDoc] = useState(false);

  // Servidores MCP
  const [mcpServers, setMcpServers] = useState<McpServerConfig[]>([]);
  const [newMcpName, setNewMcpName] = useState("");
  const [newMcpUrl, setNewMcpUrl] = useState("");
  const [newMcpTransport, setNewMcpTransport] = useState<"SSE" | "HTTP">("SSE");
  const [newMcpToken, setNewMcpToken] = useState("");
  const [newMcpDesc, setNewMcpDesc] = useState("");
  const [savingMcp, setSavingMcp] = useState(false);
  const [mcpFeedback, setMcpFeedback] = useState<string | null>(null);

  // Carregamento de dados
  const loadData = async () => {
    try {
      setLoadingCoupons(true);
      setLoadingUsers(true);
      setLoadingLessons(true);
      const [
        loadedCoupons,
        loadedUsers,
        loadedLessons,
        loadedConfig,
        loadedDocs,
        loadedMcp,
      ] = await Promise.all([
        listAllCoupons(),
        listAllUsers(),
        fetchMicrolearningLessons(),
        fetchMentorAiConfig(),
        fetchKnowledgeBase(),
        fetchMcpServers(),
      ]);
      setCoupons(loadedCoupons);
      setUsers(loadedUsers);
      setLessons(loadedLessons);
      setMentorConfig(loadedConfig);
      setKnowledgeDocs(loadedDocs);
      setMcpServers(loadedMcp);
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

  // Handlers do Agente IA
  const handleSaveMentorConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingAiConfig(true);
      setAiConfigFeedback(null);
      await saveMentorAiConfig(mentorConfig, profile?.displayName || "Admin Master");
      setAiConfigFeedback("Treinamento e configurações do Mentor salvos com sucesso!");
      setTimeout(() => setAiConfigFeedback(null), 4000);
    } catch (err: any) {
      alert("Erro ao salvar configuração do Mentor: " + err.message);
    } finally {
      setSavingAiConfig(false);
    }
  };

  const handleTestConnection = async () => {
    if (!mentorConfig.apiKey.trim()) {
      setTestResult({
        success: false,
        message: "Por favor, informe a Chave de API do Google AI Studio antes de testar.",
      });
      return;
    }
    try {
      setTestingConnection(true);
      setTestResult(null);
      const res = await testGeminiConnection(mentorConfig.apiKey, mentorConfig.model);
      setTestResult(res);
      if (res.success && res.activeModel && res.activeModel !== mentorConfig.model) {
        setMentorConfig((prev) => ({ ...prev, model: res.activeModel! }));
      }
    } catch (err: any) {
      setTestResult({ success: false, message: "Erro ao testar: " + err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleResetPrompt = () => {
    if (confirm("Deseja restaurar as diretrizes comportamentais para o padrão recomendado da MicroShift?")) {
      setMentorConfig({
        ...mentorConfig,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        welcomeMessage: DEFAULT_WELCOME_MESSAGE,
        temperature: 0.7,
      });
      setAiConfigFeedback("Padrão comportamental restaurado. Lembre-se de clicar em Salvar.");
      setTimeout(() => setAiConfigFeedback(null), 4000);
    }
  };

  const handleSendTestChat = async () => {
    if (!testPrompt.trim()) return;
    if (!mentorConfig.apiKey.trim()) {
      alert("Informe uma Chave de API no campo acima para testar o modelo em nuvem.");
      return;
    }

    try {
      setTestingChat(true);
      setTestResponse(null);
      const reply = await callGeminiRest(
        mentorConfig.apiKey.trim(),
        [{ role: "user", parts: [{ text: testPrompt.trim() }] }],
        mentorConfig.systemPrompt,
        mentorConfig.model,
        mentorConfig.temperature
      );
      setTestResponse(reply || "Não houve resposta do modelo.");
    } catch (err: any) {
      setTestResponse("Erro no teste: " + err.message);
    } finally {
      setTestingChat(false);
    }
  };

  // Handlers de Arquivos e Base de Conhecimento (RAG)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingDoc(true);
      setDocError(null);
      setDocFeedback(null);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const parsed = await parseKnowledgeFile(file);
        const saved = await addKnowledgeDocument({
          title: parsed.title,
          fileName: parsed.fileName,
          fileType: parsed.fileType,
          content: parsed.content,
          charCount: parsed.charCount,
          isActive: true,
        });
        setKnowledgeDocs((prev) => [saved, ...prev]);
      }

      setDocFeedback(`${files.length} arquivo(s) incorporado(s) com sucesso à Base de Conhecimento!`);
      setTimeout(() => setDocFeedback(null), 4000);
    } catch (err: any) {
      setDocError(err?.message || "Erro ao processar arquivo.");
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  const handleSaveManualDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) return;

    try {
      setSavingManualDoc(true);
      setDocError(null);
      setDocFeedback(null);

      const saved = await addKnowledgeDocument({
        title: manualTitle.trim(),
        fileType: "manual",
        content: manualContent.trim(),
        charCount: manualContent.trim().length,
        isActive: true,
      });

      setKnowledgeDocs([saved, ...knowledgeDocs]);
      setManualTitle("");
      setManualContent("");
      setDocFeedback(`Documento "${saved.title}" cadastrado com sucesso!`);
      setTimeout(() => setDocFeedback(null), 4000);
    } catch (err: any) {
      setDocError(err?.message || "Erro ao salvar documento.");
    } finally {
      setSavingManualDoc(false);
    }
  };

  const handleToggleDoc = async (id: string, currentActive: boolean) => {
    try {
      await toggleKnowledgeDocument(id, !currentActive);
      setKnowledgeDocs(
        knowledgeDocs.map((d) => (d.id === id ? { ...d, isActive: !currentActive } : d))
      );
    } catch (err: any) {
      alert("Erro ao alterar status do documento: " + err.message);
    }
  };

  const handleDeleteDoc = async (id: string, title: string) => {
    if (!confirm(`Deseja remover "${title}" da Base de Conhecimento?`)) return;
    try {
      await deleteKnowledgeDocument(id);
      setKnowledgeDocs(knowledgeDocs.filter((d) => d.id !== id));
      setDocFeedback("Documento removido da Base de Conhecimento.");
      setTimeout(() => setDocFeedback(null), 3000);
    } catch (err: any) {
      alert("Erro ao excluir documento: " + err.message);
    }
  };

  // Handlers de Conectores MCP
  const handleAddMcpServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMcpName.trim() || !newMcpUrl.trim()) return;

    try {
      setSavingMcp(true);
      setMcpFeedback(null);
      const saved = await saveMcpServer({
        name: newMcpName.trim(),
        url: newMcpUrl.trim(),
        transport: newMcpTransport,
        authToken: newMcpToken.trim() || undefined,
        description: newMcpDesc.trim() || undefined,
        status: "ACTIVE",
      });

      setMcpServers([saved, ...mcpServers.filter((s) => s.id !== saved.id)]);
      setNewMcpName("");
      setNewMcpUrl("");
      setNewMcpToken("");
      setNewMcpDesc("");
      setMcpFeedback(`Conector MCP "${saved.name}" salvo com sucesso!`);
      setTimeout(() => setMcpFeedback(null), 4000);
    } catch (err: any) {
      alert("Erro ao salvar servidor MCP: " + err.message);
    } finally {
      setSavingMcp(false);
    }
  };

  const handleDeleteMcp = async (id: string, name: string) => {
    if (!confirm(`Deseja remover o servidor MCP "${name}"?`)) return;
    try {
      await deleteMcpServer(id);
      setMcpServers(mcpServers.filter((s) => s.id !== id));
      setMcpFeedback("Servidor MCP removido.");
      setTimeout(() => setMcpFeedback(null), 3000);
    } catch (err: any) {
      alert("Erro ao remover MCP: " + err.message);
    }
  };

  const handleToggleMcp = async (server: McpServerConfig) => {
    const newStatus = server.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const updated = await saveMcpServer(
        {
          name: server.name,
          url: server.url,
          transport: server.transport,
          authToken: server.authToken,
          description: server.description,
          status: newStatus,
        },
        server.id
      );
      setMcpServers(mcpServers.map((s) => (s.id === server.id ? updated : s)));
    } catch (err: any) {
      alert("Erro ao alternar status do MCP: " + err.message);
    }
  };

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

  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <ShieldCheck className="w-10 h-10 text-amber-400 mb-4 animate-pulse" />
        <p className="text-sm text-slate-400">Verificando credenciais de Super Admin...</p>
      </div>
    );
  }

  if (!profile || profile.role !== "SUPER_ADMIN") {
    return null;
  }

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
          <div className="px-3 py-1.5 rounded-xl bg-calm-card border border-calm-border text-center shrink-0">
            <span className="text-base font-bold text-emerald-400">{knowledgeDocs.filter(d => d.isActive).length}</span>
            <span className="text-[10px] text-calm-muted block uppercase tracking-wider">
              Docs RAG
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

        <button
          onClick={() => setActiveTab("MENTOR_AI")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
            activeTab === "MENTOR_AI"
              ? "bg-calm-card text-calm-accent border border-calm-border shadow-sm"
              : "text-calm-muted hover:text-calm-text hover:bg-calm-card/40"
          }`}
        >
          <Bot className="w-4 h-4 text-emerald-400" />
          <span>Agente IA & Conhecimento</span>
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

      {/* ABA 4: AGENTE IA, BASE DE CONHECIMENTO (RAG) & CONECTORES MCP */}
      {activeTab === "MENTOR_AI" && (
        <div className="space-y-6">
          {/* Sub-navegação da IA */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-calm-border/60">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAiSubTab("PROMPT")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  aiSubTab === "PROMPT"
                    ? "bg-calm-accent/20 text-calm-accent border border-calm-accent/30"
                    : "text-calm-muted hover:text-calm-text"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Treinamento & Modelo</span>
              </button>

              <button
                onClick={() => setAiSubTab("RAG")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  aiSubTab === "RAG"
                    ? "bg-calm-accent/20 text-calm-accent border border-calm-accent/30"
                    : "text-calm-muted hover:text-calm-text"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Base de Conhecimento (RAG) ({knowledgeDocs.length})</span>
              </button>

              <button
                onClick={() => setAiSubTab("MCP")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  aiSubTab === "MCP"
                    ? "bg-calm-accent/20 text-calm-accent border border-calm-accent/30"
                    : "text-calm-muted hover:text-calm-text"
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Conectores MCP ({mcpServers.length})</span>
              </button>
            </div>

            {aiConfigFeedback && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{aiConfigFeedback}</span>
              </div>
            )}
          </div>

          {/* SUB-ABA 1: TREINAMENTO & MODELO */}
          {aiSubTab === "PROMPT" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6 border-calm-border space-y-5">
                  <div className="flex items-center justify-between border-b border-calm-border/60 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-calm-text flex items-center gap-2">
                        <Bot className="w-5 h-5 text-calm-accent" />
                        Treinamento Comportamental do Agente (System Prompt)
                      </h3>
                      <p className="text-xs text-calm-muted mt-1">
                        Defina a personalidade, tom de voz, regras de escuta ativa e metodologia socrática do Mentor Sover.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetPrompt}
                      className="text-xs border-calm-border text-calm-muted hover:text-calm-text"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Restaurar Padrão
                    </Button>
                  </div>

                  <form onSubmit={handleSaveMentorConfig} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-calm-muted block mb-1.5">
                        Instruções do Sistema (System Prompt):
                      </label>
                      <textarea
                        value={mentorConfig.systemPrompt}
                        onChange={(e) =>
                          setMentorConfig({ ...mentorConfig, systemPrompt: e.target.value })
                        }
                        rows={14}
                        className="w-full bg-white text-slate-800 border border-slate-300 rounded-xl p-3.5 text-xs font-mono font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-y leading-relaxed shadow-xs"
                        placeholder="Escreva as diretrizes comportamentais do Mentor Sover..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-calm-muted block mb-1.5">
                        Mensagem Inicial de Boas-Vindas (Nova Sessão):
                      </label>
                      <textarea
                        value={mentorConfig.welcomeMessage}
                        onChange={(e) =>
                          setMentorConfig({ ...mentorConfig, welcomeMessage: e.target.value })
                        }
                        rows={2}
                        className="w-full bg-white text-slate-800 border border-slate-300 rounded-xl p-3 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                        placeholder="Mensagem exibida ao abrir uma nova conversa..."
                      />
                    </div>

                    <div className="flex items-center justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={savingAiConfig}
                        className="bg-calm-accent text-calm-bg hover:bg-calm-accent/90 font-semibold px-6 text-xs h-9"
                      >
                        {savingAiConfig ? "Salvando..." : "Salvar Treinamento & Configurações"}
                      </Button>
                    </div>
                  </form>
                </Card>

                {/* Simulador de Teste ao Vivo */}
                <Card className="p-6 border-calm-border space-y-4">
                  <div className="border-b border-calm-border/60 pb-3">
                    <h4 className="text-sm font-bold text-calm-text flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-calm-accent" />
                      Simulador de Diálogo ao Vivo (Testar Persona)
                    </h4>
                    <p className="text-xs text-calm-muted mt-0.5">
                      Envie uma mensagem de teste para verificar em tempo real como o modelo responde com as diretrizes salvas.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendTestChat()}
                      placeholder="Ex: Tenho 43 anos e receio de não acompanhar o ritmo da IA..."
                      className="flex-1 bg-white text-slate-800 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                    />
                    <Button
                      type="button"
                      onClick={handleSendTestChat}
                      disabled={testingChat || !testPrompt.trim()}
                      className="bg-calm-card border border-calm-border hover:bg-calm-accent hover:text-calm-bg text-calm-text text-xs shrink-0"
                    >
                      {testingChat ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {testingChat ? "Consultando..." : "Testar Resposta"}
                    </Button>
                  </div>

                  {testResponse && (
                    <div className="p-4 rounded-xl bg-calm-surface/60 border border-calm-border text-xs text-calm-text whitespace-pre-wrap leading-relaxed">
                      <div className="text-[10px] text-calm-muted uppercase tracking-wider mb-2 font-mono flex items-center gap-1">
                        <Bot className="w-3 h-3 text-calm-accent" />
                        Resposta Simulada do {mentorConfig.model}:
                      </div>
                      {testResponse}
                    </div>
                  )}
                </Card>
              </div>

              {/* Coluna Lateral: Modelo, Chave Master e Parâmetros */}
              <div className="space-y-6">
                <Card className="p-5 border-calm-border space-y-4">
                  <h4 className="text-sm font-bold text-calm-text flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    Chave Master da Plataforma (Google AI Studio)
                  </h4>
                  <p className="text-xs text-calm-muted leading-relaxed">
                    Esta chave é aplicada globalmente para <strong>todos os alunos</strong> da plataforma. Gere gratuitamente em{" "}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-calm-accent underline"
                    >
                      aistudio.google.com/apikey
                    </a>.
                  </p>

                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={mentorConfig.apiKey}
                        onChange={(e) =>
                          setMentorConfig({ ...mentorConfig, apiKey: e.target.value })
                        }
                        placeholder="AIzaSy..."
                        className="w-full bg-white text-slate-800 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-medium placeholder:text-slate-400 pr-10 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-800"
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                        variant="outline"
                        className="w-full text-xs border-calm-border hover:bg-calm-surface"
                      >
                        {testingConnection ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                        )}
                        {testingConnection ? "Testando..." : "Testar Conexão"}
                      </Button>
                    </div>

                    {testResult && (
                      <div
                        className={`p-3 rounded-xl text-xs border ${
                          testResult.success
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                        }`}
                      >
                        {testResult.message}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Seletor de Modelo */}
                <Card className="p-5 border-calm-border space-y-4">
                  <h4 className="text-sm font-bold text-calm-text flex items-center gap-2">
                    <Zap className="w-4 h-4 text-calm-accent" />
                    Modelo de Inteligência Artificial
                  </h4>

                  <div className="space-y-2">
                    {[
                      {
                        id: "gemini-2.5-flash",
                        name: "Gemini 2.5 Flash",
                        badge: "Recomendado",
                        desc: "Nova geração oficial do Google. Ultra-rápido, fluência humana superior e alta taxa de resposta.",
                      },
                      {
                        id: "gemini-2.5-pro",
                        name: "Gemini 2.5 Pro",
                        badge: "Avançado",
                        desc: "Capacidade máxima de raciocínio, ideal para decisões estratégicas e mentoria executiva profunda.",
                      },
                      {
                        id: "gemini-1.5-pro",
                        name: "Gemini 1.5 Pro",
                        badge: "Executivo",
                        desc: "Janela massiva de contexto e raciocínio analítico para alta senioridade.",
                      },
                      {
                        id: "gemini-1.5-flash",
                        name: "Gemini 1.5 Flash",
                        badge: "Econômico",
                        desc: "Alta estabilidade e velocidade para diálogos rápidos.",
                      },
                    ].map((m) => (
                      <div
                        key={m.id}
                        onClick={() =>
                          setMentorConfig({ ...mentorConfig, model: m.id as GeminiModelId })
                        }
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          mentorConfig.model === m.id
                            ? "bg-calm-accent/10 border-calm-accent text-calm-text"
                            : "bg-calm-card/40 border-calm-border text-calm-muted hover:border-calm-border/80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-calm-text">{m.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-calm-card border border-calm-border text-calm-accent font-medium">
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-calm-muted mt-1">{m.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Slider de Temperatura */}
                  <div className="pt-2 border-t border-calm-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-calm-muted">Temperatura (Criatividade):</span>
                      <span className="font-mono text-calm-accent font-bold">
                        {mentorConfig.temperature}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={mentorConfig.temperature}
                      onChange={(e) =>
                        setMentorConfig({ ...mentorConfig, temperature: parseFloat(e.target.value) })
                      }
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-calm-muted">
                      <span>0.1 (Foco & Precisão)</span>
                      <span>0.7 (Empático)</span>
                      <span>1.0 (Criativo)</span>
                    </div>
                  </div>

                  {/* Toggles de RAG e MCP */}
                  <div className="pt-2 border-t border-calm-border/60 space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-calm-text">Habilitar Base RAG nas respostas:</span>
                      <input
                        type="checkbox"
                        checked={mentorConfig.ragEnabled}
                        onChange={(e) =>
                          setMentorConfig({ ...mentorConfig, ragEnabled: e.target.checked })
                        }
                        className="rounded accent-emerald-400"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-calm-text">Habilitar Servidores MCP:</span>
                      <input
                        type="checkbox"
                        checked={mentorConfig.mcpEnabled}
                        onChange={(e) =>
                          setMentorConfig({ ...mentorConfig, mcpEnabled: e.target.checked })
                        }
                        className="rounded accent-emerald-400"
                      />
                    </label>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* SUB-ABA 2: BASE DE CONHECIMENTO (RAG) */}
          {aiSubTab === "RAG" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulários de Inclusão de Conhecimento */}
              <div className="space-y-6">
                <Card className="p-6 border-calm-border space-y-4">
                  <h4 className="text-sm font-bold text-calm-text flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-calm-accent" />
                    Subir Arquivos de Conhecimento
                  </h4>
                  <p className="text-xs text-calm-muted leading-relaxed">
                    Faça upload de materiais proprietários da MicroShift (textos, cartilhas, apostilas, e-books em <code>.txt</code>, <code>.md</code>, <code>.json</code>, <code>.csv</code>).
                  </p>

                  <label className="border-2 border-dashed border-calm-border hover:border-calm-accent/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-calm-card/40 text-center">
                    <UploadCloud className="w-8 h-8 text-calm-accent mb-2" />
                    <span className="text-xs font-semibold text-calm-text">
                      {uploadingDoc ? "Processando arquivos..." : "Clique ou arraste arquivos aqui"}
                    </span>
                    <span className="text-[10px] text-calm-muted mt-1">
                      Suporta .txt, .md, .json, .csv (até 5MB)
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".txt,.md,.markdown,.json,.csv"
                      onChange={handleFileUpload}
                      disabled={uploadingDoc}
                      className="hidden"
                    />
                  </label>

                  {docFeedback && (
                    <div className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                      {docFeedback}
                    </div>
                  )}

                  {docError && (
                    <div className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                      {docError}
                    </div>
                  )}
                </Card>

                {/* Inserção Manual de Texto / Nota */}
                <Card className="p-6 border-calm-border space-y-4">
                  <h4 className="text-sm font-bold text-calm-text flex items-center gap-2">
                    <FileText className="w-4 h-4 text-calm-accent" />
                    Adicionar Nota / Diretriz Manual
                  </h4>

                  <form onSubmit={handleSaveManualDoc} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="Título do Documento ou Metodologia"
                        className="w-full bg-white text-slate-800 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
                        required
                      />
                    </div>
                    <div>
                      <textarea
                        value={manualContent}
                        onChange={(e) => setManualContent(e.target.value)}
                        rows={6}
                        placeholder="Cole o conteúdo, regras ou conceitos que o mentor deve dominar..."
                        className="w-full bg-white text-slate-800 border border-slate-300 rounded-xl p-3 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 resize-y shadow-xs"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={savingManualDoc}
                      className="w-full bg-calm-accent text-calm-bg hover:bg-calm-accent/90 text-xs font-semibold"
                    >
                      {savingManualDoc ? "Cadastrando..." : "Cadastrar na Base"}
                    </Button>
                  </form>
                </Card>
              </div>

              {/* Tabela de Documentos Cadastrados */}
              <div className="lg:col-span-2">
                <Card className="p-6 border-calm-border space-y-4">
                  <div className="flex items-center justify-between border-b border-calm-border/60 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-calm-text flex items-center gap-2">
                        <FileText className="w-4 h-4 text-calm-accent" />
                        Documentos Ativos na Base ({knowledgeDocs.length})
                      </h4>
                      <p className="text-xs text-calm-muted mt-0.5">
                        O Mentor Sover busca dinamicamente trechos desses documentos para fundamentar respostas técnicas e de metodologia.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-calm-card z-10">
                        <tr className="border-b border-calm-border text-calm-muted uppercase tracking-wider">
                          <th className="py-2.5 px-3">Título / Arquivo</th>
                          <th className="py-2.5 px-3">Tipo</th>
                          <th className="py-2.5 px-3">Tamanho</th>
                          <th className="py-2.5 px-3">Status RAG</th>
                          <th className="py-2.5 px-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-calm-border/60">
                        {knowledgeDocs.map((doc) => (
                          <tr key={doc.id} className="hover:bg-calm-cardHover/40 transition">
                            <td className="py-2.5 px-3">
                              <span className="font-medium text-calm-text block">{doc.title}</span>
                              {doc.fileName && (
                                <span className="text-[10px] text-calm-muted font-mono">{doc.fileName}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-calm-card border border-calm-border text-calm-accent">
                                {doc.fileType}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-calm-muted font-mono">
                              {doc.charCount.toLocaleString()} caracteres
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => handleToggleDoc(doc.id, doc.isActive)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold transition ${
                                  doc.isActive
                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                    : "bg-slate-700/30 text-slate-400 border border-slate-700"
                                }`}
                              >
                                {doc.isActive ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" /> Ativo
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-3 h-3" /> Pausado
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleDeleteDoc(doc.id, doc.title)}
                                className="p-1.5 rounded-md hover:bg-rose-500/20 text-calm-muted hover:text-rose-400 transition"
                                title="Excluir da Base"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

          {/* SUB-ABA 3: CONECTORES MCP (MODEL CONTEXT PROTOCOL) */}
          {aiSubTab === "MCP" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulário de Cadastro MCP */}
              <Card className="p-6 border-calm-border space-y-4">
                <div className="border-b border-calm-border/60 pb-3">
                  <h4 className="text-sm font-bold text-calm-text flex items-center gap-2">
                    <Network className="w-4 h-4 text-calm-accent" />
                    Conectar Servidor MCP
                  </h4>
                  <p className="text-xs text-calm-muted mt-0.5">
                    Integre o Mentor Sover a fontes externas, APIs corporativas e ferramentas via padrão Model Context Protocol.
                  </p>
                </div>

                <form onSubmit={handleAddMcpServer} className="space-y-3">
                  <div>
                    <label className="text-[11px] text-calm-muted block mb-1">Nome do Servidor:</label>
                    <input
                      type="text"
                      value={newMcpName}
                      onChange={(e) => setNewMcpName(e.target.value)}
                      placeholder="Ex: Servidor de Mercado Tech & Vagas"
                      className="w-full bg-white text-slate-800 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-calm-muted block mb-1">URL do Endpoint MCP:</label>
                    <input
                      type="url"
                      value={newMcpUrl}
                      onChange={(e) => setNewMcpUrl(e.target.value)}
                      placeholder="https://mcp.seudominio.com/sse"
                      className="w-full bg-white text-slate-800 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-calm-muted block mb-1">Transporte:</label>
                      <select
                        value={newMcpTransport}
                        onChange={(e) => setNewMcpTransport(e.target.value as "SSE" | "HTTP")}
                        className="w-full bg-white text-slate-800 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500 shadow-xs"
                      >
                        <option value="SSE">SSE (Server-Sent)</option>
                        <option value="HTTP">HTTP (Streamable)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-calm-muted block mb-1">Bearer Token (Opcional):</label>
                      <input
                        type="password"
                        value={newMcpToken}
                        onChange={(e) => setNewMcpToken(e.target.value)}
                        placeholder="Token secreto"
                        className="w-full bg-white text-slate-800 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-calm-muted block mb-1">Descrição das Capacidades:</label>
                    <textarea
                      value={newMcpDesc}
                      onChange={(e) => setNewMcpDesc(e.target.value)}
                      rows={2}
                      placeholder="Quais ferramentas e consultas esse MCP provê ao mentor..."
                      className="w-full bg-white text-slate-800 border border-slate-300 rounded-xl p-2.5 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
                    />
                  </div>

                  {mcpFeedback && (
                    <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                      {mcpFeedback}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={savingMcp}
                    className="w-full bg-calm-accent text-calm-bg hover:bg-calm-accent/90 text-xs font-semibold"
                  >
                    {savingMcp ? "Cadastrando..." : "Registrar Conector MCP"}
                  </Button>
                </form>
              </Card>

              {/* Lista de Servidores MCP Registrados */}
              <div className="lg:col-span-2">
                <Card className="p-6 border-calm-border space-y-4">
                  <div className="border-b border-calm-border/60 pb-3">
                    <h4 className="text-sm font-bold text-calm-text flex items-center gap-2">
                      <Network className="w-4 h-4 text-calm-accent" />
                      Servidores MCP Configurados ({mcpServers.length})
                    </h4>
                    <p className="text-xs text-calm-muted mt-0.5">
                      Quando ativados, o Mentor pode acionar os recursos desses servidores para enriquecer o contexto de carreira.
                    </p>
                  </div>

                  {mcpServers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-calm-muted">
                      Nenhum servidor MCP registrado. Adicione um conector ao lado para integrar dados externos.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mcpServers.map((server) => (
                        <div
                          key={server.id}
                          className="p-4 rounded-xl bg-calm-card/50 border border-calm-border flex items-start justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-calm-text">{server.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-calm-card border border-calm-border text-calm-accent">
                                {server.transport}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-calm-muted break-all">{server.url}</div>
                            {server.description && (
                              <p className="text-xs text-calm-muted">{server.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleToggleMcp(server)}
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                                server.status === "ACTIVE"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-slate-700/30 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {server.status === "ACTIVE" ? "Ativo" : "Pausado"}
                            </button>
                            <button
                              onClick={() => handleDeleteMcp(server.id, server.name)}
                              className="p-1.5 rounded-md hover:bg-rose-500/20 text-calm-muted hover:text-rose-400 transition"
                              title="Remover MCP"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
