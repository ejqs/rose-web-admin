"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { addDiscoveredSources, discoverFeeds, type DiscoverState } from "./actions";
import { normalizeFeedUrl, preferDefaultChecked, type DiscoveredFeed } from "@/lib/source-feeds";

export function DiscoverPanel({ existingFeedKeys }: { existingFeedKeys: string[] }) {
  const [state, action, pending] = useActionState(discoverFeeds, null as DiscoverState);
  const have = new Set(existingFeedKeys);

  return (
    <div className="grid gap-3 rounded-lg border p-4">
      <div>
        <h2 className="font-medium">Discover feeds</h2>
        <p className="text-sm text-muted-foreground">
          Paste homepage URLs (one per line), feed URLs, or OPML. Rose fetches public pages and reads RSS/Atom{" "}
          <code>rel=alternate</code> links. Private/local hosts are rejected.
        </p>
      </div>
      <form action={action} className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="urls">URLs or OPML</Label>
          <Textarea
            id="urls"
            name="urls"
            rows={5}
            placeholder={"https://www.pbs.org/newshour\nhttps://www.dw.com"}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="opml">OPML file (optional)</Label>
          <input id="opml" name="opml" type="file" accept=".opml,.xml,text/xml,application/xml,application/octet-stream" />
        </div>
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Discovering…" : "Discover feeds"}
          </Button>
        </div>
      </form>
      {state && !state.ok ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.ok ? <DiscoverResults feeds={state.feeds} notes={state.notes} have={have} /> : null}
    </div>
  );
}

function DiscoverResults({
  feeds,
  notes,
  have,
}: {
  feeds: DiscoveredFeed[];
  notes: { url: string; message: string }[];
  have: Set<string>;
}) {
  const newCount = feeds.filter((f) => !have.has(feedKey(f.feedUrl))).length;
  return (
    <div className="grid gap-3">
      {notes.length ? (
        <ul className="grid gap-1 text-sm text-muted-foreground">
          {notes.map((note, i) => (
            <li key={`${note.url}-${i}`}>
              {note.url ? `${note.url}: ` : ""}
              {note.message}
            </li>
          ))}
        </ul>
      ) : null}
      {feeds.length === 0 ? (
        <p className="text-sm text-muted-foreground">No feeds to add.</p>
      ) : (
        <form action={addDiscoveredSources} className="grid gap-3">
          <p className="text-sm">
            {feeds.length} feed{feeds.length === 1 ? "" : "s"} found · {newCount} new. Uncheck anything you do not want.
          </p>
          <ul className="grid gap-2">
            {feeds.map((feed) => {
              const key = feedKey(feed.feedUrl);
              const already = have.has(key);
              const checked = !already && preferDefaultChecked(feed, newCount);
              return (
                <li key={feed.feedUrl} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="feed"
                    className="mt-1"
                    disabled={already}
                    defaultChecked={checked}
                    value={JSON.stringify({ name: feed.name, baseUrl: feed.baseUrl, feedUrl: feed.feedUrl })}
                  />
                  <span className="grid gap-0.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong>{feed.name}</strong>
                      <Badge variant="outline">{feed.via}</Badge>
                      {already ? <Badge variant="secondary">already added</Badge> : null}
                    </span>
                    <span className="break-all text-muted-foreground">{feed.feedUrl}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <div>
            <Button type="submit" disabled={newCount === 0}>
              Add selected feeds
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function feedKey(url: string) {
  try {
    return normalizeFeedUrl(url);
  } catch {
    return url;
  }
}
