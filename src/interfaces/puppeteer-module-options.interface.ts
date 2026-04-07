import type { CanActivate, Type } from "@nestjs/common";
import type { LaunchOptions } from "puppeteer";

import type { CustomAiConfig } from "./json-options.interface.js";

export type PuppeteerFeature =
  | "content"
  | "screenshot"
  | "pdf"
  | "markdown"
  | "snapshot"
  | "scrape"
  | "links"
  | "json"
  | "crawl";

export interface PuppeteerRestOptions {
  /** Route prefix for REST endpoints. Default: 'browser-rendering' */
  prefix?: string;

  /**
   * Which features to expose as REST endpoints.
   * Omit or pass undefined to enable all features.
   */
  features?: PuppeteerFeature[];

  /** Guards to apply to all REST endpoints (e.g. AuthGuard) */
  guards?: (Type<CanActivate> | CanActivate)[];
}

export interface PuppeteerModuleOptions {
  launchOptions?: LaunchOptions;
  isGlobal?: boolean;

  /**
   * Default AI provider for the /json endpoint.
   * Can be overridden per-request via custom_ai.
   */
  defaultAi?: CustomAiConfig;

  /**
   * REST API endpoint configuration.
   * Omit to disable REST endpoints (service-only mode).
   */
  rest?: PuppeteerRestOptions;
}
