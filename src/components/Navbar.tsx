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
  Clock,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { profile, logout, isMockMode, switchDemoUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSuperAdmin = profile?.role === "SUPER_ADMIN";

  const navLinks = [
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-slate-100 tracking-tight">Micro</span>
            <span className="text-lg font-bold text-sky-400 tracking-tight">Shift</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
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

        {/* Right side status / buttons */}
        <div className="hidden md:flex items-center gap-3">
          {profile ? (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-0.5 border uppercase font-medium ${getPlanBadgeColor(
                  profile.plan,
                  profile.status
                )}`}
              >
                {profile.status === "ACTIVE_VIP" ? "SOVER VIP" : profile.plan}
              </Badge>

              {/* Demo Mode switcher */}
              {isMockMode && (
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
                  <span className="text-slate-400 text-[10px] uppercase font-mono px-1">Demo:</span>
                  <button
                    onClick={() => switchDemoUser("SUPER_ADMIN")}
                    className={`px-1.5 py-0.5 rounded text-[11px] ${
                      profile.role === "SUPER_ADMIN" ? "bg-amber-500/30 text-amber-200" : "text-slate-400"
                    }`}
                    title="Alternar para Super Admin"
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => switchDemoUser("START")}
                    className={`px-1.5 py-0.5 rounded text-[11px] ${
                      profile.plan === "START" ? "bg-sky-500/30 text-sky-200" : "text-slate-400"
                    }`}
                    title="Alternar para Start"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => switchDemoUser("SOVER")}
                    className={`px-1.5 py-0.5 rounded text-[11px] ${
                      profile.plan === "SOVER" && profile.role !== "SUPER_ADMIN"
                        ? "bg-violet-500/30 text-violet-200"
                        : "text-slate-400"
                    }`}
                    title="Alternar para Sover"
                  >
                    Sover
                  </button>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-900 text-xs px-2 h-8"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white font-medium">
                Entrar
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu hamburger button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
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
          {profile && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Plano: <span className="text-sky-400 font-semibold">{profile.plan}</span>
              </span>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-red-400 hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Sair
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
