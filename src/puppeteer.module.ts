import { type DynamicModule, Module } from "@nestjs/common";
import type { LaunchOptions } from "puppeteer";

import type {
  CustomAiConfig,
  PuppeteerModuleAsyncOptions,
  PuppeteerRestOptions,
} from "./interfaces/index.js";
import { createPuppeteerProviders } from "./puppeteer.providers.js";
import { PuppeteerCoreModule } from "./puppeteer-core.module.js";

@Module({})
export class PuppeteerModule {
  /**
   * Register the Puppeteer module synchronously.
   *
   * @example
   * // Service-only (no REST endpoints)
   * PuppeteerModule.forRoot()
   *
   * @example
   * // With REST endpoints for specific features
   * PuppeteerModule.forRoot({
   *   headless: true,
   *   rest: {
   *     prefix: 'browser-rendering',
   *     features: ['pdf', 'screenshot', 'scrape'],
   *     guards: [AuthGuard],
   *   },
   * })
   */
  static forRoot(
    options?: LaunchOptions & {
      isGlobal?: boolean;
      rest?: PuppeteerRestOptions;
      defaultAi?: CustomAiConfig;
      fontsDir?: string;
      fontAliases?: Record<string, string | string[]>;
      fontAliasResolver?: (family: string) => string | string[] | undefined;
    },
    instanceName?: string,
  ): DynamicModule {
    const {
      isGlobal,
      rest,
      defaultAi,
      fontsDir,
      fontAliases,
      fontAliasResolver,
      ...launchOptions
    } = options ?? {};
    const effectiveLaunchOptions =
      Object.keys(launchOptions).length > 0 ? launchOptions : undefined;

    return {
      module: PuppeteerModule,
      global: isGlobal,
      imports: [
        PuppeteerCoreModule.forRoot(
          effectiveLaunchOptions,
          instanceName,
          rest,
          defaultAi,
          fontsDir,
          fontAliases,
          fontAliasResolver,
        ),
      ],
    };
  }

  /**
   * Register the Puppeteer module asynchronously.
   *
   * @example
   * PuppeteerModule.forRootAsync({
   *   useFactory: (config: ConfigService) => ({
   *     launchOptions: { headless: config.get('HEADLESS') },
   *   }),
   *   inject: [ConfigService],
   *   rest: {
   *     prefix: 'api/browser',
   *     features: ['pdf', 'screenshot'],
   *     guards: [AuthGuard],
   *   },
   * })
   */
  static forRootAsync(options: PuppeteerModuleAsyncOptions): DynamicModule {
    return {
      module: PuppeteerModule,
      global: options.isGlobal,
      imports: [PuppeteerCoreModule.forRootAsync(options)],
    };
  }

  /**
   * Register named pages for injection via @InjectPage().
   */
  static forFeature(pages: string[] = [], instanceName?: string): DynamicModule {
    const providers = createPuppeteerProviders(instanceName, pages);
    return {
      module: PuppeteerModule,
      providers,
      exports: providers,
    };
  }
}
