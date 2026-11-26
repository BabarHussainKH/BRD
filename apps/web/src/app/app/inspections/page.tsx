"use client";

import { FormEvent, useMemo, useState } from "react";
import { BranchSelect } from "@/components/branch-select";
import { Alert, EmptyState, Field, FilterBar, LoadingBlock, Modal, PageHeader, Pagination } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { statusBadgeClass } from "@/lib/format";
import { useApiData } from "@/lib/hooks";
import { buildQuery, PageResult } from "@/lib/list";

type Branch = { id: string; code: string; name: string };
type Inspection = {
  id: string;
  guardRating: string;
  observations: string;
  actionPlan?: string | null;
  isClosed: boolean;
  branch?: Branch;
};
type Dash = { openObservations: number; overdueItems: number };

const emptyFilters = { q: "", openOnly: "", rating: "", branchId: "" };

export default function InspectionsPage() {
  const toast = useToast();
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const listPath = useMemo(
    () =>
      `/inspections?${buildQuery({
        page,
        pageSize,
        q: filters.q || undefined,
        openOnly: filters.openOnly || undefined,
        rating: filters.rating || undefined,
        branchId: filters.branchId || undefined,
      })}`,
    [filters, page, pageSize],
  );

  const { data, loading, error, reload } = useApiData<PageResult<Inspection>>(listPath, [listPath]);
  const { data: dash, reload: reloadDash } = useApiData<Dash>("/inspections/dashboard");

  const [open, setOpen] = useState(false);
  const [planFor, setPlanFor] = useState<Inspection | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    branchId: "",
    guardRating: "ACCEPTABLE",
    observations: "",
  });
  const [actionPlan, setActionPlan] = useState("");

  const items = data?.items ?? [];

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const token = getToken();
      await api("/inspections", {
        method: "POST",
        token,
        body: JSON.stringify(form),
      });
      toast.push("Inspection report submitted");
      setOpen(false);
      setForm({ branchId: "", guardRating: "ACCEPTABLE", observations: "" });
      await Promise.all([reload(), reloadDash()]);
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Failed", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function submitPlan(e: FormEvent) {
    e.preventDefault();
    if (!planFor) return;
    setBusy(true);
    try {
      const token = getToken();
      await api(`/inspections/${planFor.id}/action-plan`, {
        method: "POST",
        token,
        body: JSON.stringify({ actionPlan }),
      });
      toast.push("Action plan saved");
      setPlanFor(null);
      setActionPlan("");
      await Promise.all([reload(), reloadDash()]);
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Failed", "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Branch inspections"
        title="Security inspection module"
        description="Cluster Security submits standardized performa. Branch responds with a compliance action plan. Track open and overdue observations."
        actions={
          <button className="btn" type="button" onClick={() => setOpen(true)}>
            + Submit inspection
          </button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="panel p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Open observations
          </p>
          <p className="mt-2 font-display text-4xl">{dash?.openObservations ?? "—"}</p>
        </article>
        <article className="panel p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Overdue items
          </p>
          <p className="mt-2 font-display text-4xl">{dash?.overdueItems ?? "—"}</p>
        </article>
      </section>

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
          placeholder="Search observations / branch…"
          value={draft.q}
          onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
        />
        <select className="field" value={draft.openOnly} onChange={(e) => setDraft((p) => ({ ...p, openOnly: e.target.value }))}>
          <option value="">All statuses</option>
          <option value="true">Open only</option>
        </select>
        <select className="field" value={draft.rating} onChange={(e) => setDraft((p) => ({ ...p, rating: e.target.value }))}>
          <option value="">All ratings</option>
          <option value="ABOVE_ACCEPTABLE">Above Acceptable</option>
          <option value="ACCEPTABLE">Acceptable</option>
          <option value="MARGINAL_ACCEPTABLE">Marginal Acceptable</option>
          <option value="BELOW_ACCEPTABLE">Below Acceptable</option>
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

      <section className="panel overflow-hidden">
        <div className="grid gap-4 p-4">
          {items.length === 0 ? (
            <EmptyState title="No inspections yet" hint="Cluster Security can submit the first branch inspection." />
          ) : (
            items.map((i) => (
              <article key={i.id} className="rounded-xl border border-[var(--line)] p-4 animate-fade-up">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl">
                      {i.branch ? `${i.branch.code} — ${i.branch.name}` : "Branch"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">{i.observations}</p>
                    {i.actionPlan ? (
                      <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                        Action plan: {i.actionPlan}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={i.isClosed ? "badge-ok" : "badge-warn"}>
                      {i.isClosed ? "Closed" : "Open"}
                    </span>
                    <span className={statusBadgeClass(i.guardRating)}>
                      {i.guardRating.replaceAll("_", " ")}
                    </span>
                    {!i.isClosed ? (
                      <button className="btn-secondary" type="button" onClick={() => setPlanFor(i)}>
                        Submit action plan
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
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

      <Modal open={open} title="Submit inspection report" onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={create}>
          <Field label="Branch">
            <BranchSelect
              value={form.branchId}
              onChange={(branchId) => setForm((p) => ({ ...p, branchId }))}
              required
              allowEmpty={false}
            />
          </Field>
          <Field label="Guard rating">
            <select
              className="field"
              value={form.guardRating}
              onChange={(e) => setForm((p) => ({ ...p, guardRating: e.target.value }))}
            >
              <option value="ABOVE_ACCEPTABLE">Above Acceptable</option>
              <option value="ACCEPTABLE">Acceptable</option>
              <option value="MARGINAL_ACCEPTABLE">Marginal Acceptable</option>
              <option value="BELOW_ACCEPTABLE">Below Acceptable</option>
            </select>
          </Field>
          <Field label="Observations">
            <textarea
              className="field min-h-32"
              required
              value={form.observations}
              onChange={(e) => setForm((p) => ({ ...p, observations: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn" disabled={busy} type="submit">
              Submit
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(planFor)} title="Branch compliance action plan" onClose={() => setPlanFor(null)}>
        <form className="space-y-4" onSubmit={submitPlan}>
          <Field label="Action plan">
            <textarea
              className="field min-h-32"
              required
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={() => setPlanFor(null)}>
              Cancel
            </button>
            <button className="btn" disabled={busy} type="submit">
              Save & close
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
