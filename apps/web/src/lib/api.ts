const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type ApiError = { message: string; status: number };

function formatMessage(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw.join(", ");
  if (raw && typeof raw === "object" && "message" in raw) {
    return formatMessage((raw as { message: unknown }).message);
  }
  try {
    return JSON.stringify(raw);
  } catch {
    return "Request failed";
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null; formData?: FormData } = {},
): Promise<T> {
  const { token, headers, formData, body, ...rest } = options;
  const isForm = Boolean(formData);

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    body: isForm ? formData : body,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const parsed = await res.json();
      message = formatMessage(parsed.message ?? parsed);
    } catch {
      // ignore
    }
    throw { message, status: res.status } satisfies ApiError;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export { API_URL };
