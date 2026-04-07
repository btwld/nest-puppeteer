import { DEFAULT_PUPPETEER_INSTANCE_NAME } from "./puppeteer.constants.js";

export function getBrowserToken(instanceName: string = DEFAULT_PUPPETEER_INSTANCE_NAME): string {
  return `${instanceName}Browser`;
}

export function getContextToken(instanceName: string = DEFAULT_PUPPETEER_INSTANCE_NAME): string {
  return `${instanceName}Context`;
}

export function getPageToken(instanceName: string = DEFAULT_PUPPETEER_INSTANCE_NAME): string {
  return `${instanceName}Page`;
}
