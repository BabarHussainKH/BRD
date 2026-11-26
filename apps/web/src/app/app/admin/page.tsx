"use client";

import { FormEvent, useMemo, useState } from "react";
import { Alert, EmptyState, Field, LoadingBlock, PageHeader, Pagination } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useApiData } from "@/lib/hooks";
import { buildQuery, PageResult } from "@/lib/list";

type Lov = { id: string; category: string; code: string; label: string };
type Vendor = { id: string; name: string };
type Branch = { id: string; code: string; name: string; cluster?: { name: string; region?: { name: string } } };
type Config = { key: string; value: unknown } | null;

export default function AdminPage() {
  const toast = useToast();
  const [branchQ, setBranchQ] = useState("");
  const [appliedBranchQ, setAppliedBranchQ] = useState("");
  const [branchPage, setBranchPage] = useState(1);
  const branchPath = useMemo(
    () =>
      `/admin/branches?${buildQuery({
        q: appliedBranchQ || undefined,
        page: branchPage,
        pageSize: 20,
      })}`,
    [appliedBranchQ, branchPage],
  );
  const { data: lovs, loading, error, reload: reloadLov } = useApiData<Lov[]>("/admin/lov");
  const { data: vendors, reload: reloadVendors } = useApiData<Vendor[]>("/admin/vendors");
  const { data: branches } = useApiData<PageResult<Branch>>(branchPath, [branchPath]);
  const { data: attendanceCfg, reload: reloadCfg } = useApiData<Config>(
    "/admin/config?key=attendance_escalation",
  );

  const [vendorName, setVendorName] = useState("");
  const [lov, setLov] = useState({ category: "DEPLOYMENT_CATEGORY", code: "", label: "" });
  const [busy, setBusy] = useState(false);

  async function addVendor(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const token = getToken();
      await api("/admin/vendors", {
        method: "POST",
        token,
        body: JSON.stringify({ name: vendorName }),
      });
      toast.push("Vendor added");
      setVendorName("");
      await reloadVendors();
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Failed", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function addLov(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const token = getToken();
      await api("/admin/lov", {
        method: "POST",
        token,
        body: JSON.stringify(lov),
      });
      toast.push("LOV saved");
      setLov((p) => ({ ...p, code: "", label: "" }));
      await reloadLov();
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Failed", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function saveEscalation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const token = getToken();
      await api("/admin/config", {
        method: "PUT",
        token,
        body: JSON.stringify({
          key: "attendance_escalation",
          value: {
            day1Reminder: true,
            day2Reminder: true,
            day3: String(fd.get("day3")),
            day4: String(fd.get("day4")),
          },
        }),
      });
      toast.push("Escalation matrix updated");
      await reloadCfg();
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Failed", "danger");
    } finally {
      setBusy(false);
    }
  }

  const cfg = (attendanceCfg?.value ?? {}) as {
    day3?: string;
    day4?: string;
  };

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Admin & configuration"
        description="Manage vendors, LOVs, branches, and escalation matrix used across attendance and registration TAT."
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading && !lovs ? <LoadingBlock /> : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="panel overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="font-display text-xl">Branches</h3>
            <div className="mt-3 flex gap-2">
              <input
                className="field"
                placeholder="Search code / name / region"
                value={branchQ}
                onChange={(e) => setBranchQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setBranchPage(1);
                    setAppliedBranchQ(branchQ.trim());
                  }
                }}
              />
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  setBranchPage(1);
                  setAppliedBranchQ(branchQ.trim());
                }}
              >
                Search
              </button>
            </div>
          </div>
          <ul className="max-h-72 space-y-2 overflow-auto px-5 text-sm">
            {(branches?.items ?? []).map((b) => (
              <li key={b.id} className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="font-semibold">
                  {b.code} — {b.name}
                </p>
                <p className="text-xs text-slate-500">
                  {b.cluster?.region?.name} · {b.cluster?.name}
                </p>
              </li>
            ))}
            {(branches?.items.length ?? 0) === 0 ? <EmptyState title="No branches" /> : null}
          </ul>
          <Pagination
            page={branches?.page ?? branchPage}
            pageSize={branches?.pageSize ?? 20}
            total={branches?.total ?? 0}
            totalPages={branches?.totalPages ?? 1}
            onPageChange={setBranchPage}
          />
        </section>

        <section className="panel p-5">
          <h3 className="font-display text-xl">Vendors</h3>
          <form className="mt-4 flex gap-2" onSubmit={addVendor}>
            <input
              className="field"
              required
              placeholder="Vendor name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
            <button className="btn" disabled={busy} type="submit">
              Add
            </button>
          </form>
          <ul className="mt-4 max-h-72 space-y-2 overflow-auto text-sm">
            {(vendors ?? []).map((v) => (
              <li key={v.id} className="rounded-xl bg-slate-50 px-3 py-2">
                {v.name}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5">
          <h3 className="font-display text-xl">List of values</h3>
          <form className="mt-4 space-y-2" onSubmit={addLov}>
            <Field label="Category">
              <input
                className="field"
                required
                value={lov.category}
                onChange={(e) => setLov((p) => ({ ...p, category: e.target.value }))}
              />
            </Field>
            <Field label="Code">
              <input
                className="field"
                required
                value={lov.code}
                onChange={(e) => setLov((p) => ({ ...p, code: e.target.value }))}
              />
            </Field>
            <Field label="Label">
              <input
                className="field"
                required
                value={lov.label}
                onChange={(e) => setLov((p) => ({ ...p, label: e.target.value }))}
              />
            </Field>
            <button className="btn w-full" disabled={busy} type="submit">
              Save LOV
            </button>
          </form>
          <ul className="mt-4 max-h-56 space-y-2 overflow-auto text-sm">
            {(lovs ?? []).map((l) => (
              <li key={l.id} className="rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-slate-500">{l.category}</span> · {l.label}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel p-5 sm:p-6">
        <h3 className="font-display text-xl">Attendance escalation matrix</h3>
        <p className="mt-2 text-sm text-slate-600">
          Day 1–2 reminders, Day 3 DOM, Day 4 ROH (configurable).
        </p>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={saveEscalation}>
          <Field label="Day 3 escalate to">
            <select className="field" name="day3" defaultValue={cfg.day3 ?? "DISTRICT_OPERATIONS_MANAGER"}>
              <option value="DISTRICT_OPERATIONS_MANAGER">District Operations Manager</option>
              <option value="REGIONAL_OPERATIONS_MANAGER">Regional Operations Manager</option>
              <option value="CLUSTER_SECURITY_HEAD">Cluster Security Head</option>
            </select>
          </Field>
          <Field label="Day 4 escalate to">
            <select className="field" name="day4" defaultValue={cfg.day4 ?? "REGIONAL_OPERATIONS_MANAGER"}>
              <option value="REGIONAL_OPERATIONS_MANAGER">Regional Operations Manager</option>
              <option value="DIVISIONAL_HEAD_SECURITY">Divisional Head Security</option>
              <option value="SECURITY_ADMIN">Security Admin</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <button className="btn" disabled={busy} type="submit">
              Save escalation matrix
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
