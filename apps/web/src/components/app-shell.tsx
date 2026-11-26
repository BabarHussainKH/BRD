"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { clearSession, getToken, getUser, SessionUser } from "@/lib/auth";
import { formatRole } from "@/lib/format";
import { navForRole } from "@/lib/permissions";
import { IconBell, IconLogout, NAV_ICONS } from "@/components/icons";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [notes, setNotes] = useState<NotificationItem[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
    const token = getToken();
    api<NotificationItem[]>("/notifications", { token })
      .then(setNotes)
      .catch(() => setNotes([]));
  }, [router]);

  const unread = notes.filter((n) => !n.isRead).length;
  const nav = navForRole(user?.role);
  const pageTitle =
    nav.find((n) => pathname === n.href || (n.href !== "/app" && pathname.startsWith(n.href)))
      ?.label ?? "Dashboard";

  function logout() {
    clearSession();
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[14px] text-[var(--muted)]">
        Loading secure console…
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside
        className="sticky top-0 hidden h-screen flex-col text-white lg:flex"
        style={{ background: "linear-gradient(180deg, #021f36 0%, #032b4a 70%, #0a3f66 100%)" }}
      >
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-white text-[12px] font-bold text-[var(--ubl-blue)]">
              UBL
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                Security Ops
              </p>
              <p className="text-[14px] font-bold leading-tight">SMS Console</p>
            </div>
          </div>
        </div>

        <div className="px-3 py-3">
          <div className="rounded border border-white/10 bg-white/5 px-3 py-2.5">
            <p className="truncate text-[13px] font-semibold">{user.fullName}</p>
            <p className="mt-0.5 text-[11px] text-white/55">{formatRole(user.role)}</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-auto px-2.5 pb-3">
          <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
            Modules
          </p>
          {nav.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
            const Icon = NAV_ICONS[item.label];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${active ? "active" : ""}`}
              >
                {Icon ? <Icon className="h-[16px] w-[16px] opacity-90" /> : null}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1.5 border-t border-white/10 p-3">
          <button className="sidebar-link w-full" type="button" onClick={() => setNotesOpen((v) => !v)}>
            <IconBell className="h-4 w-4" />
            Alerts{unread ? ` (${unread})` : ""}
          </button>
          {notesOpen ? (
            <div className="max-h-32 space-y-1 overflow-auto rounded border border-white/10 bg-black/20 p-2 text-[11px]">
              {notes.length === 0 ? (
                <p className="px-1 py-2 text-white/45">No notifications</p>
              ) : (
                notes.slice(0, 5).map((n) => (
                  <div key={n.id} className="rounded bg-white/10 px-2 py-1.5">
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-white/60">{n.body}</p>
                  </div>
                ))
              )}
            </div>
          ) : null}
          <button
            className="flex w-full items-center justify-center gap-2 rounded border border-white/25 bg-white/5 px-3 py-2.5 text-[13px] font-semibold text-white/85 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
            type="button"
            onClick={logout}
          >
            <IconLogout className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-white">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                Branch Banking Operations & Security
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <h1 className="text-[17px] font-bold text-[var(--ubl-navy)]">{pageTitle}</h1>
                <span className="topbar-chip hidden sm:inline-flex">{formatRole(user.role)}</span>
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <div className="text-right">
                <p className="text-[13px] font-semibold text-[var(--ubl-navy)]">{user.fullName}</p>
                <p className="text-[11px] text-[var(--muted)]">{user.email}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ubl-navy)] text-[12px] font-bold text-white">
                {user.fullName
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            </div>
            <div className="flex gap-2 lg:hidden">
              <button className="btn-secondary" type="button" onClick={() => setNotesOpen((v) => !v)}>
                Alerts
              </button>
              <button className="btn-secondary" type="button" onClick={logout}>
                Sign out
              </button>
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto border-t border-[var(--line)] bg-[#f8fbfd] px-3 py-2 lg:hidden">
            {nav.map((item) => {
              const active =
                pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded px-3 py-1.5 text-[12px] font-semibold ${
                    active
                      ? "bg-[var(--ubl-blue)] text-white"
                      : "bg-white text-[var(--ubl-navy)] shadow-sm"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </header>

        <main className="space-y-4 px-4 py-5 sm:px-6 lg:px-7">{children}</main>
      </div>
    </div>
  );
}
