# Sources

**Updated:** 2026-09-21

rose-bot only scrapes rows in `news_sources`. You do **not** have to type name / base URL / feed URL for every outlet. `/sources` can discover feeds and add a catalog of known English news RSS.

LLM source-discovery is still later (see rose-bot `docs/project-context.md`). This is conventional feed autodiscovery plus a hand-checked catalog.

## Discover from URLs or OPML

1. Sign in. Open **Sources**.
2. In **Discover feeds**, paste one or more **homepage URLs**, **feed URLs**, or an **OPML** document (or upload an `.opml` file).
3. Click **Discover feeds**. Admin fetches each public http(s) URL (timeout 7s, max 12 URLs) as `RoseAdmin/0.1`.
4. For each URL it:
   - uses the URL if the body is already RSS/Atom/RDF
   - reads OPML `xmlUrl` outlines
   - otherwise reads HTML `<link rel="alternate" type="application/rss+xml|atom+xml">`
   - if none, probes `/rss`, `/feed`, `/rss.xml`, `/feed.xml`, `/atom.xml`, `/index.xml`
5. Review the list. Already-registered feeds (same normalized `feed_url`) are marked and not added twice. Click **Add selected feeds**.

Private/loopback/link-local hosts are rejected (no SSRF to localhost or RFC1918). Credentials in URLs are rejected. Followed redirects are re-checked.

New rows start as `status=unknown`. rose-bot checks robots.txt on the next tick.

## English news catalog

The catalog is public RSS for publishers already on rose-bot’s credibility allowlist (`lib/credibility.js` in [newsey](https://github.com/ejqs/newsey)): PBS, NYT, WaPo, DW, France 24, ABC Australia, CBC, CNN, NBC, CBS, ABC News, Politico, The Atlantic, LA Times, Independent, Telegraph, SMH, The Hindu, Japan Times, Euronews, Globe and Mail, Global News, Time, plus the four bot seeds (BBC / NPR / Guardian / Al Jazeera).

Missing catalog rows are checked by default. **Add selected catalog sources** inserts them. Duplicates are skipped.

Reuters and AP are omitted: they no longer publish a stable public RSS that we could verify. Paywalled FT / WSJ / Economist feeds are omitted so the bot does not enqueue empty article bodies.

## Manual add

The original form remains for one-off feeds the catalog and autodiscovery miss. Same fields: name, base URL, feed URL, method (`rss`), priority.

## After add

rose-bot picks `ok` / `unknown` sources, not `paused`. Pace is still one source per 15-minute tick (see rose-bot hosting docs). Adding many sources does not scrape them all at once.

Pause any source you do not want fetched.
