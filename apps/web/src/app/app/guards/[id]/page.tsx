"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Alert, EmptyState, Field, LoadingBlock, PageHeader } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { formatDate, statusBadgeClass, todayISO } from "@/lib/format";
import { useApiData } from "@/lib/hooks";
import { can } from "@/lib/permissions";

const DOC_TYPES = [
  { type: "DEPLOYMENT_LETTER", label: "Deployment / Introductory Letter" },
  { type: "EMPLOYMENT_CARD", label: "Employment Card" },
  { type: "PASSPORT_PHOTO", label: "Passport Photograph" },
  { type: "POLICE_VERIFICATION", label: "Police Verification" },
  { type: "TRAINING_CERTIFICATE", label: "Training Certificate (APSAA)" },
  { type: "CNIC_NADRA_VERISYS", label: "CNIC with NADRA Verisys" },
  { type: "LICENSE", label: "Weapon License" },
] as const;

type GuardDetail = {
  id: string;
  guardId: string;
  fullName: string;
  cnicNumber: string;
  cnicExpiryDate: string;
  contactMobile: string;
  weaponType: string;
  licenseExpiryDate?: string | null;
  guardCategory: string;
  deploymentCategory: string;
  deploymentLocation: string;
  dateOfJoining: string;
  trainingStatus: string;
  policeVerification: string;
  nadraVerisys: string;
  status: string;
  vendor?: { name: string };
  branch?: { code: string; name: string };
  familyMembers: Array<{
    id: string;
    name: string;
    cnicNumber?: string | null;
    dateOfBirth?: string | null;
    relation: string;
  }>;
  documents: Array<{
    id: string;
    type: string;
    fileName: string;
    expiryDate?: string | null;
    uploadedAt: string;
  }>;
};

type Compliance = {
  canDeploy: boolean;
  missing: string[];
  expired: string[];
  documents: GuardDetail["documents"];
};

export default function GuardDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();
  const user = getUser();
  const { data: guard, loading, error, reload } = useApiData<GuardDetail>(`/guards/${id}`, [id]);
  const { data: compliance, reload: reloadCompliance } = useApiData<Compliance>(
    `/documents/${id}/compliance`,
    [id],
  );
  const [uploading, setUploading] = useState<string | null>(null);
  const [expiryByType, setExpiryByType] = useState<Record<string, string>>({});
  const [statusBusy, setStatusBusy] = useState(false);

  async function updateStatus(status: string) {
    setStatusBusy(true);
    try {
      const token = getToken();
      await api(`/guards/${id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });
      toast.push(`Guard marked ${status}`);
      await reload();
    } catch (e) {
      toast.push((e as { message?: string }).message ?? "Status update failed", "danger");
    } finally {
      setStatusBusy(false);
    }
  }

  async function upload(type: string, file: File) {
    setUploading(type);
    try {
      const token = getToken();
      const fd = new FormData();
      fd.append("file", file);
      const qs = new URLSearchParams({ type });
      if (expiryByType[type]) qs.set("expiryDate", expiryByType[type]);
      await api(`/documents/${id}/upload?${qs.toString()}`, {
        method: "POST",
        token,
        formData: fd,
      });
      toast.push(`${type.replaceAll("_", " ")} uploaded`);
      await Promise.all([reload(), reloadCompliance()]);
    } catch (e) {
      toast.push((e as { message?: string }).message ?? "Upload failed", "danger");
    } finally {
      setUploading(null);
    }
  }

  if (loading && !guard) return <LoadingBlock label="Loading guard profile…" />;
  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!guard) return <EmptyState title="Guard not found" />;

  const docsByType = new Map(guard.documents.map((d) => [d.type, d]));

  return (
    <>
      <PageHeader
        eyebrow="Guard profile"
        title={guard.fullName}
        description={`${guard.branch?.code ?? ""} ${guard.branch?.name ?? ""} · ${guard.vendor?.name ?? "Vendor"}`}
        actions={
          <>
            <Link className="btn-secondary" href="/app/guards">
              Back to list
            </Link>
            {can(user?.role, "deployment") ? (
              <Link className="btn" href={`/app/deployment?guardId=${guard.id}`}>
                Request deployment
              </Link>
            ) : null}
            {can(user?.role, "guards.write") ? (
              <>
                <button
                  className="btn-secondary"
                  disabled={statusBusy || guard.status === "REPLACED"}
                  type="button"
                  onClick={() => void updateStatus("REPLACED")}
                >
                  Mark replaced
                </button>
                <button
                  className="btn-danger"
                  disabled={statusBusy || guard.status === "TERMINATED"}
                  type="button"
                  onClick={() => void updateStatus("TERMINATED")}
                >
                  Terminate / deregister
                </button>
              </>
            ) : null}
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="panel animate-fade-up p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={statusBadgeClass(guard.status)}>{guard.status}</span>
            <span className="badge-info">{guard.deploymentCategory}</span>
            <span className="badge-info">{guard.guardCategory.replaceAll("_", " ")}</span>
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Guard ID", guard.guardId],
              ["CNIC", guard.cnicNumber],
              ["CNIC expiry", formatDate(guard.cnicExpiryDate)],
              ["Mobile", guard.contactMobile],
              ["Location", guard.deploymentLocation],
              ["Joining", formatDate(guard.dateOfJoining)],
              ["Weapon", guard.weaponType],
              ["License expiry", formatDate(guard.licenseExpiryDate)],
              ["Training", guard.trainingStatus],
              ["Police verification", guard.policeVerification],
              ["NADRA Verisys", guard.nadraVerisys],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="label">{k}</dt>
                <dd className="text-sm font-medium text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        </article>

        <article className="panel animate-fade-up p-5 sm:p-6" style={{ animationDelay: "80ms" }}>
          <h3 className="font-display text-xl">Deployment compliance</h3>
          <p className="mt-2 text-sm text-slate-600">
            All 7 mandatory documents must be present and valid before deployment.
          </p>
          <div className="mt-4">
            {compliance?.canDeploy ? (
              <Alert tone="ok">Ready for deployment.</Alert>
            ) : (
              <Alert tone="warn">
                Blocked
                {compliance?.missing?.length ? ` · missing: ${compliance.missing.length}` : ""}
                {compliance?.expired?.length ? ` · expired: ${compliance.expired.length}` : ""}
              </Alert>
            )}
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {DOC_TYPES.map((d) => {
              const uploaded = docsByType.get(d.type);
              const missing = compliance?.missing?.includes(d.type);
              const expired = compliance?.expired?.includes(d.type);
              return (
                <li key={d.type} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  <span>{d.label}</span>
                  <span className={uploaded ? (expired ? "badge-danger" : "badge-ok") : missing ? "badge-warn" : "badge-info"}>
                    {expired ? "Expired" : uploaded ? "Uploaded" : "Missing"}
                  </span>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      <section className="panel p-5 sm:p-6">
        <h3 className="font-display text-xl">Mandatory documents</h3>
        <div className="mt-4 grid gap-3">
          {DOC_TYPES.map((d) => {
            const uploaded = docsByType.get(d.type);
            return (
              <div key={d.type} className="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1.2fr_160px_1fr_auto]">
                <div>
                  <p className="font-semibold">{d.label}</p>
                  <p className="text-xs text-slate-500">
                    {uploaded
                      ? `${uploaded.fileName} · uploaded ${formatDate(uploaded.uploadedAt)}`
                      : "No file yet"}
                  </p>
                </div>
                <Field label="Expiry (if any)">
                  <input
                    className="field"
                    type="date"
                    min={todayISO()}
                    value={expiryByType[d.type] ?? ""}
                    onChange={(e) =>
                      setExpiryByType((prev) => ({ ...prev, [d.type]: e.target.value }))
                    }
                  />
                </Field>
                <Field label="File">
                  <input
                    className="field"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    disabled={uploading === d.type}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void upload(d.type, file);
                      e.currentTarget.value = "";
                    }}
                  />
                </Field>
                <div className="flex items-end">
                  <span className="text-xs text-slate-500">
                    {uploading === d.type ? "Uploading…" : "PDF/JPG/PNG"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <h3 className="font-display text-xl">Immediate family</h3>
        {(guard.familyMembers?.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No family members recorded.</p>
        ) : (
          <div className="table-wrap mt-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>CNIC</th>
                  <th>DOB</th>
                  <th>Relation</th>
                </tr>
              </thead>
              <tbody>
                {guard.familyMembers.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.cnicNumber ?? "—"}</td>
                    <td>{formatDate(m.dateOfBirth)}</td>
                    <td>{m.relation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
