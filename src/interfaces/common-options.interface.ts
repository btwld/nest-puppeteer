import type { PuppeteerLifeCycleEvent } from "puppeteer";

export type ResourceType =
  | "document"
  | "stylesheet"
  | "image"
  | "media"
  | "font"
  | "script"
  | "texttrack"
  | "xhr"
  | "fetch"
  | "prefetch"
  | "eventsource"
  | "websocket"
  | "manifest"
  | "signedexchange"
  | "ping"
  | "cspviolationreport"
  | "preflight"
  | "other";

export interface GotoOptions {
  waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
  timeout?: number;
  referer?: string;
  referrerPolicy?: string;
}

export interface WaitForSelectorOptions {
  selector: string;
  visible?: boolean;
  hidden?: boolean;
  timeout?: number;
}

export interface AuthenticateOptions {
  username: string;
  password: string;
}

export interface CookieParam {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  expires?: number;
  url?: string;
}

export interface ViewportOptions {
  width?: number;
  height?: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  isLandscape?: boolean;
  hasTouch?: boolean;
}

export interface ScriptTagOptions {
  url?: string;
  content?: string;
  type?: string;
  id?: string;
}

export interface StyleTagOptions {
  url?: string;
  content?: string;
}

export interface CommonBrowserOptions {
  /** URL to navigate to (mutually exclusive with html) */
  url?: string;

  /** HTML content to render directly (mutually exclusive with url) */
  html?: string;

  /** HTTP Basic Auth credentials */
  authenticate?: AuthenticateOptions;

  /** Cookies to set before navigation */
  cookies?: CookieParam[];

  /** Navigation options */
  gotoOptions?: GotoOptions;

  /** Extra HTTP headers to send with every request */
  setExtraHTTPHeaders?: Record<string, string>;

  /** Resource types to reject */
  rejectResourceTypes?: ResourceType[];

  /** Request URL patterns (regex) to reject */
  rejectRequestPattern?: string[];

  /** Resource types to allow (rejects all others) */
  allowResourceTypes?: ResourceType[];

  /** Request URL patterns (regex) to allow */
  allowRequestPattern?: string[];

  /** Custom user agent string */
  userAgent?: string;

  /** Wait for a specific selector after navigation */
  waitForSelector?: WaitForSelectorOptions;

  /** Wait for all fonts to finish loading after navigation */
  waitForFonts?: boolean;

  /** Static delay (ms) after navigation */
  waitForTimeout?: number;

  /** Custom viewport dimensions for this request */
  viewport?: ViewportOptions;

  /** Inject script tags before capturing */
  addScriptTag?: ScriptTagOptions[];

  /** Inject style tags before capturing */
  addStyleTag?: StyleTagOptions[];

  /** Enable or disable JavaScript */
  setJavaScriptEnabled?: boolean;

  /** CSS media type emulation (e.g. 'screen', 'print') */
  emulateMediaType?: string;
}
