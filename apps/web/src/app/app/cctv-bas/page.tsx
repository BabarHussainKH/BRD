"use client";

import { FormEvent, useMemo, useState } from "react";
import { BranchSelect } from "@/components/branch-select";
import { Alert, EmptyState, Field, FilterBar, LoadingBlock, Modal, PageHeader, Pagination } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { statusBadgeClass, todayISO } from "@/lib/format";
import { useApiData } from "@/lib/hooks";
import { buildQuery, PageResult } from "@/lib/list";

type Branch = { id: string; code: string; name: string };
type Inventory = {
  id: string;
  basVendorName: string;
  dedicatedPtclLine: string;
  basSimNumber?: string | null;
  recorderType: string;
  cameraCount: number;
  recordingDays: number;
  warrantyStatus: string;
  mirroringStatus: string;
  installationDate?: string | null;
  branch?: Branch;
};
type Complaint = {
  id: string;
  ticketNumber: string;
  category: string;
  status: string;
  complaintDate: string;
  comments?: string | null;
  branch?: Branch;
};

const emptyInvFilters = { q: "", branchCode: "", vendorName: "" };
const emptyCompFilters = { q: "", status: "", category: "" };

export default function CctvBasPage() {
  const toast = useToast();
  const [invDraft, setInvDraft] = useState(emptyInvFilters);
  const [invFilters, setInvFilters] = useState(emptyInvFilters);
  const [invPage, setInvPage] = useState(1);
  const [invPageSize, setInvPageSize] = useState(20);

  const [compDraft, setCompDraft] = useState(emptyCompFilters);
  const [compFilters, setCompFilters] = useState(emptyCompFilters);
  const [compPage, setCompPage] = useState(1);
  const [compPageSize, setCompPageSize] = useState(20);

  const invPath = useMemo(
    () =>
      `/cctv-bas/inventory?${buildQuery({
        page: invPage,
        pageSize: invPageSize,
        q: invFilters.q || undefined,
        branchCode: invFilters.branchCode || undefined,
        vendorName: invFilters.vendorName || undefined,
      })}`,
    [invFilters, invPage, invPageSize],
  );
  const compPath = useMemo(
    () =>
      `/cctv-bas/complaints?${buildQuery({
        page: compPage,
        pageSize: compPageSize,
        q: compFilters.q || undefined,
        status: compFilters.status || undefined,
        category: compFilters.category || undefined,
      })}`,
    [compFilters, compPage, compPageSize],
  );

  const { data: inventory, loading, error, reload } = useApiData<PageResult<Inventory>>(invPath, [invPath]);
  const { data: complaints, reload: reloadComplaints } = useApiData<PageResult<Complaint>>(compPath, [compPath]);

  const [invOpen, setInvOpen] = useState(false);
  const [compOpen, setCompOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [inv, setInv] = useState({
    branchId: "",
    basVendorName: "",
    dedicatedPtclLine: "YES",
    basSimNumber: "",
    recorderType: "DVR",
    cameraCount: 8,
    recordingDays: 30,
    warrantyStatus: "YES",
    mirroringStatus: "NO",
    installationDate: todayISO(),
  });

  const [comp, setComp] = useState({
    branchId: "",
    complaintDate: todayISO(),
    ticketNumber: "",
    category: "CCTV",
    comments: "",
  });

  async function saveInventory(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const token = getToken();
      await api("/cctv-bas/inventory", {
        method: "POST",
        token,
        body: JSON.stringify({
          ...inv,
          cameraCount: Number(inv.cameraCount),
          recordingDays: Number(inv.recordingDays),
          basSimNumber: inv.basSimNumber || null,
        }),
      });
      toast.push("Inventory saved");
      setInvOpen(false);
      await reload();
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Failed", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function saveComplaint(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const token = getToken();
      await api("/cctv-bas/complaints", {
        method: "POST",
        token,
        body: JSON.stringify(comp),
      });
      toast.push("Complaint logged");
      setCompOpen(false);
      await reloadComplaints();
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Failed", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function resolve(id: string) {
    try {
      const token = getToken();
      await api(`/cctv-bas/complaints/${id}/resolve`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ resolutionDate: todayISO(), comments: "Resolved" }),
      });
      toast.push("Complaint closed");
      await reloadComplaints();
    } catch (err) {
      toast.push((err as { message?: string }).message ?? "Failed", "danger");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Surveillance & alarms"
        title="CCTV & BAS management"
        description="Central inventory for recorders, cameras, warranty, mirroring, and BAS connectivity. Complaints remain Open until a resolution date is entered."
        actions={
          <>
            <button className="btn-secondary" type="button" onClick={() => setCompOpen(true)}>
              Log complaint
            </button>
            <button className="btn" type="button" onClick={() => setInvOpen(true)}>
              + Add inventory
            </button>
          </>
        }
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading && !inventory ? <LoadingBlock /> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="space-y-3">
          <FilterBar
            applyLabel="Apply"
            onApply={() => {
              setInvPage(1);
              setInvFilters({ ...invDraft });
            }}
            onReset={() => {
              setInvDraft(emptyInvFilters);
              setInvFilters(emptyInvFilters);
              setInvPage(1);
            }}
          >
            <input
              className="field xl:col-span-2"
              placeholder="Search inventory…"
              value={invDraft.q}
              onChange={(e) => setInvDraft((p) => ({ ...p, q: e.target.value }))}
            />
            <input
              className="field"
              placeholder="Branch code"
              value={invDraft.branchCode}
              onChange={(e) => setInvDraft((p) => ({ ...p, branchCode: e.target.value }))}
            />
            <input
              className="field"
              placeholder="BAS vendor"
              value={invDraft.vendorName}
              onChange={(e) => setInvDraft((p) => ({ ...p, vendorName: e.target.value }))}
            />
          </FilterBar>

          <section className="panel overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-display text-xl">Inventory</h3>
            </div>
            {(inventory?.items.length ?? 0) === 0 ? (
              <EmptyState title="No inventory records" hint="Add CCTV/BAS details for each branch." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {inventory!.items.map((i) => (
                  <li key={i.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {i.branch ? `${i.branch.code} — ${i.branch.name}` : "Branch"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {i.recorderType} · {i.cameraCount} cameras · {i.recordingDays} recording days
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          BAS {i.basVendorName} · PTCL {i.dedicatedPtclLine} · SIM {i.basSimNumber || "—"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className={statusBadgeClass(i.warrantyStatus)}>Warranty {i.warrantyStatus}</span>
                        <span className={statusBadgeClass(i.mirroringStatus)}>Mirror {i.mirroringStatus}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Pagination
              page={inventory?.page ?? invPage}
              pageSize={inventory?.pageSize ?? invPageSize}
              total={inventory?.total ?? 0}
              totalPages={inventory?.totalPages ?? 1}
              onPageChange={setInvPage}
              onPageSizeChange={(size) => {
                setInvPageSize(size);
                setInvPage(1);
              }}
            />
          </section>
        </section>

        <section className="space-y-3">
          <FilterBar
            applyLabel="Apply"
            onApply={() => {
              setCompPage(1);
              setCompFilters({ ...compDraft });
            }}
            onReset={() => {
              setCompDraft(emptyCompFilters);
              setCompFilters(emptyCompFilters);
              setCompPage(1);
            }}
          >
            <input
              className="field xl:col-span-2"
              placeholder="Search ticket / branch…"
              value={compDraft.q}
              onChange={(e) => setCompDraft((p) => ({ ...p, q: e.target.value }))}
            />
            <select className="field" value={compDraft.status} onChange={(e) => setCompDraft((p) => ({ ...p, status: e.target.value }))}>
              <option value="">Status</option>
              <option value="OPENED">Opened</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select className="field" value={compDraft.category} onChange={(e) => setCompDraft((p) => ({ ...p, category: e.target.value }))}>
              <option value="">Category</option>
              <option value="BAS">BAS</option>
              <option value="CCTV">CCTV</option>
            </select>
          </FilterBar>

          <section className="panel overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-display text-xl">Complaints</h3>
            </div>
            {(complaints?.items.length ?? 0) === 0 ? (
              <EmptyState title="No complaints" hint="Log BAS or CCTV tickets as they arise." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {complaints!.items.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-semibold">
                        #{c.ticketNumber} · {c.category}
                      </p>
                      <p className="text-sm text-slate-600">
                        {c.branch ? `${c.branch.code} — ${c.branch.name}` : "Branch"}
                      </p>
                      {c.comments ? <p className="mt-1 text-xs text-slate-500">{c.comments}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={statusBadgeClass(c.status)}>{c.status}</span>
                      {c.status === "OPENED" ? (
                        <button className="btn-secondary" type="button" onClick={() => void resolve(c.id)}>
                          Resolve
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Pagination
              page={complaints?.page ?? compPage}
              pageSize={complaints?.pageSize ?? compPageSize}
              total={complaints?.total ?? 0}
              totalPages={complaints?.totalPages ?? 1}
              onPageChange={setCompPage}
              onPageSizeChange={(size) => {
                setCompPageSize(size);
                setCompPage(1);
              }}
            />
          </section>
        </section>
      </div>

      <Modal open={invOpen} title="Add CCTV / BAS inventory" onClose={() => setInvOpen(false)} wide>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveInventory}>
          <Field label="Branch">
            <BranchSelect
              value={inv.branchId}
              onChange={(branchId) => setInv((p) => ({ ...p, branchId }))}
              required
              allowEmpty={false}
            />
          </Field>
          <Field label="BAS vendor">
            <input className="field" required value={inv.basVendorName} onChange={(e) => setInv((p) => ({ ...p, basVendorName: e.target.value }))} />
          </Field>
          <Field label="Dedicated PTCL line">
            <select className="field" value={inv.dedicatedPtclLine} onChange={(e) => setInv((p) => ({ ...p, dedicatedPtclLine: e.target.value }))}>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </Field>
          <Field label="BAS SIM number">
            <input className="field" inputMode="numeric" value={inv.basSimNumber} onChange={(e) => setInv((p) => ({ ...p, basSimNumber: e.target.value.replace(/\D/g, "") }))} />
          </Field>
          <Field label="Recorder type">
            <select className="field" value={inv.recorderType} onChange={(e) => setInv((p) => ({ ...p, recorderType: e.target.value }))}>
              <option value="DVR">DVR</option>
              <option value="NVR">NVR</option>
            </select>
          </Field>
          <Field label="No. of cameras">
            <input className="field" type="number" min={0} value={inv.cameraCount} onChange={(e) => setInv((p) => ({ ...p, cameraCount: Number(e.target.value) }))} />
          </Field>
          <Field label="Recording days">
            <input className="field" type="number" min={0} value={inv.recordingDays} onChange={(e) => setInv((p) => ({ ...p, recordingDays: Number(e.target.value) }))} />
          </Field>
          <Field label="Warranty status">
            <select className="field" value={inv.warrantyStatus} onChange={(e) => setInv((p) => ({ ...p, warrantyStatus: e.target.value }))}>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </Field>
          <Field label="Mirroring status">
            <select className="field" value={inv.mirroringStatus} onChange={(e) => setInv((p) => ({ ...p, mirroringStatus: e.target.value }))}>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </Field>
          <Field label="Installation date">
            <input className="field" type="date" value={inv.installationDate} onChange={(e) => setInv((p) => ({ ...p, installationDate: e.target.value }))} />
          </Field>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button className="btn-secondary" type="button" onClick={() => setInvOpen(false)}>Cancel</button>
            <button className="btn" disabled={busy} type="submit">{busy ? "Saving…" : "Save inventory"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={compOpen} title="Log BAS / CCTV complaint" onClose={() => setCompOpen(false)}>
        <form className="space-y-3" onSubmit={saveComplaint}>
          <Field label="Branch">
            <BranchSelect
              value={comp.branchId}
              onChange={(branchId) => setComp((p) => ({ ...p, branchId }))}
              required
              allowEmpty={false}
            />
          </Field>
          <Field label="Complaint date">
            <input className="field" type="date" required value={comp.complaintDate} onChange={(e) => setComp((p) => ({ ...p, complaintDate: e.target.value }))} />
          </Field>
          <Field label="Ticket number">
            <input className="field" required value={comp.ticketNumber} onChange={(e) => setComp((p) => ({ ...p, ticketNumber: e.target.value }))} />
          </Field>
          <Field label="Category">
            <select className="field" value={comp.category} onChange={(e) => setComp((p) => ({ ...p, category: e.target.value }))}>
              <option value="BAS">BAS</option>
              <option value="CCTV">CCTV</option>
            </select>
          </Field>
          <Field label="Comments">
            <textarea className="field min-h-24" value={comp.comments} onChange={(e) => setComp((p) => ({ ...p, comments: e.target.value }))} />
          </Field>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={() => setCompOpen(false)}>Cancel</button>
            <button className="btn" disabled={busy} type="submit">Log complaint</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
