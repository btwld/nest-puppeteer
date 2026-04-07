import type { CommonBrowserOptions } from "./common-options.interface.js";

export interface LinksOptions extends CommonBrowserOptions {
  /** Only return links visible in the viewport */
  visibleLinksOnly?: boolean;
}
