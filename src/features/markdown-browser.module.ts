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
import type { MarkdownDto } from "../dto/index.js";
import type { CommonBrowserOptions } from "../interfaces/common-options.interface.js";
import type { MarkdownOptions } from "../interfaces/markdown-options.interface.js";
import { PuppeteerModule } from "../puppeteer.module.js";
import { PuppeteerService } from "../puppeteer.service.js";
import { BrowserRenderingExceptionFilter } from "../puppeteer-exception.filter.js";
import { BrowserRenderingInterceptor, ResultKey } from "../puppeteer-response.interceptor.js";
import { mergeWithDefaults } from "../utils/merge-defaults.js";

const MARKDOWN_BROWSER_DEFAULTS = "MarkdownBrowserDefaults";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export type MarkdownBrowserDefaults = Pick<
  CommonBrowserOptions,
  "gotoOptions" | "waitForSelector" | "userAgent" | "viewport" | "setJavaScriptEnabled"
>;

export interface MarkdownBrowserModuleOptions {
  defaults?: MarkdownBrowserDefaults;
  prefix?: string;
  guards?: (Type<CanActivate> | CanActivate)[];
}

export interface MarkdownBrowserForRootOptions extends MarkdownBrowserModuleOptions {
  launchOptions?: LaunchOptions;
  isGlobal?: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class MarkdownBrowserService {
  constructor(
    @Inject(PuppeteerService)
    private readonly puppeteerService: PuppeteerService,
    @Inject(MARKDOWN_BROWSER_DEFAULTS)
    private readonly defaults: MarkdownBrowserDefaults,
  ) {}

  /** Extract page content as Markdown. Merges module defaults. */
  async extract(options: MarkdownOptions): Promise<string> {
    return this.puppeteerService.markdown(mergeWithDefaults(this.defaults, options));
  }
}

// ---------------------------------------------------------------------------
// Controller factory
// ---------------------------------------------------------------------------

function createMarkdownController(prefix: string, guards: any[]): Type {
  @Controller(prefix)
  @UseGuards(...guards)
  @ApiTags("browser-rendering")
  class MarkdownBrowserController {
    constructor(
      @Inject(MarkdownBrowserService)
      private readonly markdownService: MarkdownBrowserService,
    ) {}

    @Post()
    @HttpCode(200)
    @ResultKey("markdown")
    @ApiOperation({ summary: "Extract page content as Markdown" })
    @ApiResponse({ status: 200, description: "Markdown content" })
    async extract(@Body() body: MarkdownDto) {
      return this.markdownService.extract(body);
    }
  }
  return MarkdownBrowserController;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({})
export class MarkdownBrowserModule {
  static forRoot(options: MarkdownBrowserForRootOptions = {}): DynamicModule {
    const { launchOptions, isGlobal, ...registerOptions } = options;
    const built = MarkdownBrowserModule.buildProviders(registerOptions, true);

    return {
      module: MarkdownBrowserModule,
      global: isGlobal,
      imports: [PuppeteerModule.forRoot(launchOptions)],
      controllers: built.controllers,
      providers: built.providers,
      exports: [MarkdownBrowserService],
    };
  }

  static register(options: MarkdownBrowserModuleOptions = {}): DynamicModule {
    const built = MarkdownBrowserModule.buildProviders(options);

    return {
      module: MarkdownBrowserModule,
      controllers: built.controllers,
      providers: built.providers,
      exports: [MarkdownBrowserService],
    };
  }

  private static buildProviders(options: MarkdownBrowserModuleOptions, standalone = false) {
    const providers: any[] = [
      {
        provide: MARKDOWN_BROWSER_DEFAULTS,
        useValue: options.defaults ?? {},
      },
      MarkdownBrowserService,
    ];

    const controllers: Type[] = [];
    if (options.prefix) {
      controllers.push(createMarkdownController(options.prefix, options.guards ?? []));
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
