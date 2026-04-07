import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  StreamableFile,
  type Type,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import {
  BrowserRenderingErrorResponse,
  type ContentDto,
  ContentResponse,
  type CrawlDto,
  type JsonDto,
  type LinksDto,
  LinksResponse,
  type MarkdownDto,
  MarkdownResponse,
  PdfDto,
  PdfFileDto,
  type ScrapeDto,
  ScrapeResponse,
  type ScreenshotDto,
  type SnapshotDto,
  SnapshotResponse,
} from "./dto/index.js";
import type { CrawlRecordStatus } from "./interfaces/crawl-options.interface.js";
import { PuppeteerService } from "./puppeteer.service.js";
import { CrawlService } from "./puppeteer-crawl.service.js";
import { Feature, PuppeteerFeatureGuard } from "./puppeteer-feature.guard.js";
import { ResultKey } from "./puppeteer-response.interceptor.js";

export function createPuppeteerController(prefix: string, guards: any[] = []): Type {
  @ApiTags("browser-rendering")
  @ApiResponse({
    status: 400,
    description: "Validation error",
    type: BrowserRenderingErrorResponse,
  })
  @Controller(prefix)
  @UseGuards(PuppeteerFeatureGuard, ...guards)
  class PuppeteerRestController {
    constructor(
      @Inject(PuppeteerService)
      private readonly puppeteerService: PuppeteerService,
      @Inject(CrawlService)
      private readonly crawlService: CrawlService,
    ) {}

    @Post("content")
    @HttpCode(200)
    @Feature("content")
    @ResultKey("html")
    @ApiOperation({ summary: "Fetch rendered HTML content" })
    @ApiResponse({ status: 200, type: ContentResponse })
    async content(@Body() body: ContentDto) {
      return this.puppeteerService.content(body);
    }

    @Post("screenshot")
    @HttpCode(200)
    @Feature("screenshot")
    @ApiOperation({ summary: "Capture a screenshot" })
    @ApiProduces("image/jpeg", "image/png", "image/webp")
    @ApiResponse({ status: 200, description: "Screenshot binary" })
    async screenshot(@Body() body: ScreenshotDto): Promise<StreamableFile> {
      const buffer = await this.puppeteerService.screenshot(body);
      const type = body.type ?? "jpeg";
      return new StreamableFile(buffer, {
        type: `image/${type}`,
        disposition: `inline; filename="screenshot.${type}"`,
      });
    }

    @Post("pdf")
    @HttpCode(200)
    @Feature("pdf")
    @ApiOperation({ summary: "Generate a PDF from URL or HTML" })
    @ApiProduces("application/pdf")
    @ApiResponse({ status: 200, description: "PDF binary" })
    async pdf(@Body() body: PdfDto): Promise<StreamableFile> {
      const buffer = await this.puppeteerService.pdf(body);
      return new StreamableFile(buffer, {
        type: "application/pdf",
        disposition: 'inline; filename="document.pdf"',
      });
    }

    @Post("pdf/file")
    @HttpCode(200)
    @Feature("pdf")
    @UseInterceptors(FileInterceptor("file"))
    @ApiOperation({ summary: "Generate a PDF from an uploaded HTML file" })
    @ApiConsumes("multipart/form-data")
    @ApiProduces("application/pdf")
    @ApiResponse({ status: 200, description: "PDF binary" })
    async pdfFromFile(
      @UploadedFile() file: Express.Multer.File,
      @Body() body: PdfFileDto,
    ): Promise<StreamableFile> {
      const html = file.buffer.toString("utf-8");
      const buffer = await this.puppeteerService.pdf({ ...body, html });
      return new StreamableFile(buffer, {
        type: "application/pdf",
        disposition: 'inline; filename="document.pdf"',
      });
    }

    @Post("markdown")
    @HttpCode(200)
    @Feature("markdown")
    @ResultKey("markdown")
    @ApiOperation({ summary: "Extract page content as Markdown" })
    @ApiResponse({ status: 200, type: MarkdownResponse })
    async markdown(@Body() body: MarkdownDto) {
      return this.puppeteerService.markdown(body);
    }

    @Post("snapshot")
    @HttpCode(200)
    @Feature("snapshot")
    @ApiOperation({ summary: "Capture HTML and screenshot in one request" })
    @ApiResponse({ status: 200, type: SnapshotResponse })
    async snapshot(@Body() body: SnapshotDto) {
      const result = await this.puppeteerService.snapshot(body);
      return {
        html: result.html,
        screenshot: result.screenshot.toString("base64"),
      };
    }

    @Post("scrape")
    @HttpCode(200)
    @Feature("scrape")
    @ApiOperation({ summary: "Scrape elements by CSS selectors" })
    @ApiResponse({ status: 200, type: ScrapeResponse })
    async scrape(@Body() body: ScrapeDto) {
      const results = await this.puppeteerService.scrape(body);
      return { results };
    }

    @Post("links")
    @HttpCode(200)
    @Feature("links")
    @ApiOperation({ summary: "Extract all links from a page" })
    @ApiResponse({ status: 200, type: LinksResponse })
    async links(@Body() body: LinksDto) {
      return this.puppeteerService.links(body);
    }

    @Post("json")
    @HttpCode(200)
    @Feature("json")
    @ApiOperation({ summary: "Extract structured data using AI" })
    @ApiResponse({ status: 200, description: "Extracted JSON matching schema" })
    async json(@Body() body: JsonDto) {
      return this.puppeteerService.json(body);
    }

    @Post("crawl")
    @Feature("crawl")
    @ResultKey()
    @ApiOperation({ summary: "Start an async crawl job" })
    @ApiResponse({
      status: 201,
      description: "Job ID",
      schema: { properties: { success: { type: "boolean" }, result: { type: "string" } } },
    })
    async startCrawl(@Body() body: CrawlDto) {
      return this.crawlService.startCrawl(body);
    }

    @Get("crawl/:jobId")
    @Feature("crawl")
    @ApiOperation({ summary: "Get crawl job status and results" })
    @ApiParam({ name: "jobId", description: "Crawl job UUID" })
    @ApiQuery({ name: "cursor", required: false, type: Number })
    @ApiQuery({ name: "limit", required: false, type: Number })
    @ApiQuery({
      name: "status",
      required: false,
      enum: ["queued", "completed", "disallowed", "skipped", "errored", "cancelled"],
    })
    async getCrawlStatus(
      @Param("jobId") jobId: string,
      @Query("cursor") cursor?: string,
      @Query("limit") limit?: string,
      @Query("status") status?: string,
    ) {
      return this.crawlService.getCrawlStatus(
        jobId,
        cursor ? parseInt(cursor, 10) : 0,
        limit ? parseInt(limit, 10) : 100,
        status as CrawlRecordStatus | undefined,
      );
    }

    @Delete("crawl/:jobId")
    @Feature("crawl")
    @ApiOperation({ summary: "Cancel a running crawl job" })
    @ApiParam({ name: "jobId", description: "Crawl job UUID" })
    async cancelCrawl(@Param("jobId") jobId: string) {
      this.crawlService.cancelCrawl(jobId);
      return { cancelled: true };
    }
  }

  return PuppeteerRestController;
}
