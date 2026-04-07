# Service API

`PuppeteerService` provides 7 methods mirroring the [Cloudflare Browser Rendering API](https://developers.cloudflare.com/browser-rendering/). Each method creates a new page, performs the operation, and closes the page automatically.

## Common Options

All methods accept these shared options:

```ts
interface CommonBrowserOptions {
  // Source (one required)
  url?: string;
  html?: string;

  // Authentication
  authenticate?: { username: string; password: string };
  cookies?: CookieParam[];
  setExtraHTTPHeaders?: Record<string, string>;

  // Navigation
  gotoOptions?: {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
    timeout?: number;
  };
  waitForSelector?: { selector: string; timeout?: number; visible?: boolean };
  waitForTimeout?: number;

  // Resource filtering
  rejectResourceTypes?: ResourceType[];
  rejectRequestPattern?: string[];    // regex patterns
  allowResourceTypes?: ResourceType[];
  allowRequestPattern?: string[];

  // Page configuration
  userAgent?: string;
  viewport?: { width?: number; height?: number; deviceScaleFactor?: number };
  setJavaScriptEnabled?: boolean;
  emulateMediaType?: string;

  // Injection
  addScriptTag?: { url?: string; content?: string }[];
  addStyleTag?: { url?: string; content?: string }[];
}
```

> Either `url` or `html` is required for every call. Providing neither throws an error.

## content(options: ContentOptions): Promise\<string>

Fetch the fully rendered HTML of a page, including the `<head>` section.

```ts
const html = await puppeteerService.content({
  url: 'https://example.com',
  waitForSelector: { selector: '#app', visible: true },
  rejectResourceTypes: ['image', 'font'],
});
```

## screenshot(options: ScreenshotOptions): Promise\<Buffer>

Capture a screenshot as a binary buffer.

```ts
// Full page PNG
const buffer = await puppeteerService.screenshot({
  url: 'https://example.com',
  fullPage: true,
  type: 'png',
});

// Element screenshot
const chart = await puppeteerService.screenshot({
  url: 'https://example.com/dashboard',
  selector: '#revenue-chart',
  type: 'jpeg',
  quality: 90,
});

// Transparent background
const logo = await puppeteerService.screenshot({
  html: '<div style="color: red; font-size: 48px">Hello</div>',
  omitBackground: true,
  type: 'png',
});
```

**Screenshot-specific options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'png' \| 'jpeg' \| 'webp'` | -- | Image format |
| `quality` | `number` (0-100) | -- | Compression quality (jpeg/webp) |
| `fullPage` | `boolean` | `false` | Capture full scrollable page |
| `omitBackground` | `boolean` | `false` | Transparent background |
| `selector` | `string` | -- | Screenshot a specific element |
| `clip` | `{ x, y, width, height }` | -- | Clip to a region |
| `captureBeyondViewport` | `boolean` | -- | Capture outside viewport |

## pdf(options: PdfOptions): Promise\<Buffer>

Generate a PDF as a binary buffer.

```ts
const buffer = await puppeteerService.pdf({
  url: 'https://example.com/invoice/123',
  format: 'a4',
  printBackground: true,
  margin: { top: '2cm', bottom: '2cm', left: '1cm', right: '1cm' },
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:8px;width:100%;text-align:center;">Invoice</div>',
  footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
});
```

**PDF-specific options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `PaperFormat` | `'letter'` | Paper size (a0-a6, letter, legal, tabloid, ledger) |
| `landscape` | `boolean` | `false` | Landscape orientation |
| `printBackground` | `boolean` | `false` | Print background colors/images |
| `scale` | `number` (0.1-2) | `1` | Page scale factor |
| `margin` | `{ top?, bottom?, left?, right? }` | -- | Margins (CSS units) |
| `displayHeaderFooter` | `boolean` | `false` | Show header/footer |
| `headerTemplate` | `string` | -- | HTML template for header |
| `footerTemplate` | `string` | -- | HTML template for footer |
| `pageRanges` | `string` | -- | Pages to print, e.g. `'1-5, 8'` |
| `width` / `height` | `string \| number` | -- | Custom paper dimensions |
| `preferCSSPageSize` | `boolean` | `false` | Use CSS `@page` size |

## markdown(options: MarkdownOptions): Promise\<string>

Extract page content as Markdown using a built-in DOM-to-Markdown converter. Handles headings, paragraphs, links, lists, bold/italic, code blocks, images, tables, and blockquotes.

```ts
const md = await puppeteerService.markdown({
  url: 'https://example.com/blog/my-post',
  rejectResourceTypes: ['image', 'stylesheet', 'font'],
  waitForSelector: { selector: 'article' },
});
```

## snapshot(options: SnapshotOptions): Promise\<SnapshotResult>

Capture both rendered HTML and a screenshot in a single page load — more efficient than calling `content()` + `screenshot()` separately.

```ts
const { html, screenshot } = await puppeteerService.snapshot({
  url: 'https://example.com',
  fullPage: true,
  type: 'jpeg',
  quality: 80,
});

// html: string (rendered HTML)
// screenshot: Buffer (image binary)
```

Accepts all screenshot options (type, quality, fullPage, etc.) at the top level.

## scrape(options: ScrapeOptions): Promise\<ScrapeResult[]>

Extract structured data from specific elements using CSS selectors.

```ts
const results = await puppeteerService.scrape({
  url: 'https://example.com/products',
  selectors: ['h1', '.product-card', 'a.nav-link'],
  waitForSelector: { selector: '.product-card' },
});

for (const result of results) {
  console.log(`Selector: ${result.selector}`);
  for (const el of result.elements) {
    console.log(`  text: ${el.text}`);
    console.log(`  html: ${el.html}`);
    console.log(`  attributes:`, el.attributes);
    console.log(`  dimensions: ${el.width}x${el.height} at (${el.left}, ${el.top})`);
  }
}
```

**Response structure:**

```ts
interface ScrapeResult {
  selector: string;
  elements: Array<{
    text: string;
    html: string;
    attributes: Array<{ name: string; value: string }>;
    width: number;
    height: number;
    top: number;
    left: number;
  }>;
}
```

## links(options: LinksOptions): Promise\<string[]>

Extract all unique `<a href>` links from a page.

```ts
const urls = await puppeteerService.links({
  url: 'https://example.com',
  visibleLinksOnly: true,
});
// ['https://example.com/about', 'https://example.com/contact', ...]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `visibleLinksOnly` | `boolean` | `false` | Exclude hidden/invisible links |

## Resource Filtering

Block or allow specific resource types and URL patterns to speed up page loads:

```ts
// Block images and stylesheets
const html = await puppeteerService.content({
  url: 'https://example.com',
  rejectResourceTypes: ['image', 'stylesheet', 'font'],
});

// Block tracking scripts
const html = await puppeteerService.content({
  url: 'https://example.com',
  rejectRequestPattern: ['google-analytics\\.com', 'facebook\\.net'],
});

// Only allow document and script resources
const html = await puppeteerService.content({
  url: 'https://example.com',
  allowResourceTypes: ['document', 'script'],
});
```

When both allow and reject lists are provided, allow lists take precedence.

## Rendering HTML Directly

All methods accept `html` instead of `url`:

```ts
const pdf = await puppeteerService.pdf({
  html: `
    <html>
      <head><style>body { font-family: Arial; }</style></head>
      <body><h1>Hello World</h1><p>Generated at ${new Date()}</p></body>
    </html>
  `,
  format: 'a4',
});
```
