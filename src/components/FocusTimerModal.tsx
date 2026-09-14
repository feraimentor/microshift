"use client";

import React, { useState, useEffect, useRef } from "react";
import { HabitGoal } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  startRainSound,
  stopRainSound,
  startAlphaWaves,
  stopAlphaWaves,
  playTibetanBowlSound,
} from "@/lib/calm-audio";
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  CheckCircle2,
  HeartHandshake,
} from "lucide-react";

interface FocusTimerModalProps {
  goal: HabitGoal | null;
  isOpen: boolean;
  onClose: () => void;
  isDifficultDayMode?: boolean;
  onGoalCompleted: (goalId: string, difficultModeUsed: boolean) => Promise<void>;
}

export function FocusTimerModal({
  goal,
  isOpen,
  onClose,
  isDifficultDayMode = false,
  onGoalCompleted,
}: FocusTimerModalProps) {
  const DEFAULT_SECONDS = (goal?.targetMinutes || 15) * 60;
  const HARD_DAY_SECONDS = 120; // 2 minutos para o Modo Dia Difícil

  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_SECONDS);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [isHardDayMode, setIsHardDayMode] = useState(isDifficultDayMode);
  const [soundMode, setSoundMode] = useState<"NONE" | "RAIN" | "ALPHA">("RAIN");
  const [isFinished, setIsFinished] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializa e reseta quando o modal abre
  useEffect(() => {
    if (isOpen && goal) {
      const useDiff = Boolean(isDifficultDayMode);
      setIsHardDayMode(useDiff);
      const initial = useDiff ? HARD_DAY_SECONDS : (goal.targetMinutes || 15) * 60;
      setTotalSeconds(initial);
      setSecondsLeft(initial);
      setIsActive(false);
      setIsFinished(false);
      setSoundMode("RAIN");
    } else {
      stopAllSounds();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen, goal, isDifficultDayMode]);

  // Gerenciamento de som
  const stopAllSounds = () => {
    stopRainSound();
    stopAlphaWaves();
  };

  useEffect(() => {
    if (!isActive) {
      stopAllSounds();
      return;
    }

    if (soundMode === "RAIN") {
      stopAlphaWaves();
      startRainSound();
    } else if (soundMode === "ALPHA") {
      stopRainSound();
      startAlphaWaves();
    } else {
      stopAllSounds();
    }

    return () => {
      stopAllSounds();
    };
  }, [isActive, soundMode]);

  // Contagem regressiva
  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      handleCompleteTimer();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, secondsLeft]);

  const handleCompleteTimer = async () => {
    setIsActive(false);
    stopAllSounds();
    playTibetanBowlSound();
    setIsFinished(true);

    if (goal) {
      try {
        await onGoalCompleted(goal.id, isHardDayMode);
      } catch (err) {
        console.error("Erro ao concluir meta no timer:", err);
      }
    }
  };

  const toggleTimer = () => {
    setIsActive((prev) => !prev);
  };

  const resetTimer = () => {
    setIsActive(false);
    stopAllSounds();
    setSecondsLeft(totalSeconds);
    setIsFinished(false);
  };

  const toggleHardDayMode = () => {
    stopAllSounds();
    setIsActive(false);
    if (!isHardDayMode) {
      setIsHardDayMode(true);
      setTotalSeconds(HARD_DAY_SECONDS);
      setSecondsLeft(HARD_DAY_SECONDS);
    } else {
      setIsHardDayMode(false);
      const original = (goal?.targetMinutes || 15) * 60;
      setTotalSeconds(original);
      setSecondsLeft(original);
    }
  };

  if (!isOpen || !goal) return null;

  // Cálculo de progresso circular
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl p-6 relative flex flex-col items-center">
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título da meta */}
        <div className="text-center mb-6 max-w-[85%]">
          <Badge
            variant="outline"
            className="mb-2 bg-sky-500/10 text-sky-400 border-sky-500/30 text-[11px] uppercase tracking-wider"
          >
            {isHardDayMode ? "Modo Dia Difícil (2 Min)" : "Bloco de Foco 15 Min"}
          </Badge>
          <h3 className="text-lg font-bold text-slate-100 line-clamp-2">{goal.title}</h3>
        </div>

        {/* Círculo do Timer SVG */}
        <div className="relative w-64 h-64 flex items-center justify-center my-2">
          <svg className="w-full h-full transform -rotate-90">
            {/* Círculo de fundo */}
            <circle
              cx="128"
              cy="128"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-800 fill-none"
            />
            {/* Círculo de progresso */}
            <circle
              cx="128"
              cy="128"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              className={`fill-none transition-all duration-1000 ${
                isHardDayMode ? "text-amber-400" : "text-sky-500"
              }`}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Tempo no centro */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            {isFinished ? (
              <div className="flex flex-col items-center animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-1" />
                <span className="text-sm font-semibold text-emerald-300">Concluído!</span>
              </div>
            ) : (
              <>
                <span className="text-4xl font-mono font-bold tracking-tight text-slate-100">
                  {formattedTime}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  {isActive ? "Em andamento..." : "Pausado"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Controles de Som Procedural */}
        <div className="flex items-center gap-2 mt-4 mb-6 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 px-2 font-medium">Áudio:</span>
          <button
            onClick={() => setSoundMode("RAIN")}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
              soundMode === "RAIN"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Chuva Serena
          </button>
          <button
            onClick={() => setSoundMode("ALPHA")}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
              soundMode === "ALPHA"
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Ondas Alpha (432Hz)
          </button>
          <button
            onClick={() => setSoundMode("NONE")}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
              soundMode === "NONE"
                ? "bg-slate-800 text-slate-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Mudo
          </button>
        </div>

        {/* Botões de Ação Principal */}
        <div className="flex items-center gap-3 w-full justify-center">
          {!isFinished ? (
            <>
              <Button
                onClick={toggleTimer}
                className={`w-36 font-semibold shadow-lg ${
                  isActive
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30"
                }`}
              >
                {isActive ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" /> Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-white" /> Iniciar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={resetTimer}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                title="Reiniciar timer"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={onClose}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Fechar & Celebrar Vitória
            </Button>
          )}
        </div>

        {/* Botão Modo Dia Difícil */}
        {!isFinished && (
          <div className="mt-6 pt-4 border-t border-slate-800 w-full text-center">
            <button
              onClick={toggleHardDayMode}
              className={`text-xs flex items-center justify-center gap-1.5 mx-auto transition-colors font-medium ${
                isHardDayMode
                  ? "text-amber-400 hover:text-amber-300 underline"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {isHardDayMode
                ? "Voltar ao tempo padrão de 15 minutos"
                : "Dia exaustivo? Ativar Modo Dia Difícil (2 minutos)"}
            </button>
            <p className="text-[11px] text-slate-400 mt-1">
              "2 minutos são suficientes para blindar sua ofensiva sem culpa mental."
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
