"use client";

import Link from "next/link";
import { Alert, LoadingBlock, PageHeader, StatCard } from "@/components/ui";
import {
  IconAlert,
  IconCalendar,
  IconCamera,
  IconCheck,
  IconUsers,
} from "@/components/icons";
import { useApiData } from "@/lib/hooks";
import { can } from "@/lib/permissions";
import { getUser } from "@/lib/auth";

type Overview = {
  guardsStrength: number;
  attendanceNonCompliance: number;
  openInspections: number;
  expiryAlerts: number;
  openComplaints: number;
};

export default function DashboardPage() {
  const user = getUser();
  const { data, loading, error } = useApiData<Overview>("/dashboard/overview");

  return (
    <>
      <PageHeader
        eyebrow="Operations control"
        title="Security command dashboard"
        description="Monitor guard strength, attendance compliance, inspections, document expiry, and CCTV/BAS complaints in real time."
        actions={
          <>
            {can(user?.role, "guards.write") ? (
              <Link className="btn" href="/app/guards">
                Register guard
              </Link>
            ) : null}
            {can(user?.role, "reports") ? (
              <Link className="btn-secondary" href="/app/reports">
                Open reports
              </Link>
            ) : null}
          </>
        }
      />

      {error ? <Alert tone="warn">{error}. Confirm API is running, then refresh.</Alert> : null}
      {loading && !data ? <LoadingBlock label="Loading operational metrics…" /> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Active guards"
          value={data?.guardsStrength ?? "—"}
          icon={<IconUsers className="h-4 w-4" />}
          delay={30}
        />
        <StatCard
          label="Attendance pending"
          value={data?.attendanceNonCompliance ?? "—"}
          icon={<IconCalendar className="h-4 w-4" />}
          delay={60}
        />
        <StatCard
          label="Open inspections"
          value={data?.openInspections ?? "—"}
          icon={<IconCheck className="h-4 w-4" />}
          delay={90}
        />
        <StatCard
          label="Expiry alerts"
          value={data?.expiryAlerts ?? "—"}
          icon={<IconAlert className="h-4 w-4" />}
          delay={120}
        />
        <StatCard
          label="Open complaints"
          value={data?.openComplaints ?? "—"}
          icon={<IconCamera className="h-4 w-4" />}
          delay={150}
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {[
          {
            title: "Guard compliance",
            body: "Register guards, upload mandatory documents, and block non-compliant deployments.",
            href: "/app/guards",
            show: can(user?.role, "guards"),
          },
          {
            title: "Attendance & escalations",
            body: "Monthly marking, Day 1–4 escalation matrix, and Cluster Security change approvals.",
            href: "/app/attendance",
            show: can(user?.role, "attendance"),
          },
          {
            title: "Approvals & inventory",
            body: "Deployment hierarchy, inspections, and CCTV/BAS governance workflows.",
            href: "/app/deployment",
            show: can(user?.role, "deployment"),
          },
        ]
          .filter((c) => c.show)
          .map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="panel block transition hover:border-[var(--ubl-blue)] hover:shadow-md"
            >
              <div className="border-b border-[var(--line)] bg-[#f8fbfd] px-5 py-3">
                <h3 className="text-[15px] font-bold text-[var(--ubl-navy)]">{card.title}</h3>
              </div>
              <div className="p-5">
                <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">{card.body}</p>
                <p className="mt-4 text-[13px] font-bold text-[var(--ubl-blue)]">Open module →</p>
              </div>
            </Link>
          ))}
      </section>
    </>
  );
}
