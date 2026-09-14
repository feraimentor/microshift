"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Compass, Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    profile,
  } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redireciona se já estiver autenticado
  React.useEffect(() => {
    if (profile) {
      router.push("/dashboard");
    }
  }, [profile, router]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage(err?.message || "Falha ao autenticar com Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
      router.push("/dashboard");
    } catch (err: any) {
      let msg = "Falha na autenticação.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        msg = "E-mail ou senha incorretos.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "Este e-mail já está em uso.";
      } else if (err.code === "auth/weak-password") {
        msg = "A senha deve ter pelo menos 6 caracteres.";
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Identidade */}
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-calm-accent to-sky-600 flex items-center justify-center text-calm-bg shadow-calm-glow">
            <Compass className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-calm-text">
            MicroShift
          </span>
        </Link>
        <h2 className="text-xl font-bold text-calm-text">
          {mode === "login" ? "Acesse sua conta executiva" : "Inicie sua transição silenciosa"}
        </h2>
        <p className="text-xs text-calm-muted mt-1">
          Foco de 15 minutos diários. Sem ruído, no seu próprio ritmo.
        </p>
      </div>

      {/* Card de Autenticação */}
      <Card>
        {errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Botão de Login Social Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 transition-colors shadow-sm disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.02h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.02c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.24v3.13C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.14 0 9.99 0 12s.45 3.86 1.24 5.42l4.04-3.13z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.13c.95-2.84 3.6-4.96 6.72-4.96z"
            />
          </svg>
          Continuar com Google
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-calm-border"></div>
          </div>
          <span className="relative px-3 text-[11px] font-medium uppercase tracking-wider text-calm-muted bg-calm-card">
            ou com e-mail e senha
          </span>
        </div>

        {/* Formulário de E-mail / Senha */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-medium text-calm-muted mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-calm-muted" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome executivo"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-calm-muted mb-1">
              E-mail Corporativo ou Pessoal
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-calm-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-calm-muted mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-calm-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-calm-surface border border-calm-border text-calm-text placeholder-calm-muted/50 focus:outline-none focus:border-calm-accent"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading
              ? "Processando..."
              : mode === "login"
              ? "Entrar na Plataforma"
              : "Criar Conta Silenciosa"}
          </Button>
        </form>

        {/* Alternar modo */}
        <div className="mt-5 text-center text-xs text-calm-muted">
          {mode === "login" ? (
            <span>
              Não tem uma conta?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-calm-accent font-medium hover:underline"
              >
                Cadastre-se grátis
              </button>
            </span>
          ) : (
            <span>
              Já possui conta?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-calm-accent font-medium hover:underline"
              >
                Fazer login
              </button>
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <Suspense fallback={<div className="text-calm-muted text-sm">Carregando portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
