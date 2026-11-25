import React from "react";
import Link from "next/link";
import { GitBranch, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
        <GitBranch className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">404 — Page Not Found</h1>
        <p className="text-sm text-slate-400">
          We could not find that GitStory route. Search for any public GitHub repository from the home page.
        </p>
      </div>
      <Link href="/">
        <Button variant="primary" size="md">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Back to GitStory Home</span>
        </Button>
      </Link>
    </div>
  );
}
