import type { CommonBrowserOptions } from "./common-options.interface.js";

export interface CustomAiConfig {
  /** Model identifier (e.g. "gpt-4o-mini", "claude-sonnet-4-20250514") */
  model: string;
  /** API key or Bearer token */
  authorization: string;
  /** API base URL (defaults to https://api.openai.com/v1) */
  baseUrl?: string;
}

export interface JsonResponseFormat {
  type: "json_schema";
  schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface JsonOptions extends CommonBrowserOptions {
  /** Natural language extraction instructions */
  prompt?: string;

  /** JSON schema for structured output */
  response_format?: JsonResponseFormat;

  /** AI provider configuration (overrides module default) */
  custom_ai?: CustomAiConfig[];
}
