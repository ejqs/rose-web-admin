const SESSION_COOKIE = "rose_session";

export function backendUrl() {
  const url = process.env.ROSE_BACKEND_URL;
  if (!url) {
    throw new Error("ROSE_BACKEND_URL is required. This app no longer uses DATABASE_URL.");
  }
  return url.replace(/\/$/, "");
}

type FetchOpts = {
  method?: string;
  token?: string;
  body?: unknown;
};

export async function backendFetch<T = Record<string, unknown>>(path: string, opts: FetchOpts = {}): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(`${backendUrl()}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  let data = {} as T;
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    data = {} as T;
  }
  return { status: res.status, data };
}

export { SESSION_COOKIE };
