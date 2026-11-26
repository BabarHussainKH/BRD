"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveSession, SessionUser } from "@/lib/auth";
import { useToast } from "@/components/toast";
import { IconLock, IconShield } from "@/components/icons";

type LoginResponse = {
  accessToken: string;
  user: SessionUser;
};

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("superadmin@sms.local");
  const [password, setPassword] = useState("Password@123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveSession(res.accessToken, res.user);
      toast.push(`Welcome, ${res.user.fullName}`);
      router.push("/app");
    } catch (err) {
      setError((err as { message?: string }).message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <div
        className="border-b border-black/10 text-white"
        style={{ background: "linear-gradient(90deg, #021f36 0%, #032b4a 40%, #017dc5 100%)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-white text-[13px] font-bold tracking-wide text-[var(--ubl-blue)]">
              UBL
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                United Bank Limited
              </p>
              <p className="text-[14px] font-semibold">Security Management System</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-[12px] text-white/80 sm:flex">
            <IconShield className="h-4 w-4" />
            Secure corporate access
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:py-14">
        <section className="panel overflow-hidden" style={{ boxShadow: "var(--shadow-lg)" }}>
          <div
            className="relative min-h-[320px] p-8 text-white sm:p-10 lg:min-h-full"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgba(79,179,232,.28), transparent 40%), linear-gradient(160deg, #021f36 0%, #0a3f66 55%, #017dc5 120%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative flex h-full flex-col justify-between gap-10">
              <div>
                <span className="inline-flex items-center gap-2 rounded border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--ubl-red)]" />
                  Branch Banking Ops & Security
                </span>
                <h1 className="mt-5 max-w-md text-[34px] font-bold leading-[1.15] tracking-tight sm:text-[38px]">
                  Enterprise security operations, governed in one console
                </h1>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/80">
                  Guard registry, attendance escalations, deployment approvals, inspections, and
                  CCTV/BAS inventory — with full audit readiness.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["01", "Compliance", "Mandatory documents"],
                  ["02", "Workflows", "Multi-level approvals"],
                  ["03", "Oversight", "Live MIS & audit"],
                ].map(([n, t, d]) => (
                  <div key={n} className="rounded border border-white/15 bg-black/15 p-3.5 backdrop-blur-sm">
                    <p className="text-[11px] font-bold text-[var(--ubl-sky)]">{n}</p>
                    <p className="mt-1 text-[14px] font-bold">{t}</p>
                    <p className="mt-0.5 text-[12px] text-white/65">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="panel flex flex-col justify-center p-7 sm:p-9" style={{ boxShadow: "var(--shadow-lg)" }}>
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--ubl-soft)] text-[var(--ubl-blue-dark)]">
            <IconLock className="h-5 w-5" />
          </div>
          <p className="bank-eyebrow">Authorized personnel only</p>
          <h2 className="mt-2 text-[26px] font-bold tracking-tight text-[var(--ubl-navy)]">
            Sign in to console
          </h2>
          <p className="mt-2 text-[14px] text-[var(--muted)]">
            Enter your corporate credentials to continue.
          </p>

          <form className="mt-7 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="label">Corporate email</span>
              <input
                className="field"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="label">Password</span>
              <input
                className="field"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error ? (
              <p className="rounded border border-red-200 bg-[var(--ubl-red-soft)] px-3 py-2.5 text-[13px] text-[var(--ubl-red)]">
                {error}
              </p>
            ) : null}
            <button className="btn w-full" disabled={loading} type="submit">
              {loading ? "Authenticating…" : "Sign in securely"}
            </button>
          </form>

          <div className="mt-6 space-y-1.5 rounded border border-[var(--line)] bg-[#f7fafc] px-3.5 py-3 text-[12px] leading-relaxed text-[var(--ubl-navy)]">
            <p>
              <strong>Password:</strong> Password@123
            </p>
            <p>
              <strong>HO:</strong> superadmin@sms.local · security.admin@sms.local
            </p>
            <p>
              <strong>Branch:</strong> bm.clifton@sms.local · bom.clifton@sms.local · bm.saddar@sms.local
            </p>
            <p>
              <strong>Region/Cluster:</strong> roh.karachi@sms.local · cluster.security@sms.local
            </p>
          </div>
          <p className="mt-5 text-[12px] text-[var(--muted)]">
            Access is role-based and all actions are audit-logged.
          </p>
        </section>
      </div>
    </main>
  );
}
