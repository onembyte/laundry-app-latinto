export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const base = API_BASE || "";
  const url = `${base}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}
