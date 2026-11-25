"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
        <p className="text-sm text-slate-400">
          {error.message || "An unexpected error occurred while rendering GitStory."}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" size="md" onClick={reset}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          <span>Try Again</span>
        </Button>
        <Link href="/">
          <Button variant="outline" size="md">
            <Home className="w-4 h-4 mr-1.5" />
            <span>Go Home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
