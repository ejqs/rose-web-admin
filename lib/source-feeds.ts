export const MAX_INPUT_URLS = 12;
export const MAX_FEEDS_PER_PAGE = 8;

const FEED_TYPES = ["application/rss+xml", "application/atom+xml", "application/rdf+xml"];

export type DiscoveredFeed = {
  name: string;
  baseUrl: string;
  feedUrl: string;
  via: "feed" | "html-alternate" | "common-path" | "opml";
};

export type DiscoverNote = {
  url: string;
  message: string;
};

export type DiscoverResult = {
  feeds: DiscoveredFeed[];
  notes: DiscoverNote[];
};

export function looksLikeOpml(text: string) {
  return /<opml[\s>]/i.test(text) || /<outline\b[^>]*xmlUrl/i.test(text);
}

export function parseInputUrls(raw: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    for (const part of trimmed.split(/[\s,]+/)) {
      if (!part) continue;
      try {
        const url = new URL(part).toString();
        const key = normalizeFeedUrl(url);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(url);
      } catch {
        /* skip */
      }
    }
  }
  return out;
}

export function isPrivateIp(ip: string): boolean {
  const v4 = ipv4From(ip);
  if (v4) return isPrivateV4(v4);
  const host = ip.toLowerCase().split("%")[0];
  if (host === "::1" || host === "::") return true;
  if (host.startsWith("fe80:")) return true;
  if (host.startsWith("ff")) return true;
  const first = host.split(":")[0] || "";
  if (first.length >= 2 && (first.startsWith("fc") || first.startsWith("fd"))) return true;
  return false;
}

export function isIpAddress(hostname: string): boolean {
  return isIPv4(hostname) || hostname.includes(":");
}

export function isBlockedHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".lan")) return true;
  if (host === "metadata.google.internal") return true;
  if (isIpAddress(host)) return isPrivateIp(host);
  return false;
}

export function normalizeFeedUrl(url: string): string {
  const u = new URL(url);
  u.hash = "";
  u.hostname = u.hostname.toLowerCase();
  if ((u.protocol === "http:" && u.port === "80") || (u.protocol === "https:" && u.port === "443")) {
    u.port = "";
  }
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
    u.pathname = u.pathname.slice(0, -1);
  }
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    u.searchParams.delete(key);
  }
  return u.toString();
}

export function originOf(url: string): string {
  const u = new URL(url);
  return `${u.protocol}//${u.host}`;
}

export function nameFromHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "") || "Untitled feed";
  } catch {
    return "Untitled feed";
  }
}

export function looksLikeFeed(contentType: string | null, body: string): boolean {
  const ct = (contentType || "").toLowerCase();
  if (FEED_TYPES.some((t) => ct.includes(t))) return true;
  const head = body.slice(0, 2000);
  return /<(rss|feed|rdf:RDF)\b/i.test(head);
}

export function extractFeedTitle(body: string): string | null {
  const stripped = body.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");
  const m = stripped.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  const title = decodeEntities(m[1]);
  return title || null;
}

export function parseHtmlAlternateFeeds(html: string, pageUrl: string): DiscoveredFeed[] {
  const feeds: DiscoveredFeed[] = [];
  const seen = new Set<string>();
  const re = /<link\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const attrs = parseAttrs(match[0]);
    const rel = (attrs.rel || "").toLowerCase().split(/\s+/);
    if (!rel.includes("alternate")) continue;
    const type = (attrs.type || "").toLowerCase();
    if (!FEED_TYPES.some((t) => type.includes(t))) continue;
    const href = attrs.href;
    if (!href) continue;
    let feedUrl: string;
    try {
      feedUrl = new URL(href, pageUrl).toString();
    } catch {
      continue;
    }
    const key = normalizeFeedUrl(feedUrl);
    if (seen.has(key)) continue;
    seen.add(key);
    feeds.push({
      name: decodeEntities(attrs.title || "") || nameFromHost(feedUrl),
      baseUrl: originOf(pageUrl),
      feedUrl,
      via: "html-alternate",
    });
    if (feeds.length >= MAX_FEEDS_PER_PAGE) break;
  }
  return feeds;
}

export function parseOpml(xml: string): DiscoveredFeed[] {
  const feeds: DiscoveredFeed[] = [];
  const seen = new Set<string>();
  const re = /<outline\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    const attrs = parseAttrs(match[1] || "");
    const xmlUrl = attrs.xmlurl;
    if (!xmlUrl) continue;
    let feedUrl: string;
    try {
      feedUrl = new URL(xmlUrl).toString();
    } catch {
      continue;
    }
    const key = normalizeFeedUrl(feedUrl);
    if (seen.has(key)) continue;
    seen.add(key);
    let baseUrl = originOf(feedUrl);
    if (attrs.htmlurl) {
      try {
        baseUrl = originOf(new URL(attrs.htmlurl).toString());
      } catch {
        /* keep origin of feed */
      }
    }
    feeds.push({
      name: decodeEntities(attrs.title || attrs.text || "") || nameFromHost(feedUrl),
      baseUrl,
      feedUrl,
      via: "opml",
    });
  }
  return feeds;
}

export function preferDefaultChecked(feed: DiscoveredFeed, totalNew: number): boolean {
  if (totalNew <= 5) return true;
  return /world|news|headline|top stor/i.test(`${feed.name} ${feed.feedUrl}`);
}

export function parseHttpUrl(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed.");
  }
  if (url.username || url.password) {
    throw new Error("URLs with credentials are not allowed.");
  }
  if (isBlockedHost(url.hostname)) {
    throw new Error("That host is not allowed.");
  }
  return url;
}

export function dedupeFeeds(feeds: DiscoveredFeed[]): DiscoveredFeed[] {
  const seen = new Set<string>();
  const out: DiscoveredFeed[] = [];
  for (const feed of feeds) {
    let key: string;
    try {
      key = normalizeFeedUrl(feed.feedUrl);
    } catch {
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...feed,
      feedUrl: new URL(feed.feedUrl).toString(),
      name: feed.name || nameFromHost(feed.feedUrl),
    });
  }
  return out;
}

function parseAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(tag))) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attrs;
}

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/\s+/g, " ")
    .trim();
}

function isIPv4(host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function ipv4From(ip: string): string | null {
  if (isIPv4(ip)) return ip;
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  return mapped ? mapped[1] : null;
}

function isPrivateV4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}
