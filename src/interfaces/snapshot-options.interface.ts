import type { CommonBrowserOptions } from "./common-options.interface.js";
import type { ScreenshotImageOptions } from "./screenshot-options.interface.js";

/**
 * Options for the snapshot endpoint.
 * Screenshot fields are top-level to match Cloudflare Browser Rendering API.
 */
export interface SnapshotOptions extends CommonBrowserOptions, ScreenshotImageOptions {}

export interface SnapshotResult {
  /** Rendered HTML content */
  html: string;

  /** Screenshot binary */
  screenshot: Buffer;
}
