"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, CheckCircle2, Clock, Sparkles, Award } from "lucide-react";
import { MicrolearningLesson } from "@/types";
import {
  fetchMicrolearningLessons,
  fetchUserCompletedLessons,
  toggleLessonCompletion,
} from "@/lib/microlearning";

export default function MicrolearningPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push("/login");
    }
  }, [authLoading, profile, router]);
  const [lessons, setLessons] = useState<MicrolearningLesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<MicrolearningLesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLessonsAndProgress = async () => {
    try {
      setLoading(true);
      const allLessons = await fetchMicrolearningLessons();
      setLessons(allLessons);
      if (allLessons.length > 0) {
        setSelectedLesson(allLessons[0]);
      }

      if (profile?.uid) {
        const userProgress = await fetchUserCompletedLessons(profile.uid);
        setCompletedLessons(userProgress);
      }
    } catch (err) {
      console.error("Erro ao carregar microlearning:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessonsAndProgress();
  }, [profile?.uid]);

  const handleToggleCompleted = async (lessonId: string) => {
    if (!profile?.uid) return;

    // Atualização otimista
    const isCompleted = completedLessons.includes(lessonId);
    if (isCompleted) {
      setCompletedLessons(completedLessons.filter((id) => id !== lessonId));
    } else {
      setCompletedLessons([...completedLessons, lessonId]);
    }

    try {
      await toggleLessonCompletion(profile.uid, lessonId);
    } catch (err) {
      console.error("Erro ao alternar conclusão:", err);
    }
  };

  const totalCompleted = completedLessons.length;
  const progressPercent =
    lessons.length > 0 ? Math.round((totalCompleted / lessons.length) * 100) : 0;

  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <BookOpen className="w-10 h-10 text-sky-400 mb-4 animate-bounce" />
        <p className="text-sm text-slate-400">Carregando aulas blindadas...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Cabeçalho com Métricas de Aprendizagem */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-calm-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-calm-accent text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Microlearning Calm Tech</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-calm-text">
            Conhecimento Direto sem Algoritmos Tóxicos
          </h1>
          <p className="text-xs text-calm-muted mt-1">
            Aulas ultracurtas (3 a 5 minutos) sem comentários, sem recomendações laterais e sem dispersão.
          </p>
        </div>

        {/* Indicador de Progresso Geral */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-calm-card border border-calm-border shadow-sm">
          <Award className="w-5 h-5 text-amber-400" />
          <div className="text-xs">
            <span className="font-bold text-calm-text block">
              {totalCompleted} de {lessons.length} aulas concluídas
            </span>
            <div className="w-28 h-1.5 bg-calm-surface rounded-full overflow-hidden mt-1 border border-calm-border">
              <div
                className="h-full bg-calm-accent rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Player Blindado */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-calm-border bg-black shadow-calm-card">
            {selectedLesson ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${selectedLesson.youtubeId}?rel=0&modestbranding=1&controls=1&showinfo=0`}
                title={selectedLesson.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full text-calm-muted text-sm">
                Selecione uma aula na lista lateral
              </div>
            )}
          </div>

          {selectedLesson && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-calm-card border border-calm-border">
              <div>
                <span className="text-[11px] font-semibold text-calm-accent uppercase tracking-wider">
                  Módulo: {selectedLesson.moduleTitle}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-calm-text mt-0.5">
                  {selectedLesson.title}
                </h3>
                <p className="text-xs text-calm-muted mt-0.5">
                  Duração estimada: {selectedLesson.durationText}
                </p>
              </div>

              <Button
                variant={completedLessons.includes(selectedLesson.id!) ? "secondary" : "primary"}
                size="md"
                onClick={() => handleToggleCompleted(selectedLesson.id!)}
                className="shrink-0 text-xs"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {completedLessons.includes(selectedLesson.id!) ? "Aula Concluída" : "Marcar como Concluída"}
              </Button>
            </div>
          )}
        </div>

        {/* Lista de Aulas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-calm-text uppercase tracking-wider">
              Trilha de Aulas do Módulo
            </h3>
            <span className="text-[11px] text-calm-muted">{lessons.length} aulas</span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-calm-muted">Carregando aulas...</div>
            ) : (
              lessons.map((lesson) => {
                const isSelected = selectedLesson?.id === lesson.id;
                const isDone = completedLessons.includes(lesson.id!);
                return (
                  <div
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-calm-cardHover border-calm-accent text-calm-text shadow-sm"
                        : "bg-calm-card border-calm-border text-calm-muted hover:border-calm-borderSubtle hover:text-calm-text"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isDone
                            ? "bg-emerald-500/20 text-emerald-400"
                            : isSelected
                            ? "bg-calm-accent/20 text-calm-accent"
                            : "bg-calm-surface text-calm-muted"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Play className="w-3.5 h-3.5 ml-0.5" />
                        )}
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold leading-tight line-clamp-1">{lesson.title}</p>
                        <p className="text-[10px] text-calm-muted mt-0.5">
                          {lesson.moduleTitle} • {lesson.durationText}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
