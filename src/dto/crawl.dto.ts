import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

import type {
  CrawlFilterOptions,
  CrawlFormat,
  CrawlJsonOptions,
  CrawlOptions,
  CrawlPurpose,
  CrawlSource,
} from "../interfaces/crawl-options.interface.js";
import { CommonBrowserDto } from "./common-browser.dto.js";

export class CrawlDto extends CommonBrowserDto implements CrawlOptions {
  @ApiProperty({ description: "Starting URL to crawl" })
  @IsString()
  declare url: string;

  @ApiPropertyOptional({
    description: "Max pages to crawl",
    default: 10,
    minimum: 1,
    maximum: 100000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100000)
  limit?: number;

  @ApiPropertyOptional({ description: "Max link depth from start URL", default: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  depth?: number;

  @ApiPropertyOptional({ enum: ["all", "sitemaps", "links"], default: "all" })
  @IsOptional()
  @IsIn(["all", "sitemaps", "links"])
  source?: CrawlSource;

  @ApiPropertyOptional({
    description: "Output formats",
    type: [String],
    enum: ["html", "markdown", "json"],
    default: ["html"],
  })
  @IsOptional()
  @IsArray()
  formats?: CrawlFormat[];

  @ApiPropertyOptional({ description: "Execute JavaScript on pages", default: true })
  @IsOptional()
  @IsBoolean()
  render?: boolean;

  @ApiPropertyOptional({
    description: "Cache duration in seconds",
    default: 86400,
    maximum: 604800,
  })
  @IsOptional()
  @IsNumber()
  @Max(604800)
  maxAge?: number;

  @ApiPropertyOptional({ description: "Unix timestamp — only crawl pages modified after" })
  @IsOptional()
  @IsNumber()
  modifiedSince?: number;

  @ApiPropertyOptional({
    description: "Content usage declaration",
    type: [String],
    enum: ["search", "ai-input", "ai-train"],
  })
  @IsOptional()
  @IsArray()
  crawlPurposes?: CrawlPurpose[];

  @ApiPropertyOptional({ description: "URL filtering options", type: Object })
  @IsOptional()
  @IsObject()
  options?: CrawlFilterOptions;

  @ApiPropertyOptional({
    description: "AI extraction options (required if formats includes json)",
    type: Object,
  })
  @IsOptional()
  @IsObject()
  jsonOptions?: CrawlJsonOptions;
}
