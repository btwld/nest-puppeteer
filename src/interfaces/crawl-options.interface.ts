import type { CommonBrowserOptions } from "./common-options.interface.js";
import type { CustomAiConfig, JsonResponseFormat } from "./json-options.interface.js";

export type CrawlFormat = "html" | "markdown" | "json";
export type CrawlSource = "all" | "sitemaps" | "links";
export type CrawlPurpose = "search" | "ai-input" | "ai-train";

export type CrawlJobStatus =
  | "running"
  | "completed"
  | "errored"
  | "cancelled_due_to_timeout"
  | "cancelled_due_to_limits"
  | "cancelled_by_user";

export type CrawlRecordStatus =
  | "queued"
  | "completed"
  | "disallowed"
  | "skipped"
  | "errored"
  | "cancelled";

export interface CrawlJsonOptions {
  prompt?: string;
  response_format?: JsonResponseFormat;
  custom_ai?: CustomAiConfig[];
}

export interface CrawlFilterOptions {
  /** Follow links to external domains */
  includeExternalLinks?: boolean;
  /** Follow links to subdomains */
  includeSubdomains?: boolean;
  /** Wildcard patterns to include (* = any except /, ** = any) */
  includePatterns?: string[];
  /** Wildcard patterns to exclude (overrides includePatterns) */
  excludePatterns?: string[];
}

export interface CrawlOptions extends Omit<CommonBrowserOptions, "html"> {
  /** Starting URL (required) */
  url: string;
  /** Max pages to crawl (default: 10, max: 100000) */
  limit?: number;
  /** Max link depth from start URL (default: 100000) */
  depth?: number;
  /** URL discovery method */
  source?: CrawlSource;
  /** Output formats */
  formats?: CrawlFormat[];
  /** Execute JavaScript on each page (default: true) */
  render?: boolean;
  /** Cache duration in seconds (default: 86400, max: 604800) */
  maxAge?: number;
  /** Only crawl pages modified after this Unix timestamp */
  modifiedSince?: number;
  /** Content usage declaration */
  crawlPurposes?: CrawlPurpose[];
  /** URL filtering options */
  options?: CrawlFilterOptions;
  /** AI extraction options (required if formats includes "json") */
  jsonOptions?: CrawlJsonOptions;
}

export interface CrawlRecordMetadata {
  status: number;
  title?: string;
  url: string;
}

export interface CrawlRecord {
  url: string;
  status: CrawlRecordStatus;
  markdown?: string;
  html?: string;
  json?: unknown;
  metadata?: CrawlRecordMetadata;
}

export interface CrawlJobResult {
  id: string;
  status: CrawlJobStatus;
  browserSecondsUsed?: number;
  total?: number;
  finished?: number;
  records?: CrawlRecord[];
  cursor?: number;
}
