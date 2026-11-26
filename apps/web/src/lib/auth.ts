export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  branchId?: string | null;
  clusterId?: string | null;
  regionId?: string | null;
  totpEnabled?: boolean;
  branch?: { id: string; code: string; name: string } | null;
  cluster?: { id: string; code: string; name: string } | null;
  region?: { id: string; code: string; name: string } | null;
};

const TOKEN_KEY = "sms_token";
const USER_KEY = "sms_user";

export function saveSession(token: string, user: SessionUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}
