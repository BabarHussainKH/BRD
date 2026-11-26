"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { BranchSelect } from "@/components/branch-select";
import { Alert, EmptyState, Field, FilterBar, LoadingBlock, Modal, PageHeader, Pagination } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { formatCnicInput, formatDate, statusBadgeClass, todayISO } from "@/lib/format";
import { useApiData } from "@/lib/hooks";
import { buildQuery, PageResult } from "@/lib/list";
import { can } from "@/lib/permissions";

type Vendor = { id: string; name: string };
type Branch = { id: string; code: string; name: string };
type GuardItem = {
  id: string;
  guardId: string;
  fullName: string;
  cnicNumber: string;
  status: string;
  deploymentLocation: string;
  contactMobile: string;
  vendor?: Vendor;
  branch?: Branch;
};

type FamilyMember = {
  name: string;
  cnicNumber: string;
  dateOfBirth: string;
  relation: string;
};

const emptyFamily = (): FamilyMember => ({
  name: "",
  cnicNumber: "",
  dateOfBirth: "",
  relation: "",
});

const emptyFilters = {
  q: "",
  status: "",
  cnic: "",
  location: "",
  police: "",
  nadra: "",
  vendorId: "",
  branchId: "",
};

export default function GuardsPage() {
  const toast = useToast();
  const user = getUser();
  const canWrite = can(user?.role, "guards.write");
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = buildQuery({
      page,
      pageSize,
      q: filters.q || undefined,
      status: filters.status || undefined,
      cnicNumber: filters.cnic || undefined,
      location: filters.location || undefined,
      policeVerification: filters.police || undefined,
      nadraVerisys: filters.nadra || undefined,
      vendorId: filters.vendorId || undefined,
      branchId: filters.branchId || undefined,
    });
    return `/guards?${params}`;
  }, [filters, page, pageSize]);

  const { data, loading, error, reload } = useApiData<PageResult<GuardItem>>(query, [query]);
  const { data: vendors } = useApiData<Vendor[]>("/admin/vendors");
  const { data: expiring } = useApiData<GuardItem[]>("/guards/alerts/expiring?withinDays=30");

  const [form, setForm] = useState({
    fullName: "",
    cnicNumber: "",
    cnicExpiryDate: "",
    contactMobile: "",
    vendorId: "",
    weaponType: "",
    licenseExpiryDate: "",
    guardCategory: "CIVILIAN",
    deploymentCategory: "PERMANENT",
    deploymentLocation: "",
    branchId: user?.branchId ?? "",
    dateOfJoining: todayISO(),
    trainingStatus: "YES",
    policeVerification: "YES",
    nadraVerisys: "YES",
    status: "ACTIVE",
  });
  const [family, setFamily] = useState<FamilyMember[]>([]);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyFilters() {
    setPage(1);
    setFilters({ ...draft });
  }

  function resetFilters() {
    setDraft(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const token = getToken();
      const created = await api<{ id: string }>("/guards", {
        method: "POST",
        token,
        body: JSON.stringify({
          ...form,
          licenseExpiryDate: form.licenseExpiryDate || null,
          familyMembers: family
            .filter((f) => f.name && f.relation)
            .map((f) => ({
              name: f.name,
              relation: f.relation,
              cnicNumber: f.cnicNumber || null,
              dateOfBirth: f.dateOfBirth || null,
            })),
        }),
      });
      toast.push("Guard registered successfully");
      setOpen(false);
      setFamily([]);
      await reload();
      window.location.href = `/app/guards/${created.id}`;
    } catch (err) {
      setFormError((err as { message?: string }).message ?? "Failed to register guard");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Guard registry"
        title="Security guards"
        description="Register, search, and maintain branch-wise / vendor-wise guard profiles with mandatory compliance documents."
        actions={
          canWrite ? (
            <button className="btn" type="button" onClick={() => setOpen(true)}>
              + Register guard
            </button>
          ) : null
        }
      />

      {(expiring?.length ?? 0) > 0 ? (
        <Alert tone="warn">
          {expiring!.length} active guard(s) have CNIC/license expiring within 30 days.
        </Alert>
      ) : null}

      <FilterBar onApply={applyFilters} onReset={resetFilters}>
        <input
          className="field xl:col-span-2"
          placeholder="Search name, CNIC, branch, mobile…"
          value={draft.q}
          onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
        />
        <input
          className="field"
          placeholder="CNIC#"
          value={draft.cnic}
          onChange={(e) => setDraft((p) => ({ ...p, cnic: formatCnicInput(e.target.value) }))}
        />
        <input
          className="field"
          placeholder="Location"
          value={draft.location}
          onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))}
        />
        <select className="field" value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}>
          <option value="">Status</option>
          <option value="ACTIVE">Active</option>
          <option value="REPLACED">Replaced</option>
          <option value="TERMINATED">Terminated</option>
        </select>
        <select className="field" value={draft.vendorId} onChange={(e) => setDraft((p) => ({ ...p, vendorId: e.target.value }))}>
          <option value="">Vendor</option>
          {(vendors ?? []).map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <select className="field" value={draft.police} onChange={(e) => setDraft((p) => ({ ...p, police: e.target.value }))}>
          <option value="">Police verification</option>
          <option value="YES">Yes</option>
          <option value="NO">No</option>
        </select>
        <select className="field" value={draft.nadra} onChange={(e) => setDraft((p) => ({ ...p, nadra: e.target.value }))}>
          <option value="">NADRA Verisys</option>
          <option value="YES">Yes</option>
          <option value="NO">No</option>
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
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guard</th>
                <th>CNIC / Guard ID</th>
                <th>Branch</th>
                <th>Vendor</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(data?.items?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="No guards found"
                      hint="Adjust filters or register a guard to begin."
                    />
                  </td>
                </tr>
              ) : (
                data!.items.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <p className="font-semibold text-slate-900">{g.fullName}</p>
                      <p className="text-xs text-slate-500">{g.deploymentLocation}</p>
                    </td>
                    <td>
                      <p>{g.cnicNumber}</p>
                      <p className="text-xs text-slate-500">{g.guardId}</p>
                    </td>
                    <td>{g.branch ? `${g.branch.code} — ${g.branch.name}` : "—"}</td>
                    <td>{g.vendor?.name ?? "—"}</td>
                    <td>
                      <span className={statusBadgeClass(g.status)}>{g.status}</span>
                    </td>
                    <td>
                      <Link className="btn-ghost" href={`/app/guards/${g.id}`}>
                        Open
                      </Link>
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

      <Modal open={open} title="Register security guard" onClose={() => setOpen(false)} wide>
        <form className="space-y-4" onSubmit={onCreate}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name (as per CNIC)">
              <input className="field" required value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} />
            </Field>
            <Field label="CNIC (13 digits)">
              <input
                className="field"
                required
                value={form.cnicNumber}
                onChange={(e) => setField("cnicNumber", formatCnicInput(e.target.value))}
                placeholder="XXXXX-XXXXXXX-X"
              />
            </Field>
            <Field label="CNIC expiry">
              <input className="field" type="date" required min={todayISO()} value={form.cnicExpiryDate} onChange={(e) => setField("cnicExpiryDate", e.target.value)} />
            </Field>
            <Field label="Mobile (11 digits)">
              <input className="field" required pattern="\d{11}" value={form.contactMobile} onChange={(e) => setField("contactMobile", e.target.value.replace(/\D/g, "").slice(0, 11))} />
            </Field>
            <Field label="Vendor">
              <select className="field" required value={form.vendorId} onChange={(e) => setField("vendorId", e.target.value)}>
                <option value="">Select vendor</option>
                {(vendors ?? []).map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Branch">
              <BranchSelect
                value={form.branchId}
                onChange={(branchId) => setField("branchId", branchId)}
                required
                allowEmpty={false}
                emptyLabel="Select branch"
              />
            </Field>
            <Field label="Deployment category">
              <select className="field" value={form.deploymentCategory} onChange={(e) => setField("deploymentCategory", e.target.value)}>
                <option value="PERMANENT">Permanent</option>
                <option value="REPLACEMENT">Replacement</option>
                <option value="TEMPORARY">Temporary</option>
              </select>
            </Field>
            <Field label="Guard category">
              <select className="field" value={form.guardCategory} onChange={(e) => setField("guardCategory", e.target.value)}>
                <option value="EX_SERVICE_MAN">Ex Service Man</option>
                <option value="CIVILIAN">Civilian</option>
              </select>
            </Field>
            <Field label="Weapon type">
              <input className="field" required value={form.weaponType} onChange={(e) => setField("weaponType", e.target.value)} />
            </Field>
            <Field label="License expiry">
              <input className="field" type="date" value={form.licenseExpiryDate} onChange={(e) => setField("licenseExpiryDate", e.target.value)} />
            </Field>
            <Field label="Deployment location">
              <input className="field" required value={form.deploymentLocation} onChange={(e) => setField("deploymentLocation", e.target.value)} />
            </Field>
            <Field label="Date of joining">
              <input className="field" type="date" required min={todayISO()} value={form.dateOfJoining} onChange={(e) => setField("dateOfJoining", e.target.value)} />
            </Field>
            <Field label="Training status">
              <select className="field" value={form.trainingStatus} onChange={(e) => setField("trainingStatus", e.target.value)}>
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </Field>
            <Field label="Police verification">
              <select className="field" value={form.policeVerification} onChange={(e) => setField("policeVerification", e.target.value)}>
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </Field>
            <Field label="NADRA Verisys">
              <select className="field" value={form.nadraVerisys} onChange={(e) => setField("nadraVerisys", e.target.value)}>
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </Field>
            <Field label="Status">
              <select className="field" value={form.status} onChange={(e) => setField("status", e.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="REPLACED">Replaced</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </Field>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold">Immediate family</h4>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setFamily((prev) => [...prev, emptyFamily()])}
              >
                Add member
              </button>
            </div>
            {family.length === 0 ? (
              <p className="text-sm text-slate-500">Optional. Add spouse/children/parents as needed.</p>
            ) : (
              <div className="space-y-3">
                {family.map((m, idx) => (
                  <div key={idx} className="grid gap-2 rounded-xl bg-white p-3 sm:grid-cols-5">
                    <input className="field" placeholder="Name" value={m.name} onChange={(e) => setFamily((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))} />
                    <input className="field" placeholder="CNIC" value={m.cnicNumber} onChange={(e) => setFamily((prev) => prev.map((x, i) => (i === idx ? { ...x, cnicNumber: formatCnicInput(e.target.value) } : x)))} />
                    <input className="field" type="date" value={m.dateOfBirth} onChange={(e) => setFamily((prev) => prev.map((x, i) => (i === idx ? { ...x, dateOfBirth: e.target.value } : x)))} />
                    <input className="field" placeholder="Relation" value={m.relation} onChange={(e) => setFamily((prev) => prev.map((x, i) => (i === idx ? { ...x, relation: e.target.value } : x)))} />
                    <button className="btn-ghost" type="button" onClick={() => setFamily((prev) => prev.filter((_, i) => i !== idx))}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formError ? <Alert tone="danger">{formError}</Alert> : null}
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn" disabled={saving} type="submit">{saving ? "Saving…" : "Save guard"}</button>
          </div>
          <p className="text-xs text-slate-500">After save, upload mandatory documents on the guard profile before deployment.</p>
          <p className="text-xs text-slate-400">Today: {formatDate(new Date())}</p>
        </form>
      </Modal>
    </>
  );
}
