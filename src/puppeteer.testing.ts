import type { Provider } from "@nestjs/common";
import type { Browser, BrowserContext, Page } from "puppeteer";

import { getBrowserToken, getContextToken, getPageToken } from "./puppeteer.util.js";

export interface MockPuppeteerOptions {
  /** Must match the instanceName used in forRoot/forRootAsync */
  instanceName?: string;
  /** Mock value for the Browser */
  browser?: Partial<Browser>;
  /** Mock value for the BrowserContext */
  context?: Partial<BrowserContext>;
  /** Mock value for the Page */
  page?: Partial<Page>;
}

/**
 * Creates mock providers for Puppeteer Browser, BrowserContext, and Page.
 * Use in unit tests to avoid launching a real browser.
 *
 * @example
 * ```typescript
 * const module = await Test.createTestingModule({
 *   providers: [
 *     MyService,
 *     ...createMockPuppeteerProviders({
 *       page: { goto: jest.fn(), content: jest.fn().mockResolvedValue('<html></html>') },
 *     }),
 *   ],
 * }).compile();
 * ```
 */
export function createMockPuppeteerProviders(options: MockPuppeteerOptions = {}): Provider[] {
  const { instanceName, browser = {}, context = {}, page = {} } = options;

  return [
    {
      provide: getBrowserToken(instanceName),
      useValue: browser,
    },
    {
      provide: getContextToken(instanceName),
      useValue: context,
    },
    {
      provide: getPageToken(instanceName),
      useValue: page,
    },
  ];
}
