import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsNumber, IsObject, IsOptional, Max, Min } from "class-validator";

import type { SnapshotOptions } from "../interfaces/snapshot-options.interface.js";
import { CommonBrowserDto } from "./common-browser.dto.js";

export class SnapshotDto extends CommonBrowserDto implements SnapshotOptions {
  @ApiPropertyOptional({ enum: ["png", "jpeg", "webp"], default: "jpeg" })
  @IsOptional()
  @IsIn(["png", "jpeg", "webp"])
  type?: "png" | "jpeg" | "webp";

  @ApiPropertyOptional({ description: "Image quality (0-100)", minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  quality?: number;

  @ApiPropertyOptional({ description: "Capture the full scrollable page" })
  @IsOptional()
  @IsBoolean()
  fullPage?: boolean;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional({ description: "Clip region", type: Object })
  @IsOptional()
  @IsObject()
  clip?: { x: number; y: number; width: number; height: number };
}
