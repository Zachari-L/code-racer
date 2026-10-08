"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  User,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { registerUser } from "@/server/actions/auth";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function AuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Active view: "main" (social + guest + password button) or "credentials" (inputs)
  const [view, setView] = React.useState<"main" | "credentials">(
    searchParams.get("mode") === "register" || searchParams.get("mode") === "credentials"
      ? "credentials"
      : "main"
  );
  const [mode, setMode] = React.useState<"login" | "register">(initialMode);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim() || !password) {
      setError(t("auth.errorInvalid"));
      return;
    }

    if (mode === "register") {
      if (password !== confirmPassword) {
        setError(t("auth.passwordMismatch"));
        return;
      }

      setIsLoading(true);
      const regResult = await registerUser({
        username: username.trim(),
        password,
      });

      if (!regResult.success) {
        setIsLoading(false);
        setError(regResult.error ?? t("auth.errorUserExists"));
        return;
      }

      setSuccess(t("auth.successRegistered"));

      // Auto sign-in right after registration
      const signInResult = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      setIsLoading(false);

      if (signInResult?.error) {
        setMode("login");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } else {
      setIsLoading(true);
      const res = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });
      setIsLoading(false);

      if (res?.error) {
        setError(t("auth.errorInvalid"));
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    }
  }

  function handleSocialSignIn(provider: "discord" | "github") {
    signIn(provider, { callbackUrl });
  }

  return (
    <Card className="relative w-full max-w-md bg-white p-3 sm:p-5 dark:bg-zinc-900">
      <CardHeader className="pb-3 text-center">
        <CardTitle className="text-slate-dark text-2xl font-black uppercase sm:text-3xl dark:text-white">
          {view === "main"
            ? t("auth.loginTitle")
            : mode === "login"
              ? t("auth.loginTitle")
              : t("auth.registerTitle")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {view === "main" ? (
            /* ============================================================ */
            /* VUE 1 : DISCORD / GITHUB (HAUT) + INVITÉ & MOT DE PASSE (BAS) */
            /* ============================================================ */
            <motion.div
              key="main-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* SECTION HAUT : PRIORITÉ SOCIALE (DISCORD & GITHUB) */}
              <div className="space-y-2.5">
                <span className="text-slate-dark flex items-center gap-1.5 text-xs font-black tracking-wider uppercase dark:text-zinc-200">
                  <Sparkles className="text-tangerine-orange h-3.5 w-3.5" />
                  {t("auth.socialTitle")}
                </span>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialSignIn("discord")}
                    className="group border-slate-dark arcade-shadow h-12 w-full gap-2 border-3 bg-[#5865F2]/10 text-xs font-black text-[#5865F2] hover:bg-[#5865F2] hover:text-white dark:border-zinc-700 dark:bg-[#5865F2]/20 dark:hover:bg-[#5865F2] dark:hover:text-white"
                  >
                    <DiscordIcon className="h-4 w-4 text-[#5865F2] transition-colors group-hover:text-white" />
                    <span>{t("auth.discord")}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialSignIn("github")}
                    className="group border-slate-dark arcade-shadow h-12 w-full gap-2 border-3 bg-zinc-100 text-xs font-black text-slate-900 hover:bg-slate-900 hover:text-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                  >
                    <GithubIcon className="text-slate-dark h-4 w-4 transition-colors group-hover:text-white dark:text-white" />
                    <span>{t("auth.github")}</span>
                  </Button>
                </div>
              </div>

              {/* DIVISEUR NET SANS CHEVAUCHEMENT */}
              <div className="my-3 flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-zinc-200 dark:bg-zinc-800" />
                <span className="shrink-0 text-[10px] font-black tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
                  {t("auth.otherOptions")}
                </span>
                <div className="h-[2px] flex-1 bg-zinc-200 dark:bg-zinc-800" />
              </div>

              {/* SECTION BAS (MÊME SECTION) : INVITÉ ET CONNEXION PAR MOT DE PASSE */}
              <div className="space-y-2.5">
                {/* 1. Bouton Jouer en tant qu'invité */}
                <Link href="/" className="block">
                  <Button
                    type="button"
                    variant="azure"
                    size="lg"
                    className="w-full gap-2 text-xs font-black uppercase"
                  >
                    <Zap className="h-4 w-4" />
                    <span>{t("auth.playAsGuestBtn")}</span>
                  </Button>
                </Link>

                {/* 2. Bouton Connexion par mot de passe (bascule vers la vue inputs) */}
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setView("credentials");
                    setError(null);
                  }}
                  className="border-slate-dark arcade-shadow w-full gap-2 border-3 text-xs font-black uppercase hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <KeyRound className="text-tangerine-orange h-4 w-4" />
                  <span>{t("auth.loginWithPassword")}</span>
                </Button>
              </div>
            </motion.div>
          ) : (
            /* ============================================================ */
            /* VUE 2 : LES INPUTS DE NOM D'UTILISATEUR ET MOT DE PASSE      */
            /* ============================================================ */
            <motion.div
              key="credentials-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Bouton Retour aux options */}
              <button
                type="button"
                onClick={() => {
                  setView("main");
                  setError(null);
                }}
                className="hover:text-slate-dark flex cursor-pointer items-center gap-1.5 text-xs font-black text-zinc-500 transition-colors dark:text-zinc-400 dark:hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{t("auth.backToOptions")}</span>
              </button>

              {/* Onglets Connexion vs Inscription */}
              <div className="border-slate-dark arcade-shadow flex items-center rounded-full border-2 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className={`flex-1 cursor-pointer rounded-full py-1 text-xs font-black transition-all ${
                    mode === "login"
                      ? "text-slate-dark bg-white shadow-sm dark:bg-zinc-900 dark:text-white"
                      : "hover:text-slate-dark text-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {t("auth.tabLogin")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className={`flex-1 cursor-pointer rounded-full py-1 text-xs font-black transition-all ${
                    mode === "register"
                      ? "text-slate-dark bg-white shadow-sm dark:bg-zinc-900 dark:text-white"
                      : "hover:text-slate-dark text-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {t("auth.tabRegister")}
                </button>
              </div>

              {/* Formulaire Credentials (Inputs) */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-slate-dark mb-1 flex items-center gap-1.5 text-xs font-black tracking-wider uppercase dark:text-zinc-200">
                    <User className="text-azure-blue h-3.5 w-3.5" />
                    {t("auth.usernameLabel")}
                  </label>
                  <Input
                    type="text"
                    autoComplete="username"
                    placeholder={t("auth.usernamePlaceholder")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    accentColor="azure"
                    className="font-mono text-sm"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-dark mb-1 flex items-center gap-1.5 text-xs font-black tracking-wider uppercase dark:text-zinc-200">
                    <Lock className="text-tangerine-orange h-3.5 w-3.5" />
                    {t("auth.passwordLabel")}
                  </label>
                  <Input
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder={t("auth.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    accentColor="orange"
                    className="font-mono text-sm"
                    required
                  />
                </div>

                {mode === "register" && (
                  <div>
                    <label className="text-slate-dark mb-1 flex items-center gap-1.5 text-xs font-black tracking-wider uppercase dark:text-zinc-200">
                      <Lock className="text-victory-teal h-3.5 w-3.5" />
                      {t("auth.confirmPassword")}
                    </label>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder={t("auth.passwordPlaceholder")}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      accentColor="lime"
                      className="font-mono text-sm"
                      required
                    />
                  </div>
                )}

                {/* Feedback Alerts */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-arcade-magenta bg-arcade-magenta/10 text-arcade-magenta flex items-center gap-2 rounded-2xl border-2 p-2.5 text-xs font-black"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-victory-teal bg-victory-teal/10 text-victory-teal flex items-center gap-2 rounded-2xl border-2 p-2.5 text-xs font-black"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bouton de validation */}
                <Button
                  type="submit"
                  variant="lime"
                  size="lg"
                  disabled={isLoading}
                  className="w-full gap-2 text-sm uppercase"
                >
                  {isLoading ? (
                    <span>{t("auth.submitting")}</span>
                  ) : (
                    <>
                      <span>{mode === "login" ? t("auth.loginBtn") : t("auth.registerBtn")}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* Lien bascule rapide Connexion <-> Inscription */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "login" ? "register" : "login");
                      setError(null);
                    }}
                    className="cursor-pointer text-xs font-black text-zinc-500 underline underline-offset-4 transition-colors hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                  >
                    {mode === "login" ? t("auth.noAccountPrompt") : t("auth.hasAccountPrompt")}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
