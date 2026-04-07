import { Module } from "@nestjs/common";
import {
  PuppeteerModule,
  PdfBrowserModule,
  ScreenshotBrowserModule,
} from "@bitwild/nest-puppeteer";

@Module({
  imports: [
    PuppeteerModule.forRoot({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      rest: {
        prefix: "browser-rendering",
        features: [
          "content",
          "screenshot",
          "pdf",
          "markdown",
          "snapshot",
          "scrape",
          "links",
        ],
      },
    }),

    PdfBrowserModule.register({
      defaults: { format: "a4", printBackground: true },
      prefix: "api/pdf",
    }),

    ScreenshotBrowserModule.register({
      defaults: { fullPage: true, type: "png" },
      prefix: "api/screenshot",
    }),
  ],
})
export class AppModule {}
