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
import type { ContentDto } from "../dto/index.js";
import type { CommonBrowserOptions } from "../interfaces/common-options.interface.js";
import type { ContentOptions } from "../interfaces/content-options.interface.js";
import { PuppeteerModule } from "../puppeteer.module.js";
import { PuppeteerService } from "../puppeteer.service.js";
import { BrowserRenderingExceptionFilter } from "../puppeteer-exception.filter.js";
import { BrowserRenderingInterceptor, ResultKey } from "../puppeteer-response.interceptor.js";
import { mergeWithDefaults } from "../utils/merge-defaults.js";

const CONTENT_BROWSER_DEFAULTS = "ContentBrowserDefaults";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/** Default common options applied to every content request */
export type ContentBrowserDefaults = Pick<
  CommonBrowserOptions,
  "gotoOptions" | "waitForSelector" | "userAgent" | "viewport" | "setJavaScriptEnabled"
>;

export interface ContentBrowserModuleOptions {
  defaults?: ContentBrowserDefaults;
  prefix?: string;
  guards?: (Type<CanActivate> | CanActivate)[];
}

export interface ContentBrowserForRootOptions extends ContentBrowserModuleOptions {
  launchOptions?: LaunchOptions;
  isGlobal?: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class ContentBrowserService {
  constructor(
    @Inject(PuppeteerService)
    private readonly puppeteerService: PuppeteerService,
    @Inject(CONTENT_BROWSER_DEFAULTS)
    private readonly defaults: ContentBrowserDefaults,
  ) {}

  /** Fetch the rendered HTML content. Merges module defaults. */
  async fetch(options: ContentOptions): Promise<string> {
    return this.puppeteerService.content(mergeWithDefaults(this.defaults, options));
  }
}

// ---------------------------------------------------------------------------
// Controller factory
// ---------------------------------------------------------------------------

function createContentController(prefix: string, guards: any[]): Type {
  @Controller(prefix)
  @UseGuards(...guards)
  @ApiTags("browser-rendering")
  class ContentBrowserController {
    constructor(
      @Inject(ContentBrowserService)
      private readonly contentService: ContentBrowserService,
    ) {}

    @Post()
    @HttpCode(200)
    @ResultKey("html")
    @ApiOperation({ summary: "Fetch rendered HTML content" })
    @ApiResponse({ status: 200, description: "Rendered HTML" })
    async fetch(@Body() body: ContentDto) {
      return this.contentService.fetch(body);
    }
  }
  return ContentBrowserController;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({})
export class ContentBrowserModule {
  static forRoot(options: ContentBrowserForRootOptions = {}): DynamicModule {
    const { launchOptions, isGlobal, ...registerOptions } = options;
    const built = ContentBrowserModule.buildProviders(registerOptions, true);

    return {
      module: ContentBrowserModule,
      global: isGlobal,
      imports: [PuppeteerModule.forRoot(launchOptions)],
      controllers: built.controllers,
      providers: built.providers,
      exports: [ContentBrowserService],
    };
  }

  static register(options: ContentBrowserModuleOptions = {}): DynamicModule {
    const built = ContentBrowserModule.buildProviders(options);

    return {
      module: ContentBrowserModule,
      controllers: built.controllers,
      providers: built.providers,
      exports: [ContentBrowserService],
    };
  }

  private static buildProviders(options: ContentBrowserModuleOptions, standalone = false) {
    const providers: any[] = [
      { provide: CONTENT_BROWSER_DEFAULTS, useValue: options.defaults ?? {} },
      ContentBrowserService,
    ];

    const controllers: Type[] = [];
    if (options.prefix) {
      controllers.push(createContentController(options.prefix, options.guards ?? []));
      if (standalone) {
        providers.push({
          provide: APP_INTERCEPTOR,
          useClass: BrowserRenderingInterceptor,
        });
        providers.push({ provide: APP_FILTER, useClass: BrowserRenderingExceptionFilter });
        providers.push({
          provide: APP_PIPE,
          useValue: new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: false,
            skipUndefinedProperties: false,
            transformOptions: {
              enableImplicitConversion: true,
              exposeDefaultValues: true,
            },
          }),
        });
      }
    }

    return { providers, controllers };
  }
}
