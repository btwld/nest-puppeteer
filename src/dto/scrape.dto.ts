import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsString } from "class-validator";

import type { ScrapeOptions } from "../interfaces/scrape-options.interface.js";
import { CommonBrowserDto } from "./common-browser.dto.js";

export class ScrapeDto extends CommonBrowserDto implements ScrapeOptions {
  @ApiProperty({
    description: "CSS selectors to scrape",
    example: ["h1", "p.intro", "a[href]"],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: "selectors must contain at least one CSS selector" })
  @IsString({ each: true })
  selectors!: string[];
}
