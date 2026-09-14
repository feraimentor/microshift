"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  BookOpen,
  Brain,
  Users,
  User,
  ShieldAlert,
  LogOut,
  Sparkles,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSuperAdmin = profile?.role === "SUPER_ADMIN";

  const loggedNavLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Compass },
    { href: "/microlearning", label: "Aulas", icon: BookOpen },
    { href: "/mentor", label: "Mentor Sover", icon: Brain },
    { href: "/tribo", label: "Tribo 35+", icon: Users },
    { href: "/perfil", label: "Perfil & Cupons", icon: User },
  ];

  const getPlanBadgeColor = (plan?: string, status?: string) => {
    if (status === "ACTIVE_VIP") return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    if (plan === "SOVER") return "bg-violet-500/20 text-violet-300 border-violet-500/40";
    if (plan === "TRACK") return "bg-sky-500/20 text-sky-300 border-sky-500/40";
    return "bg-slate-700/50 text-slate-300 border-slate-600";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo MicroShift */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-slate-100 tracking-tight">Micro</span>
            <span className="text-lg font-bold text-sky-400 tracking-tight">Shift</span>
          </div>
        </Link>

        {/* Desktop Navigation Links (SOMENTE PARA USUÁRIOS LOGADOS) */}
        {profile ? (
          <nav className="hidden md:flex items-center gap-1">
            {loggedNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-sky-400 font-semibold"
                      : "text-slate-300 hover:text-slate-100 hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            {isSuperAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border ${
                  pathname === "/admin"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                    : "text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                Painel Admin
              </Link>
            )}
          </nav>
        ) : (
          /* Navegação Pública para Visitantes */
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <Link href="/#pilares" className="hover:text-sky-400 transition-colors">
              Como Funciona
            </Link>
            <Link href="/#planos" className="hover:text-sky-400 transition-colors">
              Planos & Preços
            </Link>
          </nav>
        )}

        {/* Lado Direito: Ações */}
        <div className="hidden md:flex items-center gap-3">
          {profile ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-300 font-medium">
                {profile.displayName || profile.email}
              </span>
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-0.5 border uppercase font-medium ${getPlanBadgeColor(
                  profile.plan,
                  profile.status
                )}`}
              >
                {profile.status === "ACTIVE_VIP" ? "SOVER VIP" : profile.plan}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-slate-400 hover:text-rose-400 hover:bg-slate-900 text-xs px-2 h-8"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sair
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  Entrar
                </Button>
              </Link>
              <Link href="/login?mode=signup">
                <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-md shadow-sky-600/20">
                  Criar Conta Gratuita <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Menu Hambúrguer Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-2">
          {profile ? (
            <>
              {loggedNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-900"
                >
                  <link.icon className="w-4 h-4 text-sky-400" />
                  {link.label}
                </Link>
              ))}
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Painel Super Admin
                </Link>
              )}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Plano: <span className="text-sky-400 font-semibold">{profile.plan}</span>
                </span>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sair
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2 text-center text-sm text-slate-200 bg-slate-900 rounded-lg"
              >
                Entrar
              </Link>
              <Link
                href="/login?mode=signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2 text-center text-sm font-semibold text-white bg-sky-600 rounded-lg"
              >
                Criar Conta Gratuita
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
