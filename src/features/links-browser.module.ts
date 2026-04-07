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
import type { LinksDto } from "../dto/index.js";
import type { CommonBrowserOptions } from "../interfaces/common-options.interface.js";
import type { LinksOptions } from "../interfaces/links-options.interface.js";
import { PuppeteerModule } from "../puppeteer.module.js";
import { PuppeteerService } from "../puppeteer.service.js";
import { BrowserRenderingExceptionFilter } from "../puppeteer-exception.filter.js";
import { BrowserRenderingInterceptor, ResultKey } from "../puppeteer-response.interceptor.js";
import { mergeWithDefaults } from "../utils/merge-defaults.js";

const LINKS_BROWSER_DEFAULTS = "LinksBrowserDefaults";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export type LinksBrowserDefaults = Pick<
  CommonBrowserOptions,
  "gotoOptions" | "waitForSelector" | "userAgent" | "viewport" | "setJavaScriptEnabled"
> & {
  visibleLinksOnly?: boolean;
};

export interface LinksBrowserModuleOptions {
  defaults?: LinksBrowserDefaults;
  prefix?: string;
  guards?: (Type<CanActivate> | CanActivate)[];
}

export interface LinksBrowserForRootOptions extends LinksBrowserModuleOptions {
  launchOptions?: LaunchOptions;
  isGlobal?: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class LinksBrowserService {
  constructor(
    @Inject(PuppeteerService)
    private readonly puppeteerService: PuppeteerService,
    @Inject(LINKS_BROWSER_DEFAULTS)
    private readonly defaults: LinksBrowserDefaults,
  ) {}

  /** Extract links from a page. Merges module defaults. */
  async extract(options: LinksOptions): Promise<string[]> {
    return this.puppeteerService.links(mergeWithDefaults(this.defaults, options));
  }
}

// ---------------------------------------------------------------------------
// Controller factory
// ---------------------------------------------------------------------------

function createLinksController(prefix: string, guards: any[]): Type {
  @Controller(prefix)
  @UseGuards(...guards)
  @ApiTags("browser-rendering")
  class LinksBrowserController {
    constructor(
      @Inject(LinksBrowserService)
      private readonly linksService: LinksBrowserService,
    ) {}

    @Post()
    @HttpCode(200)
    @ResultKey()
    @ApiOperation({ summary: "Extract all links from a page" })
    @ApiResponse({ status: 200, description: "Array of URLs" })
    async extract(@Body() body: LinksDto) {
      return this.linksService.extract(body);
    }
  }
  return LinksBrowserController;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({})
export class LinksBrowserModule {
  static forRoot(options: LinksBrowserForRootOptions = {}): DynamicModule {
    const { launchOptions, isGlobal, ...registerOptions } = options;
    const built = LinksBrowserModule.buildProviders(registerOptions, true);

    return {
      module: LinksBrowserModule,
      global: isGlobal,
      imports: [PuppeteerModule.forRoot(launchOptions)],
      controllers: built.controllers,
      providers: built.providers,
      exports: [LinksBrowserService],
    };
  }

  static register(options: LinksBrowserModuleOptions = {}): DynamicModule {
    const built = LinksBrowserModule.buildProviders(options);

    return {
      module: LinksBrowserModule,
      controllers: built.controllers,
      providers: built.providers,
      exports: [LinksBrowserService],
    };
  }

  private static buildProviders(options: LinksBrowserModuleOptions, standalone = false) {
    const providers: any[] = [
      {
        provide: LINKS_BROWSER_DEFAULTS,
        useValue: options.defaults ?? {},
      },
      LinksBrowserService,
    ];

    const controllers: Type[] = [];
    if (options.prefix) {
      controllers.push(createLinksController(options.prefix, options.guards ?? []));
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
