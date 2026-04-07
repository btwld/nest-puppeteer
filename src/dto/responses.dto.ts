import { ApiProperty } from "@nestjs/swagger";

// ---------------------------------------------------------------------------
// Result DTOs (the "result" field inside the wrapper)
// ---------------------------------------------------------------------------

export class ContentResultDto {
  @ApiProperty({ description: "Fully rendered HTML including head section" })
  html!: string;
}

export class MarkdownResultDto {
  @ApiProperty({ description: "Page content converted to Markdown" })
  markdown!: string;
}

export class SnapshotResultDto {
  @ApiProperty({ description: "Fully rendered HTML" })
  html!: string;

  @ApiProperty({ description: "Base64-encoded screenshot image" })
  screenshot!: string;
}

class ScrapedElementDto {
  @ApiProperty()
  text!: string;

  @ApiProperty()
  html!: string;

  @ApiProperty({ type: [Object] })
  attributes!: Array<{ name: string; value: string }>;

  @ApiProperty()
  width!: number;

  @ApiProperty()
  height!: number;

  @ApiProperty()
  top!: number;

  @ApiProperty()
  left!: number;
}

class ScrapeResultItemDto {
  @ApiProperty({ description: "CSS selector used" })
  selector!: string;

  @ApiProperty({ type: [ScrapedElementDto] })
  elements!: ScrapedElementDto[];
}

export class ScrapeResultDto {
  @ApiProperty({ type: [ScrapeResultItemDto] })
  results!: ScrapeResultItemDto[];
}

// ---------------------------------------------------------------------------
// Wrapped response DTOs (top-level { success, result })
// ---------------------------------------------------------------------------

export class BrowserRenderingErrorDto {
  @ApiProperty({ example: 400 })
  code!: number;

  @ApiProperty({ example: 'Either "url" or "html" must be provided' })
  message!: string;
}

export class BrowserRenderingErrorResponse {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ type: [BrowserRenderingErrorDto] })
  errors!: BrowserRenderingErrorDto[];
}

export class ContentResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: ContentResultDto })
  result!: ContentResultDto;
}

export class MarkdownResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: MarkdownResultDto })
  result!: MarkdownResultDto;
}

export class SnapshotResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: SnapshotResultDto })
  result!: SnapshotResultDto;
}

export class ScrapeResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: ScrapeResultDto })
  result!: ScrapeResultDto;
}

export class LinksResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [String], description: "Array of URLs" })
  result!: string[];
}
