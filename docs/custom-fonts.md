# Custom Fonts

Puppeteer renders pages using the fonts available in the browser. Custom fonts can be loaded via CSS, embedded as base64, or installed on the system.

## waitForFonts

All methods support `waitForFonts: true`, which calls `document.fonts.ready` before capturing. This ensures fonts have finished downloading and rendering.

```ts
const pdf = await puppeteerService.pdf({
  url: 'https://example.com/invoice',
  waitForFonts: true,
  format: 'a4',
});
```

> **Always enable `waitForFonts` when using custom fonts.** Without it, Puppeteer may capture the page before fonts load, resulting in fallback font rendering.

## Loading Fonts

### CSS `@font-face` (remote URL)

```ts
const pdf = await puppeteerService.pdf({
  html: `
    <html>
      <head>
        <style>
          @font-face {
            font-family: 'CustomFont';
            src: url('https://example.com/fonts/CustomFont.woff2') format('woff2');
            font-weight: 400;
          }
          @font-face {
            font-family: 'CustomFont';
            src: url('https://example.com/fonts/CustomFont-Bold.woff2') format('woff2');
            font-weight: 700;
          }
          body { font-family: 'CustomFont', sans-serif; }
        </style>
      </head>
      <body>
        <h1>Bold heading</h1>
        <p>Regular text</p>
      </body>
    </html>
  `,
  waitForFonts: true,
  format: 'a4',
});
```

### Google Fonts

```ts
const pdf = await puppeteerService.pdf({
  html: `
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>body { font-family: 'Inter', sans-serif; }</style>
      </head>
      <body>...</body>
    </html>
  `,
  waitForFonts: true,
  format: 'a4',
});
```

### Base64-embedded font (no network required)

Useful for air-gapped environments or guaranteed font availability:

```ts
import { readFileSync } from 'fs';
import { join } from 'path';

const fontBase64 = readFileSync(join(__dirname, 'fonts/MyFont.woff2')).toString('base64');

const pdf = await puppeteerService.pdf({
  html: `
    <html>
      <head>
        <style>
          @font-face {
            font-family: 'MyFont';
            src: url(data:font/woff2;base64,${fontBase64}) format('woff2');
          }
          body { font-family: 'MyFont', sans-serif; }
        </style>
      </head>
      <body>...</body>
    </html>
  `,
  waitForFonts: true,
  format: 'a4',
});
```

### Inject font into an existing page via `addStyleTag`

When rendering a URL you don't control, override fonts with `addStyleTag`:

```ts
const pdf = await puppeteerService.pdf({
  url: 'https://example.com/report',
  addStyleTag: [{
    content: `
      @font-face {
        font-family: 'BrandFont';
        src: url('https://cdn.example.com/fonts/BrandFont.woff2') format('woff2');
      }
      body, p, h1, h2, h3 { font-family: 'BrandFont', sans-serif !important; }
    `,
  }],
  waitForFonts: true,
  format: 'a4',
});
```

## System Fonts (Docker)

Install fonts at the OS level so they're available to all pages without CSS changes.

### Debian/Ubuntu packages

```dockerfile
RUN apt-get update && apt-get install -y \
    # Core Latin fonts
    fonts-liberation \
    # CJK (Chinese, Japanese, Korean)
    fonts-noto-cjk \
    # Broad Unicode coverage
    fonts-noto-core \
    # Emoji
    fonts-noto-color-emoji \
    # Microsoft-compatible (Arial, Times, Courier)
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
```

### Custom font files

```dockerfile
COPY ./fonts/*.ttf /usr/local/share/fonts/
COPY ./fonts/*.woff2 /usr/local/share/fonts/
RUN fc-cache -fv
```

System fonts are immediately available:

```ts
const pdf = await puppeteerService.pdf({
  html: '<body style="font-family: MyCustomFont">Hello</body>',
  format: 'a4',
  // No waitForFonts needed — system fonts load synchronously
});
```

## Feature Module Defaults

Set `waitForFonts` as a default for all calls:

```ts
PdfBrowserModule.register({
  defaults: {
    format: 'a4',
    printBackground: true,
  },
  prefix: 'api/pdf',
})
```

> Note: `waitForFonts` is a common option, so it's set on the request body, not in `defaults` (which only covers feature-specific options like `format`). To always wait for fonts, create a wrapper service or use `gotoOptions: { waitUntil: 'networkidle0' }` as a default, which also waits for font downloads.

## Troubleshooting

### Fonts not rendering

1. **Enable `waitForFonts: true`** — most common fix
2. **Check `gotoOptions.waitUntil`** — use `'networkidle0'` to wait for all network requests (including font downloads) to finish
3. **Check resource filtering** — if using `rejectResourceTypes`, make sure `'font'` is not in the list
4. **Verify font URL** — remote font URLs must be accessible from the server running Puppeteer

### Garbled text (CJK, Arabic, etc.)

Install the appropriate Noto font package in your Docker image:

```dockerfile
RUN apt-get update && apt-get install -y \
    fonts-noto-cjk \          # Chinese/Japanese/Korean
    fonts-noto-extra \         # Additional scripts
    fonts-noto-color-emoji \   # Emoji
    --no-install-recommends
```

### Font renders differently than expected

Puppeteer uses the actual browser rendering engine. Differences from local development may be caused by:
- Missing font weights (only regular installed, bold missing)
- Different font fallback chains between OS/Docker
- Sub-pixel rendering differences in headless mode

Fix: embed the exact font files you need via `@font-face` with `waitForFonts: true`.
