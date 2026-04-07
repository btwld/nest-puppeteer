# Getting Started

## Installation

```bash
npm install @bitwild/nest-puppeteer puppeteer
```

For REST endpoints, validation, and Swagger docs (optional):

```bash
npm install class-validator class-transformer @nestjs/swagger
```

## Basic Setup

Import `PuppeteerModule` in your root module:

```ts
import { Module } from '@nestjs/common';
import { PuppeteerModule } from '@bitwild/nest-puppeteer';

@Module({
  imports: [PuppeteerModule.forRoot()],
})
export class AppModule {}
```

This launches a headless Chrome instance with sensible defaults:
- `headless: true`
- `pipe: true` (non-Windows)
- `--no-zygote`, `--disable-blink-features=AutomationControlled`
- `--no-sandbox` (Linux only)

## Custom Launch Options

Pass any Puppeteer `LaunchOptions` directly:

```ts
PuppeteerModule.forRoot({
  headless: 'shell',           // old headless mode
  args: ['--window-size=1920,1080'],
  timeout: 60000,
})
```

Custom args are **merged** with the defaults (de-duplicated). To skip defaults entirely:

```ts
PuppeteerModule.forRoot({
  ignoreDefaultArgs: true,
  args: ['--no-sandbox'],
})
```

Or filter specific defaults:

```ts
PuppeteerModule.forRoot({
  ignoreDefaultArgs: ['--no-zygote'],
})
```

## Async Configuration

When launch options depend on runtime configuration:

```ts
import { ConfigModule, ConfigService } from '@nestjs/config';

PuppeteerModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    launchOptions: {
      headless: config.get('PUPPETEER_HEADLESS', true),
      executablePath: config.get('CHROME_PATH'),
    },
  }),
  inject: [ConfigService],
})
```

### Factory class pattern

```ts
@Injectable()
class PuppeteerConfigService implements PuppeteerOptionsFactory {
  constructor(private config: ConfigService) {}

  createPuppeteerOptions(): PuppeteerModuleOptions {
    return {
      launchOptions: {
        headless: this.config.get('HEADLESS'),
      },
    };
  }
}

PuppeteerModule.forRootAsync({
  imports: [ConfigModule],
  useClass: PuppeteerConfigService,
})
```

## Global Module

The module is **global** by default via `@Global()` on the core module. This means `PuppeteerService`, `Browser`, `BrowserContext`, and `Page` are available for injection in any module without re-importing.

To register as non-global:

```ts
PuppeteerModule.forRoot({ isGlobal: false })
```

## Next Steps

- [Service API](./service-api.md) -- Use `PuppeteerService` methods
- [REST Endpoints](./rest-endpoints.md) -- Expose HTTP API
- [Feature Modules](./feature-modules.md) -- Pre-configured per-feature modules
- [Low-level Access](./low-level-access.md) -- Direct Browser/Page injection
