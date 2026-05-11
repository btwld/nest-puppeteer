import { INestApplication } from "@nestjs/common";
import { FontRegistry, PuppeteerService, parseFontVariant } from "@bitwild/nest-puppeteer";
import request from "supertest";
import { createTestApp } from "./setup";

describe("custom fonts via fontsDir", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe("parseFontVariant", () => {
    it("parses hyphenated flat names", () => {
      expect(parseFontVariant("TestSans-Light")).toEqual({
        family: "TestSans",
        weight: 300,
        style: "normal",
      });
      expect(parseFontVariant("TestSans-LightOblique")).toEqual({
        family: "TestSans",
        weight: 300,
        style: "italic",
      });
    });

    it("parses CamelCase directory names with numeric foundry weights", () => {
      expect(parseFontVariant("TestSans35Light")).toEqual({
        family: "TestSans",
        weight: 300,
        style: "normal",
      });
      expect(parseFontVariant("TestSans55Oblique")).toEqual({
        family: "TestSans",
        weight: 400,
        style: "italic",
      });
      expect(parseFontVariant("TestSans65Medium")).toEqual({
        family: "TestSans",
        weight: 500,
        style: "normal",
      });
      expect(parseFontVariant("TestSans85Heavy")).toEqual({
        family: "TestSans",
        weight: 800,
        style: "normal",
      });
    });

    it("falls back to family-only when no modifier is present", () => {
      expect(parseFontVariant("TestSans")).toEqual({
        family: "TestSans",
        weight: 400,
        style: "normal",
      });
    });
  });

  describe("registry", () => {
    it("loads variants from the configured fontsDir", () => {
      const registry = app.get(FontRegistry);
      expect(registry.isEmpty()).toBe(false);
      const block = registry.getStyleBlock();
      expect(block).toContain("@font-face");
      expect(block).toContain("font-family:'TestSans'");
      expect(block).toContain("font-weight:300");
      expect(block).toContain("font-weight:500");
      expect(block).toContain("font-weight:800");
      expect(block).toContain("font-style:italic");
      expect(block).toContain("data:font/woff2;base64,");
    });

    it("emits configured fontAliases alongside the parsed family", () => {
      const registry = app.get(FontRegistry);
      expect(registry.resolveAliases("TestSans")).toEqual([
        "TestSans",
        "Test Sans",
      ]);
      const block = registry.getStyleBlock();
      expect(block).toContain("font-family:'Test Sans'");
    });

    it("returns only the parsed family when no aliases are configured", () => {
      // Default-constructed registry: no config → no extra aliases
      const standalone = new FontRegistry();
      expect(standalone.resolveAliases("TestSans")).toEqual(["TestSans"]);
    });
  });

  describe("HTML interception", () => {
    it("prepends the @font-face block to user HTML before setContent", async () => {
      const service = app.get(PuppeteerService);
      const rendered = await service.content({
        html: "<html><body><p style='font-family:TestSans;font-weight:800'>Hi</p></body></html>",
      });
      expect(rendered).toContain("data-puppeteer-fonts");
      expect(rendered).toContain("TestSans");
    });

    it("returns a valid PDF when HTML uses the custom font", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/pdf")
        .send({
          html: "<html><body><h1 style='font-family:TestSans;font-weight:800'>Heavy</h1><p style='font-family:TestSans;font-weight:300;font-style:italic'>Light italic</p></body></html>",
          waitForFonts: true,
        })
        .expect(200);

      expect(res.headers["content-type"]).toContain("application/pdf");
      expect(Buffer.from(res.body.slice(0, 4)).toString("ascii")).toBe("%PDF");
    });
  });
});
