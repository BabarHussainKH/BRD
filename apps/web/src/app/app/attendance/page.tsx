"use client";

import { FormEvent, useMemo, useState } from "react";
import { BranchSelect } from "@/components/branch-select";
import { Alert, EmptyState, Field, FilterBar, LoadingBlock, Modal, PageHeader, Pagination } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { statusBadgeClass, todayISO } from "@/lib/format";
import { useApiData } from "@/lib/hooks";
import { buildQuery, PageResult } from "@/lib/list";

type Branch = { id: string; code: string; name: string };
type Guard = { id: string; fullName: string; guardId: string; status: string };
type Entry = { guardId: string; fromDate: string; toDate: string; shift: "DAY" | "NIGHT"; guard?: Guard };
type Period = {
  id: string;
  month: number;
  year: number;
  status: string;
  branchId: string;
  branch?: Branch;
  entries?: Entry[];
};
type ChangeRequest = {
  id: string;
  comment: string;
  status: string;
  period?: Period;
  requestedBy?: { fullName: string };
};

const emptyFilters = { q: "", status: "", branchId: "", year: "", month: "" };

export default function AttendancePage() {
  const toast = useToast();
  const user = getUser();
  const now = new Date();
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const listPath = useMemo(
    () =>
      `/attendance/periods?${buildQuery({
        page,
        pageSize,
        q: filters.q || undefined,
        status: filters.status || undefined,
        branchId: filters.branchId || undefined,
        year: filters.year || undefined,
        month: filters.month || undefined,
      })}`,
    [filters, page, pageSize],
  );

  const { data, loading, error, reload } = useApiData<PageResult<Period>>(listPath, [listPath]);
  const canReviewChanges = [
    "CLUSTER_SECURITY_HEAD",
    "SECURITY_ADMIN",
    "SUPER_ADMIN",
    "DIVISIONAL_HEAD_SECURITY",
  ].includes(user?.role ?? "");
  const { data: changeRequests, reload: reloadCR } = useApiData<PageResult<ChangeRequest>>(
    canReviewChanges ? "/attendance/change-requests?pageSize=50" : null,
  );

  const [branchId, setBranchId] = useState(user?.branchId ?? "");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState<Period | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [busy, setBusy] = useState(false);
  const [editingChange, setEditingChange] = useState(false);
  const [changeComment, setChangeComment] = useState("");

  const periods = data?.items ?? [];

  const summary = useMemo(() => {
    const map = new Map<string, { guards: Set<string>; days: number }>();
    for (const e of entries) {
      const days = Math.max(
        1,
        Math.ceil((new Date(e.toDate).getTime() - new Date(e.fromDate).getTime()) / 86400000) + 1,
      );
      const bucket = map.get(e.shift) ?? { guards: new Set<string>(), days: 0 };
      bucket.guards.add(e.guardId);
      bucket.days += days;
      map.set(e.shift, bucket);
    }
    return Array.from(map.entries()).map(([shift, v]) => ({
      shift,
      numberOfGuards: v.guards.size,
      numberOfDays: v.days,
    }));
  }, [entries]);

  async function createPeriod(e: FormEvent) {
    e.preventDefault();
    if (!branchId) return;
    setCreating(true);
    try {
      const token = getToken();
      const period = await api<Period>("/attendance/periods", {
        method: "POST",
        token,
        body: JSON.stringify({ branchId, month, year }),
      });
      toast.push("Attendance period ready");
      await reload();
      await openPeriod(period.id);
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Failed", "danger");
    } finally {
      setCreating(false);
    }
  }

  async function openPeriod(id: string) {
    const token = getToken();
    const period = await api<Period>(`/attendance/${id}`, { token });
    setActive(period);
    setEditingChange(false);
    setChangeComment("");
    setEntries(
      (period.entries ?? []).map((e) => ({
        guardId: e.guardId,
        fromDate: e.fromDate.slice(0, 10),
        toDate: e.toDate.slice(0, 10),
        shift: e.shift,
      })),
    );
    const branchGuards = await api<PageResult<Guard>>(
      `/guards?branchId=${period.branchId}&status=ACTIVE&pageSize=100`,
      { token },
    );
    setGuards(branchGuards.items);
  }

  function addEntry() {
    const first = guards[0]?.id ?? "";
    setEntries((prev) => [
      ...prev,
      { guardId: first, fromDate: todayISO(), toDate: todayISO(), shift: "DAY" },
    ]);
  }

  async function saveDraft() {
    if (!active) return;
    setBusy(true);
    try {
      const token = getToken();
      await api(`/attendance/${active.id}/draft`, {
        method: "POST",
        token,
        body: JSON.stringify({ entries }),
      });
      toast.push("Draft saved");
      await reload();
      await openPeriod(active.id);
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Save failed", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!active) return;
    setBusy(true);
    try {
      const token = getToken();
      await api(`/attendance/${active.id}/draft`, {
        method: "POST",
        token,
        body: JSON.stringify({ entries }),
      });
      await api(`/attendance/${active.id}/submit`, { method: "POST", token });
      toast.push("Attendance submitted");
      await reload();
      setActive(null);
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Submit failed", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function submitChange() {
    if (!active) return;
    if (!changeComment.trim()) {
      toast.push("Comment is mandatory for change request", "danger");
      return;
    }
    setBusy(true);
    try {
      const token = getToken();
      await api(`/attendance/${active.id}/change-request`, {
        method: "POST",
        token,
        body: JSON.stringify({ comment: changeComment, payload: entries }),
      });
      toast.push("Change request sent to Cluster Security");
      setEditingChange(false);
      setChangeComment("");
      await reload();
      await reloadCR();
      setActive(null);
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Request failed", "danger");
    } finally {
      setBusy(false);
    }
  }

  const canEditEntries =
    !!active &&
    (active.status === "PENDING" ||
      active.status === "DRAFT" ||
      (active.status === "SUBMITTED" && editingChange));

  async function review(id: string, approve: boolean) {
    try {
      const token = getToken();
      await api(`/attendance/change-requests/${id}/review`, {
        method: "POST",
        token,
        body: JSON.stringify({
          approve,
          reviewComment: approve ? "Approved" : "Rejected",
        }),
      });
      toast.push(approve ? "Change approved" : "Change rejected");
      await reload();
      await reloadCR();
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Review failed", "danger");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Attendance & escalation"
        title="Monthly guards attendance"
        description="Mark by the 1st of each month. Day 3 escalates to DOM, Day 4 to ROH. Post-submit edits need Cluster Security approval."
      />

      <section className="panel p-5">
        <h3 className="font-display text-xl">Open / continue period</h3>
        <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={createPeriod}>
          <Field label="Branch">
            <BranchSelect
              value={branchId}
              onChange={setBranchId}
              required
              allowEmpty={false}
            />
          </Field>
          <Field label="Month">
            <input className="field" type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} />
          </Field>
          <Field label="Year">
            <input className="field" type="number" min={2020} value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </Field>
          <div className="flex items-end">
            <button className="btn w-full" disabled={creating} type="submit">
              {creating ? "Opening…" : "Open period"}
            </button>
          </div>
        </form>
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
          placeholder="Search branch code / name"
          value={draft.q}
          onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
        />
        <select className="field" value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}>
          <option value="">Status</option>
          <option value="PENDING">Pending</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="CHANGE_REQUESTED">Change requested</option>
        </select>
        <input className="field" type="number" min={1} max={12} placeholder="Month" value={draft.month} onChange={(e) => setDraft((p) => ({ ...p, month: e.target.value }))} />
        <input className="field" type="number" min={2020} placeholder="Year" value={draft.year} onChange={(e) => setDraft((p) => ({ ...p, year: e.target.value }))} />
        <div className="xl:col-span-2">
          <BranchSelect
            value={draft.branchId}
            onChange={(id) => setDraft((p) => ({ ...p, branchId: id }))}
            emptyLabel="All branches in scope"
          />
        </div>
      </FilterBar>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading && !data ? <LoadingBlock /> : null}

      <section className="panel overflow-hidden">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Entries</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {periods.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title="No attendance periods" hint="Open a month/year for a branch to begin marking." />
                  </td>
                </tr>
              ) : (
                periods.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold">
                      {String(p.month).padStart(2, "0")}/{p.year}
                    </td>
                    <td>{p.branch ? `${p.branch.code} — ${p.branch.name}` : "—"}</td>
                    <td>
                      <span className={statusBadgeClass(p.status)}>{p.status}</span>
                    </td>
                    <td>{p.entries?.length ?? 0}</td>
                    <td>
                      <button className="btn-ghost" type="button" onClick={() => void openPeriod(p.id)}>
                        Manage
                      </button>
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

      {(changeRequests?.items?.length ?? 0) > 0 ? (
        <section className="panel p-5">
          <h3 className="font-display text-xl">Pending change requests</h3>
          <div className="mt-4 space-y-3">
            {changeRequests!.items.map((cr) => (
              <div key={cr.id} className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">
                    {cr.period?.branch?.code} · {String(cr.period?.month).padStart(2, "0")}/{cr.period?.year}
                  </p>
                  <p className="text-sm text-slate-600">
                    {cr.requestedBy?.fullName}: {cr.comment}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn" type="button" onClick={() => void review(cr.id, true)}>
                    Approve
                  </button>
                  <button className="btn-danger" type="button" onClick={() => void review(cr.id, false)}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <Modal
        open={Boolean(active)}
        title={
          active
            ? `Attendance ${String(active.month).padStart(2, "0")}/${active.year}`
            : "Attendance"
        }
        onClose={() => setActive(null)}
        wide
      >
        {active ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={statusBadgeClass(active.status)}>{active.status}</span>
              <span className="text-sm text-slate-500">
                {active.branch?.code} — {active.branch?.name}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary" type="button" onClick={addEntry} disabled={!canEditEntries}>
                + Add interval
              </button>
              {active.status !== "SUBMITTED" && active.status !== "CHANGE_REQUESTED" ? (
                <>
                  <button className="btn-secondary" disabled={busy} type="button" onClick={() => void saveDraft()}>
                    Save for later
                  </button>
                  <button className="btn" disabled={busy} type="button" onClick={() => void submit()}>
                    Submit attendance
                  </button>
                </>
              ) : active.status === "SUBMITTED" && !editingChange ? (
                <button className="btn-secondary" type="button" onClick={() => setEditingChange(true)}>
                  Request change
                </button>
              ) : editingChange ? (
                <>
                  <input
                    className="field max-w-xs"
                    placeholder="Change comment (required)"
                    value={changeComment}
                    onChange={(e) => setChangeComment(e.target.value)}
                  />
                  <button className="btn" disabled={busy} type="button" onClick={() => void submitChange()}>
                    Submit change request
                  </button>
                </>
              ) : null}
            </div>

            <div className="space-y-3">
              {entries.map((e, idx) => (
                <div key={idx} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-5">
                  <select
                    className="field sm:col-span-2"
                    disabled={!canEditEntries}
                    value={e.guardId}
                    onChange={(ev) =>
                      setEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, guardId: ev.target.value } : x)))
                    }
                  >
                    {guards.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.fullName}
                      </option>
                    ))}
                  </select>
                  <input
                    className="field"
                    type="date"
                    disabled={!canEditEntries}
                    value={e.fromDate}
                    onChange={(ev) =>
                      setEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, fromDate: ev.target.value } : x)))
                    }
                  />
                  <input
                    className="field"
                    type="date"
                    disabled={!canEditEntries}
                    value={e.toDate}
                    onChange={(ev) =>
                      setEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, toDate: ev.target.value } : x)))
                    }
                  />
                  <div className="flex gap-2">
                    <select
                      className="field"
                      disabled={!canEditEntries}
                      value={e.shift}
                      onChange={(ev) =>
                        setEntries((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, shift: ev.target.value as "DAY" | "NIGHT" } : x,
                          ),
                        )
                      }
                    >
                      <option value="DAY">Day</option>
                      <option value="NIGHT">Night</option>
                    </select>
                    {canEditEntries ? (
                      <button
                        className="btn-ghost"
                        type="button"
                        onClick={() => setEntries((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {summary.length > 0 ? (
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                {summary.map((s) => (
                  <p key={s.shift}>
                    {s.shift}: {s.numberOfGuards} guards · {s.numberOfDays} days
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
