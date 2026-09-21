/** English news RSS aligned with rose-bot `lib/credibility.js` publishers. */
export type CatalogEntry = {
  id: string;
  name: string;
  baseUrl: string;
  feedUrl: string;
  priority: number;
};

export const SOURCE_CATALOG: CatalogEntry[] = [
  {
    id: "bbc-world",
    name: "BBC World",
    baseUrl: "https://www.bbc.com",
    feedUrl: "https://feeds.bbci.co.uk/news/world/rss.xml",
    priority: 100,
  },
  {
    id: "npr-news",
    name: "NPR News",
    baseUrl: "https://www.npr.org",
    feedUrl: "https://feeds.npr.org/1001/rss.xml",
    priority: 90,
  },
  {
    id: "guardian-world",
    name: "The Guardian World",
    baseUrl: "https://www.theguardian.com",
    feedUrl: "https://www.theguardian.com/world/rss",
    priority: 80,
  },
  {
    id: "aljazeera-english",
    name: "Al Jazeera English",
    baseUrl: "https://www.aljazeera.com",
    feedUrl: "https://www.aljazeera.com/xml/rss/all.xml",
    priority: 70,
  },
  {
    id: "pbs-newshour",
    name: "PBS NewsHour",
    baseUrl: "https://www.pbs.org/newshour",
    feedUrl: "https://www.pbs.org/newshour/feeds/rss/headlines",
    priority: 60,
  },
  {
    id: "nyt-world",
    name: "New York Times World",
    baseUrl: "https://www.nytimes.com",
    feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    priority: 60,
  },
  {
    id: "wapo-world",
    name: "Washington Post World",
    baseUrl: "https://www.washingtonpost.com",
    feedUrl: "https://feeds.washingtonpost.com/rss/world",
    priority: 55,
  },
  {
    id: "dw-world",
    name: "DW World",
    baseUrl: "https://www.dw.com",
    feedUrl: "https://rss.dw.com/rdf/rss-en-world",
    priority: 55,
  },
  {
    id: "france24-en",
    name: "France 24 English",
    baseUrl: "https://www.france24.com",
    feedUrl: "https://www.france24.com/en/rss",
    priority: 55,
  },
  {
    id: "abc-australia",
    name: "ABC News Australia",
    baseUrl: "https://www.abc.net.au/news",
    feedUrl: "https://www.abc.net.au/news/feed/51120/rss.xml",
    priority: 50,
  },
  {
    id: "cbc-world",
    name: "CBC World",
    baseUrl: "https://www.cbc.ca",
    feedUrl: "https://www.cbc.ca/webfeed/rss/rss-world",
    priority: 50,
  },
  {
    id: "cnn-world",
    name: "CNN World",
    baseUrl: "https://www.cnn.com",
    feedUrl: "http://rss.cnn.com/rss/cnn_world.rss",
    priority: 50,
  },
  {
    id: "nbc-world",
    name: "NBC News World",
    baseUrl: "https://www.nbcnews.com",
    feedUrl: "https://feeds.nbcnews.com/nbcnews/public/world",
    priority: 50,
  },
  {
    id: "cbs-world",
    name: "CBS News World",
    baseUrl: "https://www.cbsnews.com",
    feedUrl: "https://www.cbsnews.com/latest/rss/world",
    priority: 50,
  },
  {
    id: "abc-news-international",
    name: "ABC News International",
    baseUrl: "https://abcnews.go.com",
    feedUrl: "https://abcnews.go.com/abcnews/internationalheadlines",
    priority: 50,
  },
  {
    id: "politico",
    name: "Politico",
    baseUrl: "https://www.politico.com",
    feedUrl: "https://rss.politico.com/politics-news.xml",
    priority: 45,
  },
  {
    id: "atlantic",
    name: "The Atlantic",
    baseUrl: "https://www.theatlantic.com",
    feedUrl: "https://www.theatlantic.com/feed/all/",
    priority: 45,
  },
  {
    id: "latimes-world",
    name: "Los Angeles Times World",
    baseUrl: "https://www.latimes.com",
    feedUrl: "https://www.latimes.com/world-nation/rss2.0.xml",
    priority: 45,
  },
  {
    id: "independent-world",
    name: "The Independent World",
    baseUrl: "https://www.independent.co.uk",
    feedUrl: "https://www.independent.co.uk/news/world/rss",
    priority: 45,
  },
  {
    id: "telegraph",
    name: "The Telegraph",
    baseUrl: "https://www.telegraph.co.uk",
    feedUrl: "https://www.telegraph.co.uk/rss.xml",
    priority: 40,
  },
  {
    id: "smh-world",
    name: "Sydney Morning Herald World",
    baseUrl: "https://www.smh.com.au",
    feedUrl: "https://www.smh.com.au/rss/world.xml",
    priority: 40,
  },
  {
    id: "hindu-international",
    name: "The Hindu International",
    baseUrl: "https://www.thehindu.com",
    feedUrl: "https://www.thehindu.com/news/international/feeder/default.rss",
    priority: 40,
  },
  {
    id: "japan-times",
    name: "The Japan Times",
    baseUrl: "https://www.japantimes.co.jp",
    feedUrl: "https://www.japantimes.co.jp/feed/",
    priority: 40,
  },
  {
    id: "euronews",
    name: "Euronews",
    baseUrl: "https://www.euronews.com",
    feedUrl: "https://www.euronews.com/rss",
    priority: 40,
  },
  {
    id: "globe-mail-world",
    name: "The Globe and Mail World",
    baseUrl: "https://www.theglobeandmail.com",
    feedUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/world/",
    priority: 40,
  },
  {
    id: "global-news",
    name: "Global News",
    baseUrl: "https://globalnews.ca",
    feedUrl: "https://globalnews.ca/feed/",
    priority: 35,
  },
  {
    id: "time",
    name: "Time",
    baseUrl: "https://time.com",
    feedUrl: "https://time.com/feed/",
    priority: 35,
  },
];

export function catalogById(id: string) {
  return SOURCE_CATALOG.find((row) => row.id === id) ?? null;
}
