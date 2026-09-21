import { lookup } from "node:dns/promises";
import {
  MAX_INPUT_URLS,
  dedupeFeeds,
  extractFeedTitle,
  isBlockedHost,
  isIpAddress,
  isPrivateIp,
  looksLikeFeed,
  looksLikeOpml,
  nameFromHost,
  originOf,
  parseHtmlAlternateFeeds,
  parseHttpUrl,
  parseInputUrls,
  parseOpml,
  type DiscoverResult,
  type DiscoveredFeed,
} from "./source-feeds";

export const DISCOVER_UA = "RoseAdmin/0.1 (+https://github.com/ejqs/rose-web-admin)";
export const FETCH_TIMEOUT_MS = 7000;
export const MAX_BODY_BYTES = 800_000;

const COMMON_FEED_PATHS = ["/rss", "/feed", "/rss.xml", "/feed.xml", "/atom.xml", "/index.xml"];

export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  const url = parseHttpUrl(raw);
  if (isIpAddress(url.hostname)) {
    if (isPrivateIp(url.hostname)) {
      throw new Error("Private IP is not allowed.");
    }
    return url;
  }
  if (isBlockedHost(url.hostname)) {
    throw new Error("That host is not allowed.");
  }
  const answers = await lookup(url.hostname, { all: true });
  if (!answers.length) throw new Error("Could not resolve host.");
  if (answers.some((row) => isPrivateIp(row.address))) {
    throw new Error("Host resolves to a private address.");
  }
  return url;
}

export async function discoverFromText(raw: string): Promise<DiscoverResult> {
  const text = raw.trim();
  if (!text) return { feeds: [], notes: [{ url: "", message: "Paste homepage URLs, feed URLs, or OPML." }] };
  if (looksLikeOpml(text)) {
    const feeds = dedupeFeeds(
      parseOpml(text).filter((row) => {
        try {
          parseHttpUrl(row.feedUrl);
          return true;
        } catch {
          return false;
        }
      }),
    );
    return {
      feeds,
      notes: feeds.length ? [] : [{ url: "", message: "No xmlUrl entries found in that OPML." }],
    };
  }
  const all = parseInputUrls(text);
  const urls = all.slice(0, MAX_INPUT_URLS);
  if (!urls.length) {
    return { feeds: [], notes: [{ url: "", message: "No http(s) URLs found." }] };
  }
  const notes: DiscoverResult["notes"] = [];
  if (all.length > MAX_INPUT_URLS) {
    notes.push({ url: "", message: `Only the first ${MAX_INPUT_URLS} URLs are fetched.` });
  }
  const batches = await mapPool(urls, 4, async (url) => {
    try {
      return await discoverFromUrl(url);
    } catch (err) {
      return {
        feeds: [] as DiscoveredFeed[],
        notes: [{ url, message: err instanceof Error ? err.message : "Fetch failed." }],
      };
    }
  });
  const feeds = dedupeFeeds(batches.flatMap((row) => row.feeds));
  notes.push(...batches.flatMap((row) => row.notes));
  if (!feeds.length && !notes.length) {
    notes.push({ url: "", message: "No RSS or Atom feeds found." });
  }
  return { feeds, notes };
}

export async function discoverFromUrl(raw: string): Promise<DiscoverResult> {
  const fetched = await fetchPublic(raw);
  const notes: DiscoverResult["notes"] = [];
  if (looksLikeOpml(fetched.body)) {
    return { feeds: dedupeFeeds(parseOpml(fetched.body)), notes };
  }
  if (looksLikeFeed(fetched.contentType, fetched.body)) {
    return {
      feeds: [
        {
          name: extractFeedTitle(fetched.body) || nameFromHost(fetched.finalUrl),
          baseUrl: originOf(fetched.finalUrl),
          feedUrl: fetched.finalUrl,
          via: "feed",
        },
      ],
      notes,
    };
  }
  const fromHtml = parseHtmlAlternateFeeds(fetched.body, fetched.finalUrl);
  if (fromHtml.length) return { feeds: fromHtml, notes };
  const probed = await probeCommonPaths(fetched.finalUrl);
  if (probed) return { feeds: [probed], notes };
  notes.push({ url: raw, message: "No RSS or Atom feed found on that page." });
  return { feeds: [], notes };
}

async function probeCommonPaths(pageUrl: string): Promise<DiscoveredFeed | null> {
  const origin = originOf(pageUrl);
  for (const path of COMMON_FEED_PATHS) {
    const candidate = new URL(path, origin).toString();
    try {
      const fetched = await fetchPublic(candidate);
      if (looksLikeFeed(fetched.contentType, fetched.body)) {
        return {
          name: extractFeedTitle(fetched.body) || nameFromHost(fetched.finalUrl),
          baseUrl: origin,
          feedUrl: fetched.finalUrl,
          via: "common-path",
        };
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

async function fetchPublic(raw: string): Promise<{ finalUrl: string; contentType: string | null; body: string }> {
  let current = (await assertPublicHttpUrl(raw)).toString();
  for (let hop = 0; hop < 5; hop++) {
    const res = await fetch(current, {
      redirect: "manual",
      headers: {
        "user-agent": DISCOVER_UA,
        accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error(`Redirect without Location (${res.status}).`);
      current = (await assertPublicHttpUrl(new URL(location, current).toString())).toString();
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await readLimited(res);
    return { finalUrl: current, contentType: res.headers.get("content-type"), body };
  }
  throw new Error("Too many redirects.");
}

async function readLimited(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) {
    const text = await res.text();
    if (text.length > MAX_BODY_BYTES) throw new Error("Response too large.");
    return text;
  }
  const chunks: Uint8Array[] = [];
  let n = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.byteLength;
    if (n > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error("Response too large.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  const n = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}
