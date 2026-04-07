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
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiOperation, ApiProduces, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { LaunchOptions } from "puppeteer";
import { PdfDto, PdfFileDto } from "../dto/index.js";
import type { PdfGenerationOptions, PdfOptions } from "../interfaces/pdf-options.interface.js";
import { PuppeteerModule } from "../puppeteer.module.js";
import { PuppeteerService } from "../puppeteer.service.js";
import { BrowserRenderingExceptionFilter } from "../puppeteer-exception.filter.js";
import { BrowserRenderingInterceptor } from "../puppeteer-response.interceptor.js";
import { mergeWithDefaults } from "../utils/merge-defaults.js";

const PDF_BROWSER_DEFAULTS = "PdfBrowserDefaults";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface PdfBrowserModuleOptions {
  /** Default PDF generation options (merged with per-call options) */
  defaults?: PdfGenerationOptions;
  /** REST endpoint path. Omit to disable REST. */
  prefix?: string;
  /** Guards for the REST endpoint */
  guards?: (Type<CanActivate> | CanActivate)[];
}

export interface PdfBrowserForRootOptions extends PdfBrowserModuleOptions {
  /** Puppeteer launch options (only for standalone use) */
  launchOptions?: LaunchOptions;
  isGlobal?: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class PdfBrowserService {
  constructor(
    @Inject(PuppeteerService)
    private readonly puppeteerService: PuppeteerService,
    @Inject(PDF_BROWSER_DEFAULTS)
    private readonly defaults: PdfGenerationOptions,
  ) {}

  /** Generate a PDF. Merges module defaults with per-call options. */
  async generate(options: PdfOptions): Promise<Buffer> {
    return this.puppeteerService.pdf(mergeWithDefaults(this.defaults, options));
  }
}

// ---------------------------------------------------------------------------
// Controller factory
// ---------------------------------------------------------------------------

function createPdfController(prefix: string, guards: any[]): Type {
  @Controller(prefix)
  @UseGuards(...guards)
  @ApiTags("browser-rendering")
  class PdfBrowserController {
    constructor(
      @Inject(PdfBrowserService)
      private readonly pdfService: PdfBrowserService,
    ) {}

    @Post()
    @HttpCode(200)
    @ApiOperation({ summary: "Generate a PDF from URL or HTML" })
    @ApiProduces("application/pdf")
    @ApiResponse({ status: 200, description: "PDF binary" })
    async generate(@Body() body: PdfDto): Promise<StreamableFile> {
      const buffer = await this.pdfService.generate(body);
      return new StreamableFile(buffer, {
        type: "application/pdf",
        disposition: 'inline; filename="document.pdf"',
      });
    }

    @Post("file")
    @HttpCode(200)
    @UseInterceptors(FileInterceptor("file"))
    @ApiOperation({ summary: "Generate a PDF from an uploaded HTML file" })
    @ApiConsumes("multipart/form-data")
    @ApiProduces("application/pdf")
    @ApiResponse({ status: 200, description: "PDF binary" })
    async generateFromFile(
      @UploadedFile() file: Express.Multer.File,
      @Body() body: PdfFileDto,
    ): Promise<StreamableFile> {
      const html = file.buffer.toString("utf-8");
      const buffer = await this.pdfService.generate({ ...body, html });
      return new StreamableFile(buffer, {
        type: "application/pdf",
        disposition: 'inline; filename="document.pdf"',
      });
    }
  }
  return PdfBrowserController;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({})
export class PdfBrowserModule {
  /**
   * Standalone registration — imports PuppeteerModule internally.
   *
   * @example
   * PdfBrowserModule.forRoot({
   *   launchOptions: { headless: true },
   *   defaults: { format: 'a4', printBackground: true },
   *   prefix: 'api/pdf',
   *   guards: [AuthGuard],
   * })
   */
  static forRoot(options: PdfBrowserForRootOptions = {}): DynamicModule {
    const { launchOptions, isGlobal, ...registerOptions } = options;
    const built = PdfBrowserModule.buildProviders(registerOptions, true);

    return {
      module: PdfBrowserModule,
      global: isGlobal,
      imports: [PuppeteerModule.forRoot(launchOptions)],
      controllers: built.controllers,
      providers: built.providers,
      exports: [PdfBrowserService],
    };
  }

  /**
   * Feature registration — requires PuppeteerModule to be already imported.
   *
   * @example
   * PdfBrowserModule.register({
   *   defaults: { format: 'a4', printBackground: true },
   *   prefix: 'api/pdf',
   *   guards: [AuthGuard],
   * })
   */
  static register(options: PdfBrowserModuleOptions = {}): DynamicModule {
    const built = PdfBrowserModule.buildProviders(options);

    return {
      module: PdfBrowserModule,
      controllers: built.controllers,
      providers: built.providers,
      exports: [PdfBrowserService],
    };
  }

  private static buildProviders(options: PdfBrowserModuleOptions, standalone = false) {
    const providers: any[] = [
      {
        provide: PDF_BROWSER_DEFAULTS,
        useValue: options.defaults ?? {},
      },
      PdfBrowserService,
    ];

    const controllers: Type[] = [];

    if (options.prefix) {
      const ControllerClass = createPdfController(options.prefix, options.guards ?? []);
      controllers.push(ControllerClass);
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
