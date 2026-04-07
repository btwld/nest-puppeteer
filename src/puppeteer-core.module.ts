import {
  type DynamicModule,
  Global,
  Inject,
  Logger,
  Module,
  type OnApplicationShutdown,
  type OnModuleDestroy,
  type Provider,
  type Type,
  ValidationPipe,
} from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, ModuleRef } from "@nestjs/core";
import puppeteer, { type Browser, type BrowserContext, type LaunchOptions } from "puppeteer";

import type {
  PuppeteerModuleAsyncOptions,
  PuppeteerModuleOptions,
  PuppeteerOptionsFactory,
  PuppeteerRestOptions,
} from "./interfaces/index.js";
import {
  DEFAULT_CHROME_LAUNCH_OPTIONS,
  DEFAULT_PUPPETEER_INSTANCE_NAME,
  PUPPETEER_DEFAULT_AI,
  PUPPETEER_INSTANCE_NAME,
  PUPPETEER_MODULE_OPTIONS,
  PUPPETEER_REST_OPTIONS,
} from "./puppeteer.constants.js";
import { createPuppeteerController } from "./puppeteer.controller.js";
import { PuppeteerService } from "./puppeteer.service.js";
import { getBrowserToken, getContextToken, getPageToken } from "./puppeteer.util.js";
import { CrawlService } from "./puppeteer-crawl.service.js";
import { BrowserRenderingExceptionFilter } from "./puppeteer-exception.filter.js";
import { PuppeteerFeatureGuard } from "./puppeteer-feature.guard.js";
import { BrowserRenderingInterceptor } from "./puppeteer-response.interceptor.js";

function mergeLaunchOptions(userOptions?: LaunchOptions): LaunchOptions {
  if (!userOptions) {
    return DEFAULT_CHROME_LAUNCH_OPTIONS;
  }

  const { args: userArgs, ignoreDefaultArgs, ...restUserOptions } = userOptions;
  const defaultArgs = DEFAULT_CHROME_LAUNCH_OPTIONS.args ?? [];

  let mergedArgs: string[];
  if (ignoreDefaultArgs === true) {
    mergedArgs = userArgs ?? [];
  } else if (Array.isArray(ignoreDefaultArgs)) {
    const filteredDefaults = defaultArgs.filter((arg) => !ignoreDefaultArgs.includes(arg));
    mergedArgs = userArgs ? [...new Set([...filteredDefaults, ...userArgs])] : filteredDefaults;
  } else {
    mergedArgs = userArgs ? [...new Set([...defaultArgs, ...userArgs])] : [...defaultArgs];
  }

  return {
    ...DEFAULT_CHROME_LAUNCH_OPTIONS,
    ...restUserOptions,
    args: mergedArgs,
  };
}

function buildRestProviders(restOptions: PuppeteerRestOptions): {
  controllers: Type[];
  providers: Provider[];
} {
  const ControllerClass = createPuppeteerController(
    restOptions.prefix ?? "browser-rendering",
    restOptions.guards ?? [],
  );

  return {
    controllers: [ControllerClass],
    providers: [
      {
        provide: PUPPETEER_REST_OPTIONS,
        useValue: restOptions,
      },
      {
        provide: APP_INTERCEPTOR,
        useClass: BrowserRenderingInterceptor,
      },
      {
        provide: APP_FILTER,
        useClass: BrowserRenderingExceptionFilter,
      },
      {
        provide: APP_PIPE,
        useValue: new ValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: false,
          skipUndefinedProperties: false,
          transformOptions: {
            exposeDefaultValues: true,
            enableImplicitConversion: true,
          },
        }),
      },
      PuppeteerFeatureGuard,
      CrawlService,
    ],
  };
}

@Global()
@Module({})
export class PuppeteerCoreModule implements OnApplicationShutdown, OnModuleDestroy {
  private readonly logger = new Logger("PuppeteerModule");

  constructor(
    @Inject(PUPPETEER_INSTANCE_NAME)
    private readonly instanceName: string,
    private readonly moduleRef: ModuleRef,
  ) {}

  onApplicationShutdown() {
    return this.onModuleDestroy();
  }

  async onModuleDestroy() {
    const browser: Browser = this.moduleRef.get(getBrowserToken(this.instanceName));

    try {
      if (browser?.connected) {
        this.logger.log("Closing browser...");
        await browser.close();
      }
    } catch (error) {
      this.logger.error(
        `Failed to close browser: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static forRoot(
    launchOptions?: LaunchOptions,
    instanceName: string = DEFAULT_PUPPETEER_INSTANCE_NAME,
    restOptions?: PuppeteerRestOptions,
    defaultAi?: import("./interfaces/json-options.interface.js").CustomAiConfig,
  ): DynamicModule {
    const mergedLaunchOptions = mergeLaunchOptions(launchOptions);

    const instanceNameProvider = {
      provide: PUPPETEER_INSTANCE_NAME,
      useValue: instanceName,
    };

    const defaultAiProvider = {
      provide: PUPPETEER_DEFAULT_AI,
      useValue: defaultAi ?? null,
    };

    const browserProvider = {
      provide: getBrowserToken(instanceName),
      async useFactory() {
        return await puppeteer.launch(mergedLaunchOptions);
      },
    };

    const contextProvider = {
      provide: getContextToken(instanceName),
      async useFactory(browser: Browser) {
        return await browser.createBrowserContext();
      },
      inject: [getBrowserToken(instanceName)],
    };

    const pageProvider = {
      provide: getPageToken(instanceName),
      async useFactory(context: BrowserContext) {
        return await context.newPage();
      },
      inject: [getContextToken(instanceName)],
    };

    const rest = restOptions ? buildRestProviders(restOptions) : null;

    return {
      module: PuppeteerCoreModule,
      controllers: rest?.controllers ?? [],
      providers: [
        instanceNameProvider,
        defaultAiProvider,
        browserProvider,
        contextProvider,
        pageProvider,
        PuppeteerService,
        ...(rest?.providers ?? []),
      ],
      exports: [browserProvider, contextProvider, pageProvider, PuppeteerService],
    };
  }

  static forRootAsync(options: PuppeteerModuleAsyncOptions): DynamicModule {
    const puppeteerInstanceName = options.instanceName ?? DEFAULT_PUPPETEER_INSTANCE_NAME;

    const instanceNameProvider = {
      provide: PUPPETEER_INSTANCE_NAME,
      useValue: puppeteerInstanceName,
    };

    const defaultAiProvider = {
      provide: PUPPETEER_DEFAULT_AI,
      useFactory: (opts: PuppeteerModuleOptions) => opts.defaultAi ?? null,
      inject: [PUPPETEER_MODULE_OPTIONS],
    };

    const browserProvider = {
      provide: getBrowserToken(puppeteerInstanceName),
      async useFactory(puppeteerModuleOptions: PuppeteerModuleOptions) {
        return await puppeteer.launch(mergeLaunchOptions(puppeteerModuleOptions.launchOptions));
      },
      inject: [PUPPETEER_MODULE_OPTIONS],
    };

    const contextProvider = {
      provide: getContextToken(puppeteerInstanceName),
      async useFactory(browser: Browser) {
        return await browser.createBrowserContext();
      },
      inject: [getBrowserToken(puppeteerInstanceName)],
    };

    const pageProvider = {
      provide: getPageToken(puppeteerInstanceName),
      async useFactory(context: BrowserContext) {
        return await context.newPage();
      },
      inject: [getContextToken(puppeteerInstanceName)],
    };

    const asyncProviders = PuppeteerCoreModule.createAsyncProviders(options);
    const rest = options.rest ? buildRestProviders(options.rest) : null;

    return {
      module: PuppeteerCoreModule,
      imports: options.imports,
      controllers: rest?.controllers ?? [],
      providers: [
        ...asyncProviders,
        instanceNameProvider,
        defaultAiProvider,
        browserProvider,
        contextProvider,
        pageProvider,
        PuppeteerService,
        ...(rest?.providers ?? []),
      ],
      exports: [browserProvider, contextProvider, pageProvider, PuppeteerService],
    };
  }

  private static createAsyncProviders(options: PuppeteerModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [PuppeteerCoreModule.createAsyncOptionsProvider(options)];
    } else if (options.useClass) {
      return [
        PuppeteerCoreModule.createAsyncOptionsProvider(options),
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
      ];
    }
    return [];
  }

  private static createAsyncOptionsProvider(options: PuppeteerModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: PUPPETEER_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject ?? [],
      };
    } else if (options.useExisting) {
      return {
        provide: PUPPETEER_MODULE_OPTIONS,
        async useFactory(optionsFactory: PuppeteerOptionsFactory) {
          return optionsFactory.createPuppeteerOptions();
        },
        inject: [options.useExisting],
      };
    } else if (options.useClass) {
      return {
        provide: PUPPETEER_MODULE_OPTIONS,
        async useFactory(optionsFactory: PuppeteerOptionsFactory) {
          return optionsFactory.createPuppeteerOptions();
        },
        inject: [options.useClass as Type<PuppeteerOptionsFactory>],
      };
    }

    throw new Error("Invalid PuppeteerModule async options");
  }
}
