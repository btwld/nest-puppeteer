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
  StreamableFile,
  type Type,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ApiOperation, ApiProduces, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { LaunchOptions } from "puppeteer";
import type { ScreenshotDto } from "../dto/index.js";
import type {
  ScreenshotImageOptions,
  ScreenshotOptions,
} from "../interfaces/screenshot-options.interface.js";
import { PuppeteerModule } from "../puppeteer.module.js";
import { PuppeteerService } from "../puppeteer.service.js";
import { BrowserRenderingExceptionFilter } from "../puppeteer-exception.filter.js";
import { BrowserRenderingInterceptor } from "../puppeteer-response.interceptor.js";
import { mergeWithDefaults } from "../utils/merge-defaults.js";

const SCREENSHOT_BROWSER_DEFAULTS = "ScreenshotBrowserDefaults";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface ScreenshotBrowserModuleOptions {
  /** Default screenshot options (merged with per-call options) */
  defaults?: ScreenshotImageOptions;
  /** REST endpoint path. Omit to disable REST. */
  prefix?: string;
  /** Guards for the REST endpoint */
  guards?: (Type<CanActivate> | CanActivate)[];
}

export interface ScreenshotBrowserForRootOptions extends ScreenshotBrowserModuleOptions {
  launchOptions?: LaunchOptions;
  isGlobal?: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class ScreenshotBrowserService {
  constructor(
    @Inject(PuppeteerService)
    private readonly puppeteerService: PuppeteerService,
    @Inject(SCREENSHOT_BROWSER_DEFAULTS)
    private readonly defaults: ScreenshotImageOptions,
  ) {}

  getDefaultType(): string | undefined {
    return this.defaults.type;
  }

  /** Capture a screenshot. Merges module defaults with per-call options. */
  async capture(options: ScreenshotOptions): Promise<Buffer> {
    return this.puppeteerService.screenshot(mergeWithDefaults(this.defaults, options));
  }
}

// ---------------------------------------------------------------------------
// Controller factory
// ---------------------------------------------------------------------------

function createScreenshotController(prefix: string, guards: any[]): Type {
  @Controller(prefix)
  @UseGuards(...guards)
  @ApiTags("browser-rendering")
  class ScreenshotBrowserController {
    constructor(
      @Inject(ScreenshotBrowserService)
      private readonly screenshotService: ScreenshotBrowserService,
    ) {}

    @Post()
    @HttpCode(200)
    @ApiOperation({ summary: "Capture a screenshot" })
    @ApiProduces("image/jpeg", "image/png", "image/webp")
    @ApiResponse({ status: 200, description: "Screenshot binary" })
    async capture(@Body() body: ScreenshotDto): Promise<StreamableFile> {
      const buffer = await this.screenshotService.capture(body);
      const type = body.type ?? this.screenshotService.getDefaultType() ?? "jpeg";
      return new StreamableFile(buffer, {
        type: `image/${type}`,
        disposition: `inline; filename="screenshot.${type}"`,
      });
    }
  }
  return ScreenshotBrowserController;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({})
export class ScreenshotBrowserModule {
  static forRoot(options: ScreenshotBrowserForRootOptions = {}): DynamicModule {
    const { launchOptions, isGlobal, ...registerOptions } = options;
    const built = ScreenshotBrowserModule.buildProviders(registerOptions, true);

    return {
      module: ScreenshotBrowserModule,
      global: isGlobal,
      imports: [PuppeteerModule.forRoot(launchOptions)],
      controllers: built.controllers,
      providers: built.providers,
      exports: [ScreenshotBrowserService],
    };
  }

  static register(options: ScreenshotBrowserModuleOptions = {}): DynamicModule {
    const built = ScreenshotBrowserModule.buildProviders(options);

    return {
      module: ScreenshotBrowserModule,
      controllers: built.controllers,
      providers: built.providers,
      exports: [ScreenshotBrowserService],
    };
  }

  private static buildProviders(options: ScreenshotBrowserModuleOptions, standalone = false) {
    const providers: any[] = [
      {
        provide: SCREENSHOT_BROWSER_DEFAULTS,
        useValue: options.defaults ?? {},
      },
      ScreenshotBrowserService,
    ];

    const controllers: Type[] = [];

    if (options.prefix) {
      controllers.push(createScreenshotController(options.prefix, options.guards ?? []));
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
