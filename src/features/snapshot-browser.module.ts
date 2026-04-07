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
import type { SnapshotDto } from "../dto/index.js";
import type { ScreenshotImageOptions } from "../interfaces/screenshot-options.interface.js";
import type { SnapshotOptions, SnapshotResult } from "../interfaces/snapshot-options.interface.js";
import { PuppeteerModule } from "../puppeteer.module.js";
import { PuppeteerService } from "../puppeteer.service.js";
import { BrowserRenderingExceptionFilter } from "../puppeteer-exception.filter.js";
import { BrowserRenderingInterceptor } from "../puppeteer-response.interceptor.js";
import { mergeWithDefaults } from "../utils/merge-defaults.js";

const SNAPSHOT_BROWSER_DEFAULTS = "SnapshotBrowserDefaults";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface SnapshotBrowserModuleOptions {
  /** Default screenshot options for the snapshot */
  defaults?: ScreenshotImageOptions;
  prefix?: string;
  guards?: (Type<CanActivate> | CanActivate)[];
}

export interface SnapshotBrowserForRootOptions extends SnapshotBrowserModuleOptions {
  launchOptions?: LaunchOptions;
  isGlobal?: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class SnapshotBrowserService {
  constructor(
    @Inject(PuppeteerService)
    private readonly puppeteerService: PuppeteerService,
    @Inject(SNAPSHOT_BROWSER_DEFAULTS)
    private readonly defaults: ScreenshotImageOptions,
  ) {}

  /** Capture both HTML and screenshot in one page load. Merges module defaults. */
  async take(options: SnapshotOptions): Promise<SnapshotResult> {
    return this.puppeteerService.snapshot(mergeWithDefaults(this.defaults, options));
  }
}

// ---------------------------------------------------------------------------
// Controller factory
// ---------------------------------------------------------------------------

function createSnapshotController(prefix: string, guards: any[]): Type {
  @Controller(prefix)
  @UseGuards(...guards)
  @ApiTags("browser-rendering")
  class SnapshotBrowserController {
    constructor(
      @Inject(SnapshotBrowserService)
      private readonly snapshotService: SnapshotBrowserService,
    ) {}

    @Post()
    @HttpCode(200)
    @ApiOperation({ summary: "Capture HTML and screenshot in one request" })
    @ApiResponse({ status: 200, description: "HTML + base64 screenshot" })
    async take(@Body() body: SnapshotDto) {
      const result = await this.snapshotService.take(body);
      return {
        html: result.html,
        screenshot: result.screenshot.toString("base64"),
      };
    }
  }
  return SnapshotBrowserController;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({})
export class SnapshotBrowserModule {
  static forRoot(options: SnapshotBrowserForRootOptions = {}): DynamicModule {
    const { launchOptions, isGlobal, ...registerOptions } = options;
    const built = SnapshotBrowserModule.buildProviders(registerOptions, true);

    return {
      module: SnapshotBrowserModule,
      global: isGlobal,
      imports: [PuppeteerModule.forRoot(launchOptions)],
      controllers: built.controllers,
      providers: built.providers,
      exports: [SnapshotBrowserService],
    };
  }

  static register(options: SnapshotBrowserModuleOptions = {}): DynamicModule {
    const built = SnapshotBrowserModule.buildProviders(options);

    return {
      module: SnapshotBrowserModule,
      controllers: built.controllers,
      providers: built.providers,
      exports: [SnapshotBrowserService],
    };
  }

  private static buildProviders(options: SnapshotBrowserModuleOptions, standalone = false) {
    const providers: any[] = [
      {
        provide: SNAPSHOT_BROWSER_DEFAULTS,
        useValue: options.defaults ?? {},
      },
      SnapshotBrowserService,
    ];

    const controllers: Type[] = [];
    if (options.prefix) {
      controllers.push(createSnapshotController(options.prefix, options.guards ?? []));
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
