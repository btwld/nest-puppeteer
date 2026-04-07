import type { InjectionToken, ModuleMetadata, Type } from "@nestjs/common";

import type {
  PuppeteerModuleOptions,
  PuppeteerRestOptions,
} from "./puppeteer-module-options.interface.js";
import type { PuppeteerOptionsFactory } from "./puppeteer-options-factory.interface.js";

export interface PuppeteerModuleAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  instanceName?: string;
  isGlobal?: boolean;

  /**
   * REST API configuration. Known at registration time (not async-resolved).
   * Omit to disable REST endpoints.
   */
  rest?: PuppeteerRestOptions;

  useExisting?: Type<PuppeteerOptionsFactory>;
  useClass?: Type<PuppeteerOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<PuppeteerModuleOptions> | PuppeteerModuleOptions;
  inject?: InjectionToken[];
}
