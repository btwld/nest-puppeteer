# REST Endpoints

Expose Cloudflare Browser Rendering-compatible HTTP endpoints. REST is opt-in — omit the `rest` option for service-only mode.

## Enabling REST

### All features

```ts
PuppeteerModule.forRoot({
  rest: {
    prefix: 'browser-rendering',
    guards: [AuthGuard],
  },
})
```

### Selective features

Only expose the endpoints you need:

```ts
PuppeteerModule.forRoot({
  rest: {
    prefix: 'browser-rendering',
    features: ['pdf', 'screenshot', 'scrape'],
    guards: [AuthGuard],
  },
})
```

Disabled features return 404. Valid feature names: `'content'`, `'screenshot'`, `'pdf'`, `'markdown'`, `'snapshot'`, `'scrape'`, `'links'`.

### With async config

The `rest` option is known at registration time (not async-resolved):

```ts
PuppeteerModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    launchOptions: { headless: config.get('HEADLESS') },
  }),
  inject: [ConfigService],
  rest: {
    prefix: 'api/browser',
    features: ['pdf', 'screenshot'],
    guards: [AuthGuard],
  },
})
```

## Endpoints

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/{prefix}/content` | `ContentDto` | `{ success, result: { html } }` |
| POST | `/{prefix}/screenshot` | `ScreenshotDto` | Binary image (`image/jpeg`) |
| POST | `/{prefix}/pdf` | `PdfDto` | Binary PDF (`application/pdf`) |
| POST | `/{prefix}/markdown` | `MarkdownDto` | `{ success, result: { markdown } }` |
| POST | `/{prefix}/snapshot` | `SnapshotDto` | `{ success, result: { html, screenshot } }` |
| POST | `/{prefix}/scrape` | `ScrapeDto` | `{ success, result: { results } }` |
| POST | `/{prefix}/links` | `LinksDto` | `{ success, result: [...urls] }` |

## Request Examples

### Fetch HTML content

```bash
curl -X POST http://localhost:3000/browser-rendering/content \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "waitForSelector": { "selector": "#app", "visible": true }
  }'
```

```json
{
  "success": true,
  "result": {
    "html": "<!DOCTYPE html><html>..."
  }
}
```

### Screenshot

```bash
curl -X POST http://localhost:3000/browser-rendering/screenshot \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com", "fullPage": true, "type": "png"}' \
  --output screenshot.png
```

### PDF

```bash
curl -X POST http://localhost:3000/browser-rendering/pdf \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com/invoice",
    "format": "a4",
    "printBackground": true,
    "margin": {"top": "1cm", "bottom": "1cm"}
  }' \
  --output invoice.pdf
```

### Scrape

```bash
curl -X POST http://localhost:3000/browser-rendering/scrape \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "selectors": ["h1", "p", "a[href]"]
  }'
```

```json
{
  "success": true,
  "result": {
    "results": [
      {
        "selector": "h1",
        "elements": [
          {
            "text": "Example Domain",
            "html": "Example Domain",
            "attributes": [],
            "width": 600,
            "height": 38,
            "top": 100,
            "left": 50
          }
        ]
      }
    ]
  }
}
```

## Guards

Guards apply to all REST endpoints for a given module:

```ts
PuppeteerModule.forRoot({
  rest: {
    prefix: 'browser-rendering',
    guards: [AuthGuard, RateLimitGuard, ApiKeyGuard],
  },
})
```

Guards are applied via `@UseGuards()` on the dynamic controller class, alongside the built-in `PuppeteerFeatureGuard` (which handles feature selection).

## Error Responses

All errors follow the Cloudflare format:

```json
{
  "success": false,
  "errors": [
    { "code": 400, "message": "Either \"url\" or \"html\" must be provided" }
  ]
}
```

Validation errors (when using class-validator) return multiple messages:

```json
{
  "success": false,
  "errors": [
    { "code": 400, "message": "selectors must contain at least one CSS selector" },
    { "code": 400, "message": "selectors should not be empty" }
  ]
}
```

## Response Wrapping

JSON responses are automatically wrapped by `BrowserRenderingInterceptor` (registered via `APP_INTERCEPTOR`). Binary responses (`StreamableFile`) pass through untouched.

The `@ResultKey('html')` decorator controls how primitive return values are nested:

```ts
// @ResultKey('html') + handler returns "..." →
{ "success": true, "result": { "html": "..." } }

// No @ResultKey() + handler returns [...] →
{ "success": true, "result": [...] }

// StreamableFile → binary passthrough
```

## Swagger

With `@nestjs/swagger` installed, all endpoints are auto-documented with:
- `@ApiTags('browser-rendering')`
- `@ApiOperation()` with summaries
- `@ApiResponse()` with typed response DTOs
- `@ApiProduces()` for binary endpoints
- Full DTO property documentation with types, enums, min/max, descriptions

```ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Browser Rendering API')
  .setVersion('1.0')
  .build();

SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
```
