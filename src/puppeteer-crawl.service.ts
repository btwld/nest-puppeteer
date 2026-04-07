import { randomUUID } from "node:crypto";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";

import type {
  CrawlJobResult,
  CrawlJobStatus,
  CrawlOptions,
  CrawlRecord,
  CrawlRecordStatus,
} from "./interfaces/crawl-options.interface.js";
import { PuppeteerService } from "./puppeteer.service.js";

interface CrawlJob {
  id: string;
  status: CrawlJobStatus;
  options: CrawlOptions;
  records: CrawlRecord[];
  visited: Set<string>;
  queue: Array<{ url: string; depth: number }>;
  browserSecondsUsed: number;
  startedAt: number;
  abortController: AbortController;
}

@Injectable()
export class CrawlService {
  private readonly logger = new Logger(CrawlService.name);
  private readonly jobs = new Map<string, CrawlJob>();

  constructor(private readonly puppeteerService: PuppeteerService) {}

  /**
   * Start an async crawl job. Returns the job ID immediately.
   */
  async startCrawl(options: CrawlOptions): Promise<string> {
    const id = randomUUID();
    const job: CrawlJob = {
      id,
      status: "running",
      options,
      records: [],
      visited: new Set(),
      queue: [{ url: options.url, depth: 0 }],
      browserSecondsUsed: 0,
      startedAt: Date.now(),
      abortController: new AbortController(),
    };

    this.jobs.set(id, job);

    // Start crawling in the background
    this.runCrawl(job).catch((err) => {
      this.logger.error(`Crawl ${id} failed: ${err.message}`, err.stack);
      job.status = "errored";
    });

    return id;
  }

  /**
   * Get crawl job status and results.
   */
  getCrawlStatus(
    jobId: string,
    cursor: number = 0,
    limit: number = 100,
    statusFilter?: CrawlRecordStatus,
  ): CrawlJobResult {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException(`Crawl job ${jobId} not found`);
    }

    let records = job.records;
    if (statusFilter) {
      records = records.filter((r) => r.status === statusFilter);
    }

    const sliced = records.slice(cursor, cursor + limit);
    const hasMore = cursor + limit < records.length;

    return {
      id: job.id,
      status: job.status,
      browserSecondsUsed: job.browserSecondsUsed,
      total: job.visited.size + job.queue.length,
      finished: job.records.filter((r) => r.status !== "queued" && r.status !== "cancelled").length,
      records: sliced,
      cursor: hasMore ? cursor + limit : undefined,
    };
  }

  /**
   * Cancel a running crawl job.
   */
  cancelCrawl(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException(`Crawl job ${jobId} not found`);
    }

    job.abortController.abort();
    job.status = "cancelled_by_user";

    // Mark queued records as cancelled
    for (const record of job.records) {
      if (record.status === "queued") {
        record.status = "cancelled";
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async runCrawl(job: CrawlJob): Promise<void> {
    const { options } = job;
    const limit = Math.min(options.limit ?? 10, 100000);
    const maxDepth = options.depth ?? 100000;
    const formats = options.formats ?? ["html"];

    while (job.queue.length > 0 && job.visited.size < limit) {
      if (job.abortController.signal.aborted) return;

      const item = job.queue.shift()!;
      if (job.visited.has(item.url) || item.depth > maxDepth) continue;
      job.visited.add(item.url);

      const record: CrawlRecord = {
        url: item.url,
        status: "queued",
      };
      job.records.push(record);

      try {
        if (this.shouldSkip(item.url, options)) {
          record.status = "skipped";
          continue;
        }

        const startMs = Date.now();
        const result = await this.crawlPage(item.url, formats, options);
        job.browserSecondsUsed += (Date.now() - startMs) / 1000;

        record.status = "completed";
        record.metadata = result.metadata;
        if (formats.includes("html")) record.html = result.html;
        if (formats.includes("markdown")) record.markdown = result.markdown;
        if (formats.includes("json")) record.json = result.json;

        // Discover new links
        if (item.depth < maxDepth && job.visited.size < limit) {
          for (const link of result.links) {
            if (!job.visited.has(link) && this.isAllowed(link, item.url, options)) {
              job.queue.push({ url: link, depth: item.depth + 1 });
            }
          }
        }
      } catch (err) {
        record.status = "errored";
        record.metadata = {
          status: 0,
          url: item.url,
          title: err instanceof Error ? err.message : "Unknown error",
        };
      }
    }

    if (job.status === "running") {
      job.status = "completed";
    }
  }

  private async crawlPage(
    url: string,
    formats: string[],
    options: CrawlOptions,
  ): Promise<{
    html?: string;
    markdown?: string;
    json?: unknown;
    metadata: { status: number; title?: string; url: string };
    links: string[];
  }> {
    const commonOpts = {
      url,
      gotoOptions: options.gotoOptions,
      authenticate: options.authenticate,
      cookies: options.cookies,
      setExtraHTTPHeaders: options.setExtraHTTPHeaders,
      userAgent: options.userAgent,
      rejectResourceTypes: options.rejectResourceTypes,
      rejectRequestPattern: options.rejectRequestPattern,
      waitForSelector: options.waitForSelector,
    };

    // Use snapshot to get HTML + extract links in one page load
    const html = await this.puppeteerService.content(commonOpts);
    const links = await this.puppeteerService.links(commonOpts);

    let markdown: string | undefined;
    if (formats.includes("markdown")) {
      markdown = await this.puppeteerService.markdown(commonOpts);
    }

    let json: unknown;
    if (formats.includes("json") && options.jsonOptions) {
      json = await this.puppeteerService.json({
        ...commonOpts,
        prompt: options.jsonOptions.prompt,
        response_format: options.jsonOptions.response_format,
        custom_ai: options.jsonOptions.custom_ai,
      });
    }

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);

    return {
      html: formats.includes("html") ? html : undefined,
      markdown,
      json,
      metadata: {
        status: 200,
        title: titleMatch?.[1]?.trim(),
        url,
      },
      links,
    };
  }

  private shouldSkip(url: string, options: CrawlOptions): boolean {
    const filters = options.options;
    if (!filters) return false;

    if (filters.excludePatterns?.length) {
      for (const pattern of filters.excludePatterns) {
        if (this.wildcardMatch(url, pattern)) return true;
      }
    }

    if (filters.includePatterns?.length) {
      const matches = filters.includePatterns.some((p) => this.wildcardMatch(url, p));
      if (!matches) return true;
    }

    return false;
  }

  private isAllowed(link: string, sourceUrl: string, options: CrawlOptions): boolean {
    try {
      const linkHost = new URL(link).hostname;
      const sourceHost = new URL(sourceUrl).hostname;

      if (linkHost !== sourceHost) {
        if (options.options?.includeSubdomains && linkHost.endsWith(`.${sourceHost}`)) {
          return true;
        }
        return options.options?.includeExternalLinks ?? false;
      }

      return !this.shouldSkip(link, options);
    } catch {
      return false;
    }
  }

  private wildcardMatch(url: string, pattern: string): boolean {
    const regex = pattern
      .replace(/\*\*/g, "{{GLOBSTAR}}")
      .replace(/\*/g, "[^/]*")
      .replace(/\{\{GLOBSTAR\}\}/g, ".*");
    return new RegExp(`^${regex}$`).test(url);
  }
}
