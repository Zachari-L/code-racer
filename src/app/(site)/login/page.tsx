import * as React from "react";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ArcadeBackground } from "@/components/animated/ArcadeBackground";
import { AuthCard } from "@/components/auth/AuthCard";

export default function LoginPage() {
  return (
    <div className="bg-canvas text-slate-dark selection:bg-electric-lime selection:text-slate-dark relative flex min-h-screen flex-col transition-colors duration-150 dark:bg-[#111112] dark:text-zinc-100">
      <div className="arcade-bg-pattern pointer-events-none absolute inset-0" />
      <ArcadeBackground />

      <Navbar />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
        <Suspense
          fallback={
            <div className="h-96 w-full max-w-md animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
          }
        >
          <AuthCard />
        </Suspense>
      </main>
    </div>
  );
}
