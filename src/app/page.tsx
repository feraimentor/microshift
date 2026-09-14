"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Sparkles,
  ShieldCheck,
  Brain,
  Clock,
  Users,
  Award,
  ArrowRight,
  Zap,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const { profile } = useAuth();

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge
            variant="outline"
            className="mb-6 bg-sky-500/10 text-sky-400 border-sky-500/30 px-3.5 py-1 text-xs uppercase tracking-widest font-semibold"
          >
            Calm Tech para Profissionais 35+
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Sua bagagem profissional não é descartável.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400">
              Ela é seu maior ativo.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Faça sua transição de carreira ou atualização sênior em tecnologia e liderança ágil
            com blocos diários de <strong className="text-sky-300">15 minutos</strong>. Sem
            sobrecarga mental, sem feed viciante e com mentoria reflexiva de IA.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {profile ? (
              <>
                <Link href="/dashboard">
                  <Button size="lg" className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-base px-8 h-12 shadow-lg shadow-sky-600/25">
                    Ir para meu Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/mentor">
                  <Button size="lg" variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800 text-base px-8 h-12">
                    Acessar Mentor Sover
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login?mode=signup">
                  <Button size="lg" className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-base px-8 h-12 shadow-lg shadow-sky-600/25">
                    Criar Conta Gratuita <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800 text-base px-8 h-12">
                    Fazer Login
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Gratuito no Plano Start
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Resgate de Cupons VIP
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sem Cartão de Crédito
            </div>
          </div>
        </div>
      </section>

      {/* Os 4 Pilares */}
      <section id="pilares" className="py-20 bg-slate-950 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              Arquitetura Cognitiva Desenhada para Você
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              Tudo o que você precisa para manter o foco e evoluir, sem o estresse das redes convencionais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-900/60 border-slate-800 p-6 hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">Foco de 15 Minutos</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Timer circular com paisagens sonoras procedurais (chuva e ondas alpha 432Hz) e Modo Dia Difícil de 2 minutos para dias exaustivos.
              </p>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 p-6 hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">Mentor Reflexivo Sover</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Copiloto alimentado pelo Google Gemini 2.5 Flash, calibrado para tradução de competências prévias e fortalecimento psicológico.
              </p>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 p-6 hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">Microlearning Blindado</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aulas atômicas curtas no YouTube embed sem sugestões externas ou distrações algorítmicas, com marcação de progresso.
              </p>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 p-6 hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">Tribo 35+ e Card Social</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Espaço comunitário de Vitórias e Pedidos de Ajuda com reações ponderadas e exportador de card executivo em alta definição para o LinkedIn.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Tabela de Planos */}
      <section id="planos" className="py-20 bg-slate-900/40 border-t border-slate-800 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-2 bg-slate-800 text-slate-300 border-slate-700 text-xs">
              Planos Transparentes
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              Escolha seu Nível de Imersão
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Comece gratuitamente hoje ou ative seu cupom de degustação na área de perfil.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Start */}
            <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start</span>
                <h3 className="text-2xl font-bold text-slate-100 mt-2">R$ 0</h3>
                <p className="text-xs text-slate-400 mt-1">Acesso gratuito perpétuo</p>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1 meta diária ativa (15 min)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Acesso ao Microlearning
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Timer de Foco com som de chuva
                  </li>
                </ul>
              </div>
              <Link href={profile ? "/dashboard" : "/login?mode=signup"} className="mt-8">
                <Button variant="outline" className="w-full border-slate-700 text-slate-200">
                  {profile ? "Acessar Dashboard" : "Começar Grátis"}
                </Button>
              </Link>
            </Card>

            {/* Track */}
            <Card className="bg-slate-900 border-sky-500/50 p-6 flex flex-col justify-between relative shadow-lg shadow-sky-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-sky-500 text-slate-950 font-bold text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Recomendado
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Track</span>
                <h3 className="text-2xl font-bold text-slate-100 mt-2">R$ 47 <span className="text-xs font-normal text-slate-400">/mês</span></h3>
                <p className="text-xs text-slate-400 mt-1">Consistência e metas ilimitadas</p>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Metas diárias ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ondas Alpha 432Hz e Modo Dia Difícil
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Gerador de trilhas com IA (Roadmap)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tribo 35+ com postagens e reações
                  </li>
                </ul>
              </div>
              <Link href={profile ? "/perfil" : "/login?mode=signup"} className="mt-8">
                <Button className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold">
                  {profile ? "Ver Meu Plano" : "Aderir ao Track"}
                </Button>
              </Link>
            </Card>

            {/* Sover */}
            <Card className="bg-slate-900 border-violet-500/50 p-6 flex flex-col justify-between relative shadow-lg shadow-violet-500/10">
              <div>
                <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Sover</span>
                <h3 className="text-2xl font-bold text-slate-100 mt-2">R$ 97 <span className="text-xs font-normal text-slate-400">/mês</span></h3>
                <p className="text-xs text-slate-400 mt-1">Mentoria reflexiva executiva</p>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tudo do Plano Track
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mentor Reflexivo Sover com Gemini 2.5
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Card executivo HD para redes sociais
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Status VIP e suporte preferencial
                  </li>
                </ul>
              </div>
              <Link href={profile ? "/perfil" : "/login?mode=signup"} className="mt-8">
                <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold">
                  {profile ? "Ver Meu Plano" : "Aderir ao Sover"}
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800 bg-slate-950 text-center text-xs text-slate-400">
        <p>MicroShift © 2026. Feito com princípios Calm Tech para a comunidade de profissionais 35+.</p>
      </footer>
    </div>
  );
}
