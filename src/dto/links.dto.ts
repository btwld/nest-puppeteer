import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

import type { LinksOptions } from "../interfaces/links-options.interface.js";
import { CommonBrowserDto } from "./common-browser.dto.js";

export class LinksDto extends CommonBrowserDto implements LinksOptions {
  @ApiPropertyOptional({ description: "Only return links visible in the viewport", default: false })
  @IsOptional()
  @IsBoolean()
  visibleLinksOnly?: boolean;
}
