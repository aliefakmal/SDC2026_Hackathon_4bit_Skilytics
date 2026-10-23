import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchCareerFeed, newsUrl, NewsFeedError } from "./career-news";

test("GDELT uses a documented timespan and Malaysia subject context without auth", async () => {
  const u = new URL(newsUrl("gdelt", "my"));
  assert.equal(u.searchParams.get("timespan"), "30d");
  assert.match(u.searchParams.get("query")!, /Malaysia/);
  assert.equal(u.searchParams.has("apikey"), false);
  const rows = await fetchCareerFeed("gdelt", "my", (async (_url, options) => {
    assert.equal("Authorization" in (options?.headers ?? {}), false);
    return Response.json({
      articles: [
        {
          title: "Malaysia expands workforce training",
          url: "https://www.reuters.com/test-career",
          domain: "reuters.com",
          seendate: new Date()
            .toISOString()
            .replace(/[-:]/g, "")
            .replace(/\.\d+Z$/, "Z"),
        },
      ],
    });
  }) as typeof fetch);
  assert.equal(rows.length, 1);
});
test("HTTP 429 is a rate limit, respects Retry-After, and is never described as missing auth", async () => {
  await assert.rejects(
    fetchCareerFeed(
      "gdelt",
      "global",
      (async () =>
        new Response("Too many requests", {
          status: 429,
          headers: { "Retry-After": "1200" },
        })) as typeof fetch,
    ),
    (error) =>
      error instanceof NewsFeedError &&
      error.code === "news_rate_limited" &&
      error.retryAfterMs === 1200000,
  );
});
test("timeouts and malformed public responses retain distinct diagnostics", async () => {
  await assert.rejects(
    fetchCareerFeed("gdelt", "global", (async () => {
      throw new DOMException("Timed out", "TimeoutError");
    }) as typeof fetch),
    (error) => error instanceof NewsFeedError && error.code === "news_timeout",
  );
  await assert.rejects(
    fetchCareerFeed(
      "gdelt",
      "global",
      (async () => new Response("temporary upstream error")) as typeof fetch,
    ),
    (error) =>
      error instanceof NewsFeedError && error.code === "news_invalid_response",
  );
});
