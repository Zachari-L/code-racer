import * as React from "react";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
      <Suspense
        fallback={
          <div className="h-96 w-full max-w-md animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
        }
      >
        <AuthCard />
      </Suspense>
    </div>
  );
}
