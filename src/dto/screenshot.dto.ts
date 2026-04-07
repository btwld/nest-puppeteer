import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

import type { ScreenshotOptions } from "../interfaces/screenshot-options.interface.js";
import { CommonBrowserDto } from "./common-browser.dto.js";

export class ScreenshotDto extends CommonBrowserDto implements ScreenshotOptions {
  @ApiPropertyOptional({ enum: ["png", "jpeg", "webp"], default: "jpeg" })
  @IsOptional()
  @IsIn(["png", "jpeg", "webp"])
  type?: "png" | "jpeg" | "webp";

  @ApiPropertyOptional({
    description: "Image quality (0-100), jpeg/webp only",
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  quality?: number;

  @ApiPropertyOptional({ description: "Capture the full scrollable page" })
  @IsOptional()
  @IsBoolean()
  fullPage?: boolean;

  @ApiPropertyOptional({ description: "Hide default white background for transparent captures" })
  @IsOptional()
  @IsBoolean()
  omitBackground?: boolean;

  @ApiPropertyOptional({ enum: ["binary", "base64"] })
  @IsOptional()
  @IsIn(["binary", "base64"])
  encoding?: "binary" | "base64";

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  captureBeyondViewport?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  optimizeForSpeed?: boolean;

  @ApiPropertyOptional({ description: "Clip region { x, y, width, height }", type: Object })
  @IsOptional()
  @IsObject()
  clip?: { x: number; y: number; width: number; height: number };

  @ApiPropertyOptional({ description: "CSS selector of an element to screenshot" })
  @IsOptional()
  @IsString()
  selector?: string;
}
