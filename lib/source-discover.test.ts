import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isBlockedHost,
  isPrivateIp,
  looksLikeFeed,
  looksLikeOpml,
  extractFeedTitle,
  parseHtmlAlternateFeeds,
  parseHttpUrl,
  parseInputUrls,
  parseOpml,
  preferDefaultChecked,
  normalizeFeedUrl,
} from "./source-feeds.ts";
import { SOURCE_CATALOG } from "./source-catalog.ts";

test("parseInputUrls skips comments and duplicates", () => {
  const urls = parseInputUrls(`
# comment
https://www.npr.org
https://www.npr.org/
https://www.bbc.com/news
not-a-url
`);
  assert.equal(urls.length, 2);
  assert.ok(urls[0].includes("npr.org"));
});

test("normalizeFeedUrl drops trailing slash and utm", () => {
  assert.equal(
    normalizeFeedUrl("https://WWW.Example.com/feed/?utm_source=x"),
    "https://www.example.com/feed",
  );
});

test("blocked hosts include loopback and RFC1918", () => {
  assert.equal(isBlockedHost("localhost"), true);
  assert.equal(isBlockedHost("127.0.0.1"), true);
  assert.equal(isBlockedHost("10.0.0.4"), true);
  assert.equal(isBlockedHost("192.168.1.9"), true);
  assert.equal(isBlockedHost("169.254.169.254"), true);
  assert.equal(isPrivateIp("::1"), true);
  assert.equal(isBlockedHost("www.npr.org"), false);
  assert.throws(() => parseHttpUrl("http://localhost/feed.xml"));
  assert.throws(() => parseHttpUrl("file:///etc/passwd"));
  assert.doesNotThrow(() => parseHttpUrl("https://www.npr.org"));
});

test("parseHtmlAlternateFeeds reads link rel=alternate", () => {
  const html = `
    <link rel="stylesheet" href="/app.css">
    <link rel="alternate" type="application/rss+xml" title="World" href="/world/rss">
    <link href="https://example.com/atom.xml" rel="alternate noopener" type="application/atom+xml" title="Atom">
  `;
  const feeds = parseHtmlAlternateFeeds(html, "https://example.com/news");
  assert.equal(feeds.length, 2);
  assert.equal(feeds[0].feedUrl, "https://example.com/world/rss");
  assert.equal(feeds[0].name, "World");
  assert.equal(feeds[0].via, "html-alternate");
  assert.equal(feeds[1].feedUrl, "https://example.com/atom.xml");
});

test("parseOpml reads xmlUrl outlines", () => {
  const xml = `<?xml version="1.0"?>
    <opml version="2.0"><body>
      <outline text="Folders">
        <outline text="NPR" title="NPR News" type="rss" xmlUrl="https://feeds.npr.org/1001/rss.xml" htmlUrl="https://www.npr.org"/>
      </outline>
    </body></opml>`;
  assert.equal(looksLikeOpml(xml), true);
  const feeds = parseOpml(xml);
  assert.equal(feeds.length, 1);
  assert.equal(feeds[0].feedUrl, "https://feeds.npr.org/1001/rss.xml");
  assert.equal(feeds[0].name, "NPR News");
  assert.equal(feeds[0].baseUrl, "https://www.npr.org");
  assert.equal(feeds[0].via, "opml");
});

test("looksLikeFeed and extractFeedTitle", () => {
  const rss = `<?xml version="1.0"?><rss><channel><title>Demo Feed</title></channel></rss>`;
  assert.equal(looksLikeFeed("application/rss+xml", rss), true);
  assert.equal(extractFeedTitle(rss), "Demo Feed");
  assert.equal(looksLikeFeed("text/html", "<html><title>Hi</title></html>"), false);
});

test("preferDefaultChecked keeps world feeds when many results", () => {
  const world = {
    name: "World",
    baseUrl: "https://a.example",
    feedUrl: "https://a.example/world.xml",
    via: "feed" as const,
  };
  const sports = {
    name: "Sports",
    baseUrl: "https://a.example",
    feedUrl: "https://a.example/sports.xml",
    via: "feed" as const,
  };
  assert.equal(preferDefaultChecked(world, 12), true);
  assert.equal(preferDefaultChecked(sports, 12), false);
  assert.equal(preferDefaultChecked(sports, 2), true);
});

test("catalog ids and feed URLs are unique", () => {
  const ids = SOURCE_CATALOG.map((row) => row.id);
  const feeds = SOURCE_CATALOG.map((row) => normalizeFeedUrl(row.feedUrl));
  assert.equal(ids.length, new Set(ids).size);
  assert.equal(feeds.length, new Set(feeds).size);
});
