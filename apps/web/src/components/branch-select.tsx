"use client";

import { useEffect, useMemo, useState } from "react";
import { useApiData } from "@/lib/hooks";
import { buildQuery, PageResult } from "@/lib/list";
import { getUser } from "@/lib/auth";

type Branch = { id: string; code: string; name: string };

export function BranchSelect({
  value,
  onChange,
  required,
  disabled,
  allowEmpty = true,
  emptyLabel = "All branches",
}: {
  value: string;
  onChange: (branchId: string) => void;
  required?: boolean;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
}) {
  const user = getUser();
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");

  const path = useMemo(() => {
    // Branch-scoped users get their full set; others search/page
    const params = buildQuery({
      q: appliedQ || undefined,
      page: 1,
      pageSize: user?.branchId ? 50 : 50,
      all: user?.branchId ? "true" : undefined,
    });
    return `/admin/branches?${params}`;
  }, [appliedQ, user?.branchId]);

  const { data } = useApiData<PageResult<Branch> | Branch[]>(path, [path]);
  const items = Array.isArray(data) ? data : data?.items ?? [];

  useEffect(() => {
    if (!value && user?.branchId) onChange(user.branchId);
  }, [user?.branchId, value, onChange]);

  useEffect(() => {
    const t = setTimeout(() => setAppliedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  if (user?.branchId && items.length <= 1) {
    const b = items[0];
    return (
      <select className="field" required={required} disabled value={user.branchId} onChange={() => undefined}>
        <option value={user.branchId}>
          {b ? `${b.code} — ${b.name}` : "Assigned branch"}
        </option>
      </select>
    );
  }

  return (
    <div className="space-y-2">
      {!user?.branchId ? (
        <input
          className="field"
          placeholder="Search branch code / name"
          value={q}
          disabled={disabled}
          onChange={(e) => setQ(e.target.value)}
        />
      ) : null}
      <select
        className="field"
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {allowEmpty ? <option value="">{emptyLabel}</option> : <option value="">Select branch</option>}
        {items.map((b) => (
          <option key={b.id} value={b.id}>
            {b.code} — {b.name}
          </option>
        ))}
      </select>
    </div>
  );
}
