"use client";

import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) return setError("We could not sign you in. Check your email and password.");
    window.location.assign("/dashboard");
  }

  return <AuthShell title="Welcome back" subtitle="Use the same secure sign-in no matter your role."><form onSubmit={submit} className="space-y-4"><Field label="Email address"><Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></Field><Field label="Password"><Input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" /></Field>{error && <p className="text-sm font-semibold text-red-600">{error}</p>}<Button className="w-full" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button></form><p className="mt-6 text-center text-sm text-slate-500">Need an account? Contact a super administrator.</p></AuthShell>;
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center bg-gradient-to-br from-forest-50 via-white to-lake-50 px-4 py-12"><Card className="w-full max-w-md p-7 sm:p-9"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-lg shadow-forest-600/20"><BrandMark className="h-8 w-8" /></span><p className="mt-4 text-sm font-extrabold uppercase tracking-widest text-forest-700">Hafi</p><h1 className="mt-2 text-3xl font-extrabold text-ink">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p><div className="mt-7">{children}</div></Card></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>{children}</label>;
}
