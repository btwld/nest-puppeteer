import type { PuppeteerModuleOptions } from "./puppeteer-module-options.interface.js";

export interface PuppeteerOptionsFactory {
  createPuppeteerOptions(): Promise<PuppeteerModuleOptions> | PuppeteerModuleOptions;
}
