/**
 * GNews API Integration for stancestream
 * Fetches real-time news articles for debate topic discovery.
 * https://gnews.io/docs/v4
 *
 * Env: GNEWS_API_KEY
 * Free tier: 100 requests/day, 10 articles/request
 */

const GNEWS_BASE = "https://gnews.io/api/v4";

/**
 * @typedef {Object} GNewsArticle
 * @property {string} title
 * @property {string} description
 * @property {string} content - First 260 chars on free tier
 * @property {string} url
 * @property {string} image
 * @property {string} publishedAt - ISO 8601
 * @property {{ name: string, url: string }} source
 */

function apiKey() {
  const key = process.env.GNEWS_API_KEY;
  if (!key) throw new Error("GNEWS_API_KEY is not set");
  return key;
}

/**
 * Search news by query string with optional filters.
 * @param {string} query - Search keywords
 * @param {Object} [options]
 * @param {number} [options.max=10] - Number of articles (1-100 on paid, 1-10 free)
 * @param {string} [options.lang='en'] - ISO language code
 * @param {string} [options.country] - ISO country code
 * @param {string} [options.from] - ISO 8601 date string (YYYY-MM-DDTHH:mm:ssZ)
 * @param {string} [options.to] - ISO 8601 date string
 * @param {'publishedAt'|'relevance'} [options.sortby='publishedAt']
 * @returns {Promise<{ articles: GNewsArticle[], totalArticles: number }>}
 */
export async function searchNews(query, options = {}) {
  const {
    max = 10,
    lang = "en",
    country,
    from,
    to,
    sortby = "publishedAt",
  } = options;

  const params = new URLSearchParams({
    q: query,
    max: String(Math.min(max, 10)), // Free tier cap
    lang,
    sortby,
    apikey: apiKey(),
  });
  if (country) params.set("country", country);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const res = await fetch(`${GNEWS_BASE}/search?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GNews API ${res.status}: ${JSON.stringify(err)}`);
  }
  return res.json();
}

/**
 * Fetch top headlines for a topic category.
 * @param {Object} [options]
 * @param {'breaking-news'|'world'|'nation'|'business'|'technology'|'entertainment'|'sports'|'science'|'health'} [options.topic='world']
 * @param {string} [options.lang='en']
 * @param {number} [options.max=10]
 * @returns {Promise<{ articles: GNewsArticle[], totalArticles: number }>}
 */
export async function getTopHeadlines(options = {}) {
  const { topic = "world", lang = "en", max = 10, country } = options;

  const params = new URLSearchParams({
    topic,
    lang,
    max: String(Math.min(max, 10)),
    apikey: apiKey(),
  });
  if (country) params.set("country", country);

  const res = await fetch(`${GNEWS_BASE}/top-headlines?${params}`);
  if (!res.ok) return { articles: [], totalArticles: 0 };
  return res.json();
}

/**
 * Build a debate-ready topic feed by searching multiple angles.
 * Returns articles grouped by viewpoint keywords.
 *
 * @param {string} topic - Core debate topic e.g. "artificial intelligence regulation"
 * @returns {Promise<{ pro: GNewsArticle[], con: GNewsArticle[], neutral: GNewsArticle[] }>}
 */
export async function buildDebateTopicFeed(topic) {
  const [proRes, conRes, neutralRes] = await Promise.allSettled([
    searchNews(`${topic} benefits advantages support`, { max: 5 }),
    searchNews(`${topic} risks dangers opposition`, { max: 5 }),
    searchNews(topic, { max: 5, sortby: "publishedAt" }),
  ]);

  return {
    pro: proRes.status === "fulfilled" ? (proRes.value.articles ?? []) : [],
    con: conRes.status === "fulfilled" ? (conRes.value.articles ?? []) : [],
    neutral:
      neutralRes.status === "fulfilled"
        ? (neutralRes.value.articles ?? [])
        : [],
  };
}

/**
 * Suggested news topic categories for the debate platform.
 */
export const DEBATE_TOPICS = [
  {
    id: "technology",
    label: "Technology & AI",
    query: "artificial intelligence",
  },
  { id: "politics", label: "Politics & Policy", query: "government policy" },
  { id: "climate", label: "Climate & Environment", query: "climate change" },
  { id: "economy", label: "Economy & Finance", query: "economic policy" },
  { id: "health", label: "Health & Medicine", query: "healthcare" },
  { id: "social", label: "Society & Culture", query: "social issues" },
];
