"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Lock, ShieldAlert, ArrowLeft, Compass } from "lucide-react";
import { isSuperAdminEmail } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, isMockMode, switchDemoUser } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Compass className="w-8 h-8 text-calm-accent animate-spin mb-3" />
        <p className="text-xs text-calm-muted">Validando credenciais do Super Admin...</p>
      </div>
    );
  }

  const isSuperAdmin =
    Boolean(profile) &&
    (profile?.role === "SUPER_ADMIN" || isSuperAdminEmail(profile?.email));

  if (!isSuperAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 py-16">
        <div className="max-w-md w-full p-8 rounded-2xl border border-rose-500/30 bg-calm-card/95 text-center shadow-calm-card space-y-5">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
              Acesso Estritamente Restrito
            </span>
            <h2 className="text-xl font-bold text-calm-text mt-3">
              Ambiente Restrito ao Fundador
            </h2>
            <p className="text-xs text-calm-muted mt-2 leading-relaxed">
              O painel de governança é de acesso exclusivo para{" "}
              <strong className="text-calm-text">feraimentor@gmail.com</strong>.
              Sua conta atual não possui privilégios de Super Admin.
            </p>
          </div>

          {/* Atalho caso esteja em Modo Demonstração */}
          {isMockMode && (
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300 space-y-2 text-left">
              <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Modo Demonstração Ativo</span>
              </div>
              <p className="text-[11px] text-calm-muted">
                Para fins de teste da UI de administrador, clique no botão abaixo para simular o perfil mestre:
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs"
                onClick={() => switchDemoUser("SUPER_ADMIN")}
              >
                Alternar para Super Admin (feraimentor@gmail.com)
              </Button>
            </div>
          )}

          <div className="pt-2 border-t border-calm-border/60">
            <Link href="/dashboard">
              <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
