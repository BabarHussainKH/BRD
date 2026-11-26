"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BranchSelect } from "@/components/branch-select";
import { Alert, EmptyState, Field, FilterBar, LoadingBlock, Modal, PageHeader, Pagination } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { statusBadgeClass } from "@/lib/format";
import { useApiData } from "@/lib/hooks";
import { buildQuery, PageResult } from "@/lib/list";

type Branch = { id: string; code: string; name: string };
type Guard = { id: string; fullName: string; guardId: string };
type RequestItem = {
  id: string;
  requestType: string;
  status: string;
  currentStep: number;
  justification: string;
  referenceId?: string | null;
  deploymentId?: string | null;
  branch?: Branch;
  guard?: Guard | null;
  requester?: { fullName: string };
};

const STEP_LABELS = ["ROH / DOM", "Cluster Security", "Head Security"];
const emptyFilters = { q: "", status: "", requestType: "", branchId: "" };

export function DeploymentClient() {
  const toast = useToast();
  const user = getUser();
  const search = useSearchParams();
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const listPath = useMemo(() => {
    return `/deployment?${buildQuery({
      page,
      pageSize,
      q: filters.q || undefined,
      status: filters.status || undefined,
      requestType: filters.requestType || undefined,
      branchId: filters.branchId || undefined,
    })}`;
  }, [filters, page, pageSize]);

  const { data, loading, error, reload } = useApiData<PageResult<RequestItem>>(listPath, [listPath]);
  const { data: guards } = useApiData<PageResult<Guard>>("/guards?status=ACTIVE&pageSize=100");

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    requestType: "NEW",
    branchId: user?.branchId ?? "",
    guardId: search.get("guardId") ?? "",
    justification: "",
  });

  useEffect(() => {
    const g = search.get("guardId");
    if (g) {
      setForm((prev) => ({ ...prev, guardId: g }));
      setOpen(true);
    }
  }, [search]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const token = getToken();
      await api("/deployment", {
        method: "POST",
        token,
        body: JSON.stringify({
          requestType: form.requestType,
          branchId: form.branchId,
          justification: form.justification,
          guardId: form.guardId || null,
        }),
      });
      toast.push("Deployment request submitted");
      setOpen(false);
      setForm((prev) => ({ ...prev, justification: "", guardId: "" }));
      await reload();
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Failed", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function act(id: string, approve: boolean) {
    const comment = window.prompt(approve ? "Approval comment (optional)" : "Rejection reason") ?? "";
    if (!approve && !comment.trim()) {
      toast.push("Rejection reason is required", "danger");
      return;
    }
    try {
      const token = getToken();
      const res = await api<RequestItem>(`/deployment/${id}/act`, {
        method: "POST",
        token,
        body: JSON.stringify({ approve, comment }),
      });
      toast.push(
        approve
          ? res.status === "APPROVED"
            ? `Final approval · ${res.deploymentId}`
            : `Moved to next approval step`
          : "Request rejected",
      );
      await reload();
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Action failed", "danger");
    }
  }

  const items = data?.items ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Deployment workflow"
        title="Guard deployment requests"
        description="Digitized hiring / replacement / additional deployment with ROH → Cluster → Head Security approvals. Documents must be complete before request."
        actions={
          <button className="btn" type="button" onClick={() => setOpen(true)}>
            + New request
          </button>
        }
      />

      <FilterBar
        onApply={() => {
          setPage(1);
          setFilters({ ...draft });
        }}
        onReset={() => {
          setDraft(emptyFilters);
          setFilters(emptyFilters);
          setPage(1);
        }}
      >
        <input
          className="field xl:col-span-2"
          placeholder="Search justification, branch, guard, IDs…"
          value={draft.q}
          onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              setFilters({ ...draft, q: draft.q });
            }
          }}
        />
        <select className="field" value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}>
          <option value="">Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select className="field" value={draft.requestType} onChange={(e) => setDraft((p) => ({ ...p, requestType: e.target.value }))}>
          <option value="">Request type</option>
          <option value="NEW">New</option>
          <option value="REPLACEMENT">Replacement</option>
          <option value="ADDITIONAL">Additional</option>
        </select>
        <div className="xl:col-span-2">
          <BranchSelect
            value={draft.branchId}
            onChange={(branchId) => setDraft((p) => ({ ...p, branchId }))}
            emptyLabel="All branches in scope"
          />
        </div>
      </FilterBar>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading && !data ? <LoadingBlock /> : null}

      <section className="grid gap-3 sm:grid-cols-3">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="panel p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Step {i + 1}
            </p>
            <p className="mt-1 font-semibold text-slate-900">{label}</p>
          </div>
        ))}
      </section>

      <section className="panel overflow-hidden">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Branch / Guard</th>
                <th>Progress</th>
                <th>Status</th>
                <th>IDs</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="No deployment requests"
                      hint="Create a request after guard documents are compliant."
                    />
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <p className="font-semibold">{r.requestType}</p>
                      <p className="text-xs text-slate-500">{r.requester?.fullName}</p>
                    </td>
                    <td>
                      <p>{r.branch ? `${r.branch.code} — ${r.branch.name}` : "—"}</p>
                      <p className="text-xs text-slate-500">{r.guard?.fullName ?? "No guard linked"}</p>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {STEP_LABELS.map((_, i) => (
                          <span
                            key={i}
                            className={`h-2 w-8 rounded-full ${
                              i < r.currentStep || r.status === "APPROVED"
                                ? "bg-teal-600"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {r.status === "APPROVED" ? "Complete" : STEP_LABELS[Math.max(0, r.currentStep - 1)]}
                      </p>
                    </td>
                    <td>
                      <span className={statusBadgeClass(r.status)}>{r.status}</span>
                    </td>
                    <td className="text-xs">
                      <div>{r.referenceId ?? "—"}</div>
                      <div>{r.deploymentId ?? ""}</div>
                    </td>
                    <td>
                      {r.status === "PENDING" ? (
                        <div className="flex gap-1">
                          <button className="btn-ghost" type="button" onClick={() => void act(r.id, true)}>
                            Approve
                          </button>
                          <button
                            className="btn-ghost text-red-700"
                            type="button"
                            onClick={() => void act(r.id, false)}
                          >
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={data?.page ?? page}
          pageSize={data?.pageSize ?? pageSize}
          total={data?.total ?? 0}
          totalPages={data?.totalPages ?? 1}
          disabled={loading}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>

      <Modal open={open} title="Create deployment request" onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={create}>
          <Field label="Request type">
            <select
              className="field"
              value={form.requestType}
              onChange={(e) => setForm((p) => ({ ...p, requestType: e.target.value }))}
            >
              <option value="NEW">New guard</option>
              <option value="REPLACEMENT">Replacement</option>
              <option value="ADDITIONAL">Additional</option>
            </select>
          </Field>
          <Field label="Branch">
            <BranchSelect
              value={form.branchId}
              onChange={(branchId) => setForm((p) => ({ ...p, branchId }))}
              required
              allowEmpty={false}
            />
          </Field>
          <Field label="Guard (required for compliance check)">
            <select
              className="field"
              value={form.guardId}
              onChange={(e) => setForm((p) => ({ ...p, guardId: e.target.value }))}
            >
              <option value="">Select later / optional</option>
              {(guards?.items ?? []).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.fullName} ({g.guardId})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Justification">
            <textarea
              className="field min-h-28"
              required
              minLength={10}
              value={form.justification}
              onChange={(e) => setForm((p) => ({ ...p, justification: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn" disabled={busy} type="submit">
              {busy ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
