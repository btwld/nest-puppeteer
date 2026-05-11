import type { LaunchOptions } from "puppeteer";

import type { PuppeteerFeature } from "./interfaces/puppeteer-module-options.interface.js";

export const PUPPETEER_INSTANCE_NAME = "PuppeteerInstanceName";
export const PUPPETEER_MODULE_OPTIONS = "PuppeteerModuleOptions";
export const PUPPETEER_REST_OPTIONS = "PuppeteerRestOptions";
export const PUPPETEER_DEFAULT_AI = "PuppeteerDefaultAi";
export const PUPPETEER_FONT_CONFIG = "PuppeteerFontConfig";
export const FEATURE_KEY = "puppeteer:feature";

export const ALL_FEATURES: PuppeteerFeature[] = [
  "content",
  "screenshot",
  "pdf",
  "markdown",
  "snapshot",
  "scrape",
  "links",
  "json",
  "crawl",
];

export const DEFAULT_PUPPETEER_INSTANCE_NAME = "DefaultPuppeteer";

const args: string[] = [
  "--allow-insecure-localhost",
  "--allow-http-screen-capture",
  "--no-zygote",
  "--disable-blink-features=AutomationControlled",
];

if (typeof process.getuid === "function") {
  args.push("--no-sandbox");
}

export const DEFAULT_CHROME_LAUNCH_OPTIONS: LaunchOptions = {
  headless: true,
  pipe: process.platform !== "win32",
  args,
};
