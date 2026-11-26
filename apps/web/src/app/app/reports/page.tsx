"use client";

import { Alert, LoadingBlock, PageHeader, StatCard } from "@/components/ui";
import { useApiData } from "@/lib/hooks";
import { getToken } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { formatDate, statusBadgeClass } from "@/lib/format";

type Strength = {
  region: string;
  cluster: string;
  branchCode: string;
  branchName: string;
  status: string;
  count: number;
};

type Expiry = {
  id: string;
  fullName: string;
  cnicNumber: string;
  cnicExpiryDate: string;
  licenseExpiryDate?: string | null;
  branch?: { code: string; name: string };
  vendor?: { name: string };
};

export default function ReportsPage() {
  const { data: strength, loading, error } = useApiData<Strength[]>("/reports/guards-strength");
  const { data: expiry } = useApiData<Expiry[]>("/reports/expiry-alerts");
  const { data: attendance } = useApiData<Array<{ id: string; status: string }>>(
    "/reports/attendance-compliance",
  );

  async function download(type: string) {
    const token = getToken();
    const res = await fetch(`${API_URL}/reports/export?type=${type}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sms-${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const active = (strength ?? []).filter((s) => s.status === "ACTIVE").reduce((a, b) => a + b.count, 0);

  return (
    <>
      <PageHeader
        eyebrow="MIS & analytics"
        title="Dashboards & reporting"
        description="Guards strength, attendance compliance, expiry alerts, inspection scores, and CCTV/BAS performance with CSV export for audit packs."
        actions={
          <>
            <button className="btn-secondary" type="button" onClick={() => void download("guards-strength")}>
              Export strength
            </button>
            <button className="btn-secondary" type="button" onClick={() => void download("expiry-alerts")}>
              Export expiry
            </button>
            <button className="btn" type="button" onClick={() => void download("attendance")}>
              Export attendance
            </button>
          </>
        }
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading && !strength ? <LoadingBlock /> : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Active guard strength" value={active} />
        <StatCard label="Expiry alerts (30d)" value={expiry?.length ?? "—"} />
        <StatCard label="Attendance periods tracked" value={attendance?.length ?? "—"} />
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-[var(--line)] px-4 py-3">
          <h3 className="text-[16px] font-semibold text-ubl-deep">Guards strength (Region / Cluster / Branch)</h3>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Cluster</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {(strength ?? []).map((r, i) => (
                <tr key={`${r.branchCode}-${r.status}-${i}`}>
                  <td>{r.region}</td>
                  <td>{r.cluster}</td>
                  <td>
                    {r.branchCode} — {r.branchName}
                  </td>
                  <td>
                    <span className={statusBadgeClass(r.status)}>{r.status}</span>
                  </td>
                  <td className="font-semibold">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-[var(--line)] px-4 py-3">
          <h3 className="text-[16px] font-semibold text-ubl-deep">Expiry alerts summary</h3>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guard</th>
                <th>CNIC expiry</th>
                <th>License expiry</th>
                <th>Branch</th>
                <th>Vendor</th>
              </tr>
            </thead>
            <tbody>
              {(expiry ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-[var(--muted)]">
                    No upcoming expiries.
                  </td>
                </tr>
              ) : (
                (expiry ?? []).map((g) => (
                  <tr key={g.id}>
                    <td>
                      <p className="font-semibold">{g.fullName}</p>
                      <p className="text-[12px] text-[var(--muted)]">{g.cnicNumber}</p>
                    </td>
                    <td>{formatDate(g.cnicExpiryDate)}</td>
                    <td>{formatDate(g.licenseExpiryDate)}</td>
                    <td>{g.branch ? `${g.branch.code}` : "—"}</td>
                    <td>{g.vendor?.name ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
