"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Award, HelpCircle, Heart, Sparkles, Send, CheckCircle2 } from "lucide-react";
import { CommunityPost, PostCategory } from "@/types";
import { fetchCommunityPosts, createCommunityPost, reactToCommunityPost, getLocalPosts } from "@/lib/community";

export default function TriboPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push("/login");
    }
  }, [authLoading, profile, router]);
  const [activeTab, setActiveTab] = useState<"TODOS" | "VITORIA" | "PEDIDO_AJUDA">("TODOS");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<"VITORIA" | "PEDIDO_AJUDA">("VITORIA");
  const [submitting, setSubmitting] = useState(false);
  const [postFeedback, setPostFeedback] = useState(false);

  const loadPosts = async () => {
    const cat = activeTab === "TODOS" ? undefined : (activeTab as PostCategory);
    const cached = getLocalPosts();
    const filteredCached = cat ? cached.filter((p) => p.category === cat) : cached;
    if (filteredCached.length > 0 && posts.length === 0) {
      setPosts(filteredCached);
      setLoadingPosts(false);
    }

    try {
      const list = await fetchCommunityPosts(cat);
      setPosts(list);
    } catch (err) {
      console.error("Erro ao carregar postagens da Tribo:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [activeTab]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || submitting || !profile) return;

    try {
      setSubmitting(true);
      const created = await createCommunityPost(
        {
          uid: profile.uid,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
        },
        newCategory,
        newContent
      );
      setPosts([created, ...posts]);
      setNewContent("");
      setPostFeedback(true);
      setTimeout(() => setPostFeedback(false), 3500);
    } catch (err) {
      alert("Erro ao publicar: " + err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (postId: string, type: "forca" | "inspirador" | "aprendi") => {
    // Atualização otimista na interface
    setPosts(
      posts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            reactions: {
              ...p.reactions,
              [type]: (p.reactions[type] || 0) + 1,
            },
          };
        }
        return p;
      })
    );

    try {
      await reactToCommunityPost(postId, type);
    } catch (err) {
      console.error("Erro ao registrar reação:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <Users className="w-10 h-10 text-sky-400 mb-4 animate-pulse" />
        <p className="text-sm text-slate-400">Carregando a Tribo Silenciosa...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Cabeçalho */}
      <div className="border-b border-calm-border pb-6">
        <div className="flex items-center gap-2 text-calm-accent text-xs font-semibold uppercase tracking-wider mb-1">
          <Users className="w-4 h-4" />
          <span>Comunidade Executiva 35+</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-calm-text">
          A Tribo Silenciosa
        </h1>
        <p className="text-xs text-calm-muted mt-1">
          Sem likes tóxicos, debates inflamados ou auto-promoção vazia. Apenas celebração de micro-vitórias e apoio prático mútuo.
        </p>
      </div>

      {/* Caixa de Compartilhamento */}
      <Card>
        {postFeedback && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Sua mensagem silenciosa foi publicada na Tribo!</span>
          </div>
        )}

        <form onSubmit={handleCreatePost} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-calm-text">Compartilhar com a Tribo</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNewCategory("VITORIA")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  newCategory === "VITORIA"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-calm-muted hover:text-calm-text"
                }`}
              >
                Vitória do Dia
              </button>
              <button
                type="button"
                onClick={() => setNewCategory("PEDIDO_AJUDA")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  newCategory === "PEDIDO_AJUDA"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-calm-muted hover:text-calm-text"
                }`}
              >
                Pedido de Ajuda
              </button>
            </div>
          </div>

          <textarea
            rows={3}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={
              newCategory === "VITORIA"
                ? "Compartilhe uma micro-conquista do seu dia (ex: 15 min de estudo concluídos)..."
                : "Qual obstáculo prático você encontrou na sua transição hoje?"
            }
            className="w-full p-3.5 text-sm rounded-xl bg-calm-surface border border-calm-border text-calm-text placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent resize-none"
          />

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={submitting || !newContent.trim()} className="gap-1.5 text-xs">
              <Send className="w-3.5 h-3.5" />
              {submitting ? "Publicando..." : "Publicar Mensagem Silenciosa"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Filtro de Abas */}
      <div className="flex items-center gap-2 border-b border-calm-border pb-3">
        <button
          onClick={() => setActiveTab("TODOS")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === "TODOS"
              ? "bg-calm-card text-calm-text border border-calm-border font-semibold shadow-sm"
              : "text-calm-muted hover:text-calm-text"
          }`}
        >
          Todas as Postagens
        </button>
        <button
          onClick={() => setActiveTab("VITORIA")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
            activeTab === "VITORIA"
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold"
              : "text-calm-muted hover:text-calm-text"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Vitórias do Dia
        </button>
        <button
          onClick={() => setActiveTab("PEDIDO_AJUDA")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
            activeTab === "PEDIDO_AJUDA"
              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold"
              : "text-calm-muted hover:text-calm-text"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Pedidos de Ajuda
        </button>
      </div>

      {/* Lista de Postagens */}
      <div className="space-y-4">
        {loadingPosts ? (
          <div className="p-8 text-center text-xs text-calm-muted">
            Carregando reflexões da Tribo...
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-xs text-calm-muted">
            Nenhuma postagem nesta categoria ainda. Seja o primeiro a compartilhar sua micro-vitória!
          </div>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="hover:border-calm-borderSubtle transition">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-calm-surface border border-calm-border flex items-center justify-center text-xs font-bold text-calm-accent overflow-hidden shrink-0">
                    {post.authorPhoto ? (
                      <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" />
                    ) : (
                      post.authorName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-calm-text block leading-tight">
                      {post.authorName}
                    </span>
                    <span className="text-[10px] text-calm-muted">Membro Ativo da Tribo</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                    post.category === "VITORIA"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                  }`}
                >
                  {post.category === "VITORIA" ? "Vitória do Dia" : "Pedido de Ajuda"}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-calm-text leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Reações Calm Tech (Sem métricas de vaidade) */}
              <div className="mt-4 pt-3 border-t border-calm-border/60 flex items-center gap-2">
                <button
                  onClick={() => handleReaction(post.id!, "forca")}
                  className="px-3 py-1.5 rounded-lg bg-calm-surface hover:bg-calm-card text-xs text-calm-muted hover:text-calm-text border border-calm-border flex items-center gap-1.5 transition"
                >
                  💪 Força ({post.reactions.forca})
                </button>
                <button
                  onClick={() => handleReaction(post.id!, "inspirador")}
                  className="px-3 py-1.5 rounded-lg bg-calm-surface hover:bg-calm-card text-xs text-calm-muted hover:text-calm-text border border-calm-border flex items-center gap-1.5 transition"
                >
                  ✨ Inspirador ({post.reactions.inspirador})
                </button>
                <button
                  onClick={() => handleReaction(post.id!, "aprendi")}
                  className="px-3 py-1.5 rounded-lg bg-calm-surface hover:bg-calm-card text-xs text-calm-muted hover:text-calm-text border border-calm-border flex items-center gap-1.5 transition"
                >
                  💡 Aprendi ({post.reactions.aprendi})
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
