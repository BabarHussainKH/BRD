export function formatCnicInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  const p1 = digits.slice(0, 5);
  const p2 = digits.slice(5, 12);
  const p3 = digits.slice(12, 13);
  if (digits.length <= 5) return p1;
  if (digits.length <= 12) return `${p1}-${p2}`;
  return `${p1}-${p2}-${p3}`;
}

export function formatRole(role: string) {
  return role.replaceAll("_", " ");
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function statusBadgeClass(status: string) {
  const s = status.toUpperCase();
  if (["ACTIVE", "APPROVED", "SUBMITTED", "CLOSED", "OK", "YES"].includes(s)) return "badge-ok";
  if (["PENDING", "DRAFT", "CHANGE_REQUESTED", "OPENED", "OPEN"].includes(s)) return "badge-warn";
  if (["REJECTED", "TERMINATED", "OVERDUE", "EXPIRED", "NO"].includes(s)) return "badge-danger";
  return "badge-info";
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
