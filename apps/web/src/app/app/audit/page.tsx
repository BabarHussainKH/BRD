"use client";

import { useMemo, useState } from "react";
import { Alert, EmptyState, FilterBar, LoadingBlock, PageHeader, Pagination } from "@/components/ui";
import { formatDate, statusBadgeClass } from "@/lib/format";
import { useApiData } from "@/lib/hooks";
import { buildQuery, PageResult } from "@/lib/list";
import { can } from "@/lib/permissions";
import { getUser } from "@/lib/auth";

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  createdAt: string;
  ipAddress?: string | null;
  user?: { fullName: string; email: string } | null;
};

const emptyFilters = { q: "", action: "", entity: "" };

export default function AuditPage() {
  const user = getUser();
  const allowed = can(user?.role, "audit");
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const path = useMemo(
    () =>
      allowed
        ? `/audit?${buildQuery({
            page,
            pageSize,
            q: filters.q || undefined,
            action: filters.action || undefined,
            entity: filters.entity || undefined,
          })}`
        : null,
    [allowed, filters, page, pageSize],
  );

  const { data, loading, error } = useApiData<PageResult<AuditRow>>(path, [path]);

  if (!allowed) {
    return <Alert tone="danger">Your role does not have access to the audit trail.</Alert>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Compliance & governance"
        title="Full audit trail"
        description="Immutable activity log for registrations, attendance submissions, approvals, document uploads, and configuration changes."
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
          placeholder="Search user, action, entity…"
          value={draft.q}
          onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
        />
        <input
          className="field"
          placeholder="Action"
          value={draft.action}
          onChange={(e) => setDraft((p) => ({ ...p, action: e.target.value }))}
        />
        <input
          className="field"
          placeholder="Entity"
          value={draft.entity}
          onChange={(e) => setDraft((p) => ({ ...p, entity: e.target.value }))}
        />
      </FilterBar>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading && !data ? <LoadingBlock /> : null}

      <section className="panel overflow-hidden">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title="No audit events yet" />
                  </td>
                </tr>
              ) : (
                data!.items.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap text-[12px]">{formatDate(row.createdAt)}</td>
                    <td>
                      <p className="font-semibold">{row.user?.fullName ?? "System"}</p>
                      <p className="text-[12px] text-[var(--muted)]">{row.user?.email}</p>
                    </td>
                    <td>
                      <span className={statusBadgeClass(row.action)}>{row.action}</span>
                    </td>
                    <td>{row.entity}</td>
                    <td className="font-mono text-[11px] text-[var(--muted)]">
                      {row.entityId?.slice(0, 8) ?? "—"}
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
    </>
  );
}
