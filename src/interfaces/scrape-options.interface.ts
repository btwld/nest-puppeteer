import type { CommonBrowserOptions } from "./common-options.interface.js";

/**
 * Options for the scrape endpoint.
 * Uses `selectors` (string array) to match Cloudflare Browser Rendering API.
 */
export interface ScrapeOptions extends CommonBrowserOptions {
  /** Array of CSS selectors to scrape (required) */
  selectors: string[];
}

export interface ScrapedElement {
  text: string;
  html: string;
  attributes: Array<{ name: string; value: string }>;
  width: number;
  height: number;
  top: number;
  left: number;
}

export interface ScrapeResult {
  selector: string;
  elements: ScrapedElement[];
}
