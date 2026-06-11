"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/context/ThemeContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 relative overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* Top action bar */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-20">
        <ThemeToggle />
        <Link href="/" className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 text-xs font-semibold text-slate-300 hover:text-slate-100 transition-colors">
          Home
        </Link>
      </div>

      {/* Decorative blurred background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-md p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size={44} className="mb-3" />
          <h1 className="text-2xl font-bold flex items-center">
            <span className="text-slate-900 dark:text-white font-black">Vendora</span>
            <span className="text-[#0E9F6E] font-medium ml-1">POS Pro</span>
          </h1>
          <p className="text-slate-400 mt-2 text-xs">Sign in to manage your business</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-800/80 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              placeholder="owner@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          New to Vendora?{" "}
          <Link
            href="/register"
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Register your business
          </Link>
        </div>
      </div>
    </div>
  );
}
