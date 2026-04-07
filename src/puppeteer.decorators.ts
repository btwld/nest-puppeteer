import { Inject } from "@nestjs/common";

import { getBrowserToken, getContextToken, getPageToken } from "./puppeteer.util.js";

export const InjectBrowser = (instanceName?: string): ReturnType<typeof Inject> =>
  Inject(getBrowserToken(instanceName));

export const InjectContext = (instanceName?: string): ReturnType<typeof Inject> =>
  Inject(getContextToken(instanceName));

export const InjectPage = (instanceName?: string): ReturnType<typeof Inject> =>
  Inject(getPageToken(instanceName));
