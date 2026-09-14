"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Lock,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

export default function PerfilPage() {
  const router = useRouter();
  const { profile, loading, linkEmailPassword, redeemCoupon, isMockMode, refreshProfile } = useAuth();

  useEffect(() => {
    if (!loading && !profile) {
      router.push("/login");
    }
  }, [loading, profile, router]);

  // Estados do formulário de criação de senha
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [linkingPassword, setLinkingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Estados do formulário de cupom
  const [couponCode, setCouponCode] = useState("");
  const [redeemingCoupon, setRedeemingCoupon] = useState(false);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <User className="w-10 h-10 text-sky-400 mb-4 animate-pulse" />
        <p className="text-sm text-slate-400">Carregando dados do perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const handleLinkPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("A senha deve possuir pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas informadas não coincidem.");
      return;
    }

    try {
      setLinkingPassword(true);
      setPasswordError(null);
      await linkEmailPassword(newPassword);
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err?.message || "Falha ao vincular senha direta.");
    } finally {
      setLinkingPassword(false);
    }
  };

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) return;

    setRedeemingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const result = await redeemCoupon(cleanCode);
      setCouponSuccess(result.message);
      setCouponCode("");
    } catch (err: any) {
      setCouponError(err?.message || "Erro ao processar cupom.");
    } finally {
      setRedeemingCoupon(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-calm-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-calm-text">Configurações de Perfil</h1>
          <p className="text-xs text-calm-muted mt-1">
            Gerencie sua identidade, acesso híbrido e benefícios de assinatura.
          </p>
        </div>
        <Badge variant="plan" plan={profile.plan} planStatus={profile.planStatus} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identidade do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-calm-accent" />
              Identidade Executiva
            </CardTitle>
            <CardDescription>Dados visíveis nas interações da plataforma.</CardDescription>
          </CardHeader>

          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-calm-surface border border-calm-border flex items-center justify-center font-bold text-calm-accent overflow-hidden">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  profile.displayName.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <h4 className="font-semibold text-calm-text text-sm">{profile.displayName}</h4>
                <p className="text-calm-muted">{profile.email}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-calm-border space-y-2">
              <div>
                <span className="text-calm-muted">Posicionamento Atual:</span>
                <p className="text-calm-text font-medium mt-0.5">
                  {profile.headline || "Profissional em Transição Silenciosa"}
                </p>
              </div>
              <div>
                <span className="text-calm-muted">Objetivo de Carreira:</span>
                <p className="text-calm-accent font-medium mt-0.5">
                  {profile.targetCareer || "Tecnologia, Liderança ou Nova Rota"}
                </p>
              </div>
              <div>
                <span className="text-calm-muted">Nível de Permissão:</span>
                <div className="mt-1">
                  {profile.role === "SUPER_ADMIN" ? (
                    <Badge variant="admin" />
                  ) : (
                    <span className="font-medium text-calm-text">Membro Aluno</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Resgate de Cupons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="w-4 h-4 text-amber-400" />
              Resgate de Cupom
            </CardTitle>
            <CardDescription>
              Ative degustações estendidas (90 dias) ou acesso VIP vitalício.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleRedeemCoupon} className="space-y-3">
            {couponSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{couponSuccess}</span>
              </div>
            )}
            {couponError && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{couponError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-calm-muted mb-1">
                Código do Cupom
              </label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Ex: VIPMASTER, TRACK90"
                className="w-full px-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text uppercase placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent"
              />
            </div>

            <Button type="submit" variant="secondary" disabled={redeemingCoupon} className="w-full text-xs">
              {redeemingCoupon ? "Validando Cupom..." : "Validar e Aplicar"}
            </Button>
          </form>
        </Card>
      </div>

      {/* REQUISITO ESPECÍFICO SPEC.md: CRIAR SENHA DE ACESSO DIRETO */}
      <Card className="border-calm-accent/40">
        <CardHeader>
          <div className="flex items-center gap-2 text-calm-accent">
            <KeyRound className="w-5 h-5" />
            <CardTitle className="text-base">Criar Senha de Acesso Direto (Acesso Híbrido)</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Se você fez login social pela primeira vez com sua conta Google (como{" "}
            <strong className="text-calm-text">feraimentor@gmail.com</strong>), você pode definir
            uma senha direta aqui. Isso permitirá que você faça login em qualquer máquina apenas
            digitando seu e-mail e senha, sem exigir que sua conta Google pessoal esteja logada no navegador.
          </CardDescription>
        </CardHeader>

        {passwordSuccess ? (
          <div className="p-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Senha de acesso direto configurada com sucesso!</p>
              <p className="text-emerald-400/80 mt-0.5">
                Agora você pode autenticar via Google Social ou informando seu e-mail e esta senha.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLinkPassword} className="space-y-4 max-w-md">
            {passwordError && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-calm-muted mb-1">
                Nova Senha de Acesso Direto
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-calm-muted mb-1">
                Confirme a Nova Senha
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="w-full px-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent"
              />
            </div>

            <Button type="submit" disabled={linkingPassword} className="text-xs">
              {linkingPassword ? "Vinculando..." : "Salvar Senha Direta"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
