import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsObject, IsOptional, IsString, ValidateIf } from "class-validator";

import type {
  CustomAiConfig,
  JsonOptions,
  JsonResponseFormat,
} from "../interfaces/json-options.interface.js";
import { CommonBrowserDto } from "./common-browser.dto.js";

export class JsonDto extends CommonBrowserDto implements JsonOptions {
  @ApiPropertyOptional({ description: "Natural language extraction instructions" })
  @ValidateIf((o) => !o.response_format)
  @IsString({ message: 'At least one of "prompt" or "response_format" must be provided' })
  prompt?: string;

  @ApiPropertyOptional({
    description: "JSON schema for structured output",
    example: {
      type: "json_schema",
      schema: { type: "object", properties: { title: { type: "string" } }, required: ["title"] },
    },
  })
  @ValidateIf((o) => !o.prompt)
  @IsObject({ message: 'At least one of "prompt" or "response_format" must be provided' })
  response_format?: JsonResponseFormat;

  @ApiPropertyOptional({
    description: "AI provider configs (tried in order, first success wins)",
    type: [Object],
    example: [{ model: "gpt-4o-mini", authorization: "Bearer sk-..." }],
  })
  @IsOptional()
  @IsArray()
  custom_ai?: CustomAiConfig[];
}
