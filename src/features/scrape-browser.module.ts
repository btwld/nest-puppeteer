import type { CanActivate } from "@nestjs/common";
import {
  Body,
  Controller,
  type DynamicModule,
  HttpCode,
  Inject,
  Injectable,
  Module,
  Post,
  type Type,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { LaunchOptions } from "puppeteer";
import type { ScrapeDto } from "../dto/index.js";
import type { CommonBrowserOptions } from "../interfaces/common-options.interface.js";
import type { ScrapeOptions, ScrapeResult } from "../interfaces/scrape-options.interface.js";
import { PuppeteerModule } from "../puppeteer.module.js";
import { PuppeteerService } from "../puppeteer.service.js";
import { BrowserRenderingExceptionFilter } from "../puppeteer-exception.filter.js";
import { BrowserRenderingInterceptor, ResultKey } from "../puppeteer-response.interceptor.js";
import { mergeWithDefaults } from "../utils/merge-defaults.js";

const SCRAPE_BROWSER_DEFAULTS = "ScrapeBrowserDefaults";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export type ScrapeBrowserDefaults = Pick<
  CommonBrowserOptions,
  "gotoOptions" | "waitForSelector" | "userAgent" | "viewport" | "setJavaScriptEnabled"
>;

export interface ScrapeBrowserModuleOptions {
  defaults?: ScrapeBrowserDefaults;
  prefix?: string;
  guards?: (Type<CanActivate> | CanActivate)[];
}

export interface ScrapeBrowserForRootOptions extends ScrapeBrowserModuleOptions {
  launchOptions?: LaunchOptions;
  isGlobal?: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class ScrapeBrowserService {
  constructor(
    @Inject(PuppeteerService)
    private readonly puppeteerService: PuppeteerService,
    @Inject(SCRAPE_BROWSER_DEFAULTS)
    private readonly defaults: ScrapeBrowserDefaults,
  ) {}

  /** Scrape elements matching CSS selectors. Merges module defaults. */
  async scrape(options: ScrapeOptions): Promise<ScrapeResult[]> {
    return this.puppeteerService.scrape(mergeWithDefaults(this.defaults, options) as ScrapeOptions);
  }
}

// ---------------------------------------------------------------------------
// Controller factory
// ---------------------------------------------------------------------------

function createScrapeController(prefix: string, guards: any[]): Type {
  @Controller(prefix)
  @UseGuards(...guards)
  @ApiTags("browser-rendering")
  class ScrapeBrowserController {
    constructor(
      @Inject(ScrapeBrowserService)
      private readonly scrapeService: ScrapeBrowserService,
    ) {}

    @Post()
    @HttpCode(200)
    @ResultKey()
    @ApiOperation({ summary: "Scrape elements by CSS selectors" })
    @ApiResponse({ status: 200, description: "Scraped elements" })
    async scrape(@Body() body: ScrapeDto) {
      const results = await this.scrapeService.scrape(body);
      return { results };
    }
  }
  return ScrapeBrowserController;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({})
export class ScrapeBrowserModule {
  static forRoot(options: ScrapeBrowserForRootOptions = {}): DynamicModule {
    const { launchOptions, isGlobal, ...registerOptions } = options;
    const built = ScrapeBrowserModule.buildProviders(registerOptions, true);

    return {
      module: ScrapeBrowserModule,
      global: isGlobal,
      imports: [PuppeteerModule.forRoot(launchOptions)],
      controllers: built.controllers,
      providers: built.providers,
      exports: [ScrapeBrowserService],
    };
  }

  static register(options: ScrapeBrowserModuleOptions = {}): DynamicModule {
    const built = ScrapeBrowserModule.buildProviders(options);

    return {
      module: ScrapeBrowserModule,
      controllers: built.controllers,
      providers: built.providers,
      exports: [ScrapeBrowserService],
    };
  }

  private static buildProviders(options: ScrapeBrowserModuleOptions, standalone = false) {
    const providers: any[] = [
      {
        provide: SCRAPE_BROWSER_DEFAULTS,
        useValue: options.defaults ?? {},
      },
      ScrapeBrowserService,
    ];

    const controllers: Type[] = [];
    if (options.prefix) {
      controllers.push(createScrapeController(options.prefix, options.guards ?? []));
      if (standalone) {
        providers.push({ provide: APP_INTERCEPTOR, useClass: BrowserRenderingInterceptor });
        providers.push({ provide: APP_FILTER, useClass: BrowserRenderingExceptionFilter });
        providers.push({
          provide: APP_PIPE,
          useValue: new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: false,
          }),
        });
      }
    }

    return { providers, controllers };
  }
}
