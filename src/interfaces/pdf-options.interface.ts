import type { CommonBrowserOptions } from "./common-options.interface.js";

export type PaperFormat =
  | "letter"
  | "legal"
  | "tabloid"
  | "ledger"
  | "a0"
  | "a1"
  | "a2"
  | "a3"
  | "a4"
  | "a5"
  | "a6";

export interface PdfMargin {
  top?: string | number;
  bottom?: string | number;
  left?: string | number;
  right?: string | number;
}

/** PDF-specific generation options (also used as defaults type for PdfBrowserModule) */
export interface PdfGenerationOptions {
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
  margin?: PdfMargin;
  pageRanges?: string;
  preferCSSPageSize?: boolean;
  scale?: number;
  format?: PaperFormat;
  landscape?: boolean;
  width?: string | number;
  height?: string | number;
  omitBackground?: boolean;
  tagged?: boolean;
  timeout?: number;
}

/**
 * Options for the PDF endpoint.
 * PDF fields are top-level to match Cloudflare Browser Rendering API.
 */
export interface PdfOptions extends CommonBrowserOptions, PdfGenerationOptions {}
