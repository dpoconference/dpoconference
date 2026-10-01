import { notify } from "./toast";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

type Envelope<T> = {
  success: boolean;
  data: T;
  meta?: { page: number; limit: number; total: number };
  error?: { code: string; message: string; details?: unknown; retryAfterSeconds?: number };
};

let accessToken: string | null = null;
let refreshing: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function parse<T>(res: Response): Promise<Envelope<T>> {
  const json = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!json) throw new ApiRequestError(res.status, "NETWORK", "Unexpected server response.");
  return json;
}

async function tryRefresh() {
  if (!refreshing) {
    refreshing = fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        const json = await parse<{ accessToken: string }>(res);
        if (!res.ok || !json.success) return null;
        accessToken = json.data.accessToken;
        return accessToken;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function api<T>(
  path: string,
  init: RequestInit & { skipAuth?: boolean; silent?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken && !init.skipAuth) headers.set("Authorization", `Bearer ${accessToken}`);

  let res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !init.skipAuth && !path.startsWith("/auth/login")) {
    const next = await tryRefresh();
    if (next) {
      headers.set("Authorization", `Bearer ${next}`);
      res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: "include" });
    }
  }

  const json = await parse<T>(res);
  if (!res.ok || !json.success) {
    const code = json.error?.code ?? "ERROR";
    const message = json.error?.message ?? "Request failed.";
    if (!init.silent) {
      if (res.status === 429) notify.warning("Too many attempts. Try again shortly.", message);
      else if (code === "EMAIL_NOT_VERIFIED") notify.info("Verify your email first.");
      else if (res.status !== 401) notify.error(message);
    }
    throw new ApiRequestError(res.status, code, message, json.error?.details);
  }
  return json.data;
}

export const apiGet = <T>(path: string) => api<T>(path);
export const apiPost = <T>(path: string, body?: unknown) =>
  api<T>(path, {
    method: "POST",
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
export const apiPatch = <T>(path: string, body?: unknown) =>
  api<T>(path, {
    method: "PATCH",
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
export const apiPut = <T>(path: string, body?: unknown) =>
  api<T>(path, {
    method: "PUT",
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
export const apiDelete = <T>(path: string) => api<T>(path, { method: "DELETE" });
export const getHealth = () => apiGet<{ status: string; time: string }>("/health");

export async function apiObjectUrl(path: string): Promise<{ url: string; contentType: string }> {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${BASE}${path}`, { headers, credentials: "include" });
  if (!res.ok) throw new ApiRequestError(res.status, "DOWNLOAD", "Could not load file.");
  const blob = await res.blob();
  const contentType = res.headers.get("content-type") ?? blob.type ?? "application/octet-stream";
  return { url: URL.createObjectURL(blob), contentType };
}

export async function apiBlob(path: string, filename: string) {
  const { url } = await apiObjectUrl(path);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function payThenVerify(body: { purpose: string; linkedId?: string; email?: string }) {
  const pay = await apiPost<{
    authorizationUrl: string | null;
    accessCode: string | null;
    reference: string;
    amountNgn: number;
    fake?: boolean;
  }>("/payments/initialize", body);

  if (pay.fake || pay.amountNgn === 0) {
    await apiGet(`/payments/${pay.reference}/verify`);
    return { ...pay, verified: true as const, cancelled: false as const };
  }

  if (pay.accessCode) {
    const { openPaystackCheckout } = await import("@/lib/paystack");
    const reference = await openPaystackCheckout(pay.accessCode);
    if (!reference) return { ...pay, verified: false as const, cancelled: true as const };
    await apiGet(`/payments/${reference}/verify`);
    return { ...pay, verified: true as const, cancelled: false as const };
  }

  // Fallback if Inline cannot open (older clients / missing access code).
  if (pay.authorizationUrl) {
    window.location.href = pay.authorizationUrl;
    return { ...pay, verified: false as const, cancelled: false as const };
  }

  throw new ApiRequestError(502, "PAYMENTS_UNAVAILABLE", "Payment checkout could not be started.");
}
