import type { CommonBrowserOptions } from "./common-options.interface.js";

/** Screenshot-specific options (also used as defaults type for ScreenshotBrowserModule) */
export interface ScreenshotImageOptions {
  type?: "png" | "jpeg" | "webp";
  quality?: number;
  fullPage?: boolean;
  omitBackground?: boolean;
  encoding?: "binary" | "base64";
  captureBeyondViewport?: boolean;
  optimizeForSpeed?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Options for the screenshot endpoint.
 * Screenshot fields are top-level to match Cloudflare Browser Rendering API.
 */
export interface ScreenshotOptions extends CommonBrowserOptions, ScreenshotImageOptions {
  /** CSS selector of an element to screenshot instead of the full page */
  selector?: string;
}
