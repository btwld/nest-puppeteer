# Cloudflare Browser Rendering API Parity

Tracking feature parity with the [Cloudflare Browser Rendering REST API](https://developers.cloudflare.com/browser-rendering/).

> Last checked: 2026-04-07

## Endpoints

| Cloudflare Endpoint | Ours | Status | Notes |
|---------------------|------|--------|-------|
| `POST /content` | `PuppeteerService.content()` | **Parity** | |
| `POST /screenshot` | `PuppeteerService.screenshot()` | **Parity** | |
| `POST /pdf` | `PuppeteerService.pdf()` | **Parity** | |
| `POST /markdown` | `PuppeteerService.markdown()` | **Parity** | |
| `POST /snapshot` | `PuppeteerService.snapshot()` | **Parity** | |
| `POST /scrape` | `PuppeteerService.scrape()` | **Parity** | |
| `POST /links` | `PuppeteerService.links()` | **Parity** | |
| `POST /json` | `PuppeteerService.json()` | **Parity** | Uses configurable OpenAI-compatible API (no Workers AI default) |
| `POST /crawl` | `CrawlService.startCrawl()` | **Parity** | In-memory job store, BFS crawling |
| `GET /crawl/:jobId` | `CrawlService.getCrawlStatus()` | **Parity** | Cursor-based pagination |
| `DELETE /crawl/:jobId` | `CrawlService.cancelCrawl()` | **Parity** | |

## Common Request Fields

| Cloudflare Field | Ours | Status |
|------------------|------|--------|
| `url` | `url` | **Parity** |
| `html` | `html` | **Parity** |
| `authenticate` | `authenticate` | **Parity** |
| `authenticate.username` | `authenticate.username` | **Parity** |
| `authenticate.password` | `authenticate.password` | **Parity** |
| `cookies` | `cookies` | **Parity** |
| `cookies[].name` | `cookies[].name` | **Parity** |
| `cookies[].value` | `cookies[].value` | **Parity** |
| `cookies[].domain` | `cookies[].domain` | **Parity** |
| `cookies[].path` | `cookies[].path` | **Parity** |
| `cookies[].expires` | `cookies[].expires` | **Parity** |
| `cookies[].httpOnly` | `cookies[].httpOnly` | **Parity** |
| `cookies[].secure` | `cookies[].secure` | **Parity** |
| `cookies[].sameSite` | `cookies[].sameSite` | **Parity** |
| `setExtraHTTPHeaders` | `setExtraHTTPHeaders` | **Parity** |
| `userAgent` | `userAgent` | **Parity** |
| `gotoOptions` | `gotoOptions` | **Parity** |
| `gotoOptions.waitUntil` | `gotoOptions.waitUntil` | **Parity** |
| `gotoOptions.timeout` | `gotoOptions.timeout` | **Parity** |
| `waitForSelector` | `waitForSelector` | **Parity** |
| `waitForSelector.selector` | `waitForSelector.selector` | **Parity** |
| `waitForSelector.timeout` | `waitForSelector.timeout` | **Parity** |
| `waitForSelector.visible` | `waitForSelector.visible` | **Parity** |
| `rejectResourceTypes` | `rejectResourceTypes` | **Parity** |
| `rejectRequestPattern` | `rejectRequestPattern` | **Parity** |
| `allowResourceTypes` | `allowResourceTypes` | **Parity** |
| `allowRequestPattern` | `allowRequestPattern` | **Parity** |

## Screenshot Fields

| Cloudflare Field | Ours | Status | Notes |
|------------------|------|--------|-------|
| `fullPage` | `fullPage` | **Parity** | |
| `quality` | `quality` | **Parity** | 0-100 |

## PDF Fields

| Cloudflare Field | Ours | Status | Notes |
|------------------|------|--------|-------|
| margin fields | `margin` | **Parity** | We use `margin: { top, bottom, left, right }` object |
| (other PDF fields not detailed in CF docs) | Full Puppeteer PDF options | **Superset** | We expose all Puppeteer PDF options |

## Scrape Fields

| Cloudflare Field | Ours | Status | Notes |
|------------------|------|--------|-------|
| `selectors` | `selectors` | **Parity** | Array of CSS selector strings |

## Links Fields

| Cloudflare Field | Ours | Status | Notes |
|------------------|------|--------|-------|
| `visibleLinksOnly` | `visibleLinksOnly` | **Parity** | Default: `false` |

## JSON Endpoint Fields

| Cloudflare Field | Ours | Status | Notes |
|------------------|------|--------|-------|
| `prompt` | `prompt` | **Parity** | |
| `response_format` | `response_format` | **Parity** | |
| `response_format.type` | `response_format.type` | **Parity** | |
| `response_format.schema` | `response_format.schema` | **Parity** | |
| `custom_ai` | `custom_ai` | **Parity** | Array, first entry used |
| `custom_ai[].model` | `custom_ai[].model` | **Parity** | |
| `custom_ai[].authorization` | `custom_ai[].authorization` | **Parity** | |
| Default Workers AI model | `defaultAi` module option | **Different** | No Workers AI; uses configurable OpenAI-compatible provider |
| `custom_ai[].baseUrl` | `custom_ai[].baseUrl` | **Extension** | Not in CF; allows custom API base URL |

## Crawl Endpoint Fields

| Cloudflare Field | Ours | Status | Notes |
|------------------|------|--------|-------|
| `url` | `url` | **Parity** | Required |
| `limit` | `limit` | **Parity** | Default 10, max 100,000 |
| `depth` | `depth` | **Parity** | Default 100,000 |
| `source` | `source` | **Parity** | `all` / `sitemaps` / `links` |
| `formats` | `formats` | **Parity** | `html` / `markdown` / `json` |
| `render` | `render` | **Parity** | Default true |
| `maxAge` | `maxAge` | **Parity** | |
| `modifiedSince` | `modifiedSince` | **Parity** | |
| `crawlPurposes` | `crawlPurposes` | **Parity** | |
| `options.includeExternalLinks` | `options.includeExternalLinks` | **Parity** | |
| `options.includeSubdomains` | `options.includeSubdomains` | **Parity** | |
| `options.includePatterns` | `options.includePatterns` | **Parity** | Wildcard support |
| `options.excludePatterns` | `options.excludePatterns` | **Parity** | |
| `jsonOptions` | `jsonOptions` | **Parity** | AI extraction for crawled pages |
| Job persistence (14 days) | In-memory | **Different** | Jobs lost on restart; extend with custom store |
| 7-day timeout | Not enforced | **Different** | No auto-timeout; can add via config |

## Response Format

| Cloudflare | Ours | Status |
|------------|------|--------|
| `{ success: true, result }` (JSON) | `{ success: true, result }` | **Parity** |
| Binary for screenshot (image/jpeg) | Binary via `StreamableFile` | **Parity** |
| Binary for PDF (application/pdf) | Binary via `StreamableFile` | **Parity** |
| `/content` → `{ result: { html } }` | `{ result: { html } }` | **Parity** |
| `/markdown` → `{ result: { markdown } }` | `{ result: { markdown } }` | **Parity** |
| `/snapshot` → `{ result: { html, screenshot } }` | `{ result: { html, screenshot } }` | **Parity** |
| `/scrape` → `{ result: { results: [...] } }` | `{ result: { results: [...] } }` | **Parity** |
| `/links` → `{ result: [...urls] }` | `{ result: [...urls] }` | **Parity** |
| `X-Browser-Ms-Used` response header | `BrowserRenderingInterceptor` | **Parity** | Set via interceptor on all responses |

## Our Extensions (beyond Cloudflare)

Features we provide that Cloudflare does not:

| Feature | Field/Option | Notes |
|---------|-------------|-------|
| Font loading | `waitForFonts` | Calls `document.fonts.ready` |
| Static delay | `waitForTimeout` | Delay (ms) after navigation |
| Viewport control | `viewport` | `{ width, height, deviceScaleFactor, isMobile }` |
| JavaScript toggle | `setJavaScriptEnabled` | Disable JS execution |
| Media emulation | `emulateMediaType` | `'screen'` / `'print'` |
| Script injection | `addScriptTag` | Inject `<script>` tags |
| Style injection | `addStyleTag` | Inject `<style>` tags |
| Element screenshot | `selector` | Screenshot a specific CSS selector |
| Hidden selector wait | `waitForSelector.hidden` | Wait for element to disappear |
| Full PDF options | All Puppeteer PDF options | `headerTemplate`, `footerTemplate`, `scale`, `tagged`, etc. |
| Full screenshot options | All Puppeteer screenshot options | `clip`, `captureBeyondViewport`, `optimizeForSpeed` |
| Feature modules | `PdfBrowserModule`, etc. | Pre-configured single-feature modules |
| Feature selection | `rest.features` | Enable/disable specific REST endpoints |
| Guards | `rest.guards` | NestJS guards on REST endpoints |
| Named instances | `instanceName` | Multiple browser instances |
| Named pages | `forFeature()` | Singleton page injection |
| Mock providers | `createMockPuppeteerProviders()` | Testing utility |

## Remaining Differences

| Area | Cloudflare | Ours | Impact |
|------|-----------|------|--------|
| AI default | Workers AI (Meta Llama 3.3 70B) | None — must configure `defaultAi` or `custom_ai` | User must bring their own AI provider |
| Crawl persistence | 14-day job retention | In-memory (lost on restart) | Production use needs a custom store adapter |
| Crawl timeout | Auto-cancel after 7 days | Not enforced | Long crawls run indefinitely |
| Sitemap discovery | `source: "sitemaps"` parses sitemap.xml | Not implemented | Crawl only follows `<a>` links |
| robots.txt | Respects robots.txt (`disallowed` status) | Not checked | All URLs are crawled |
