import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const htmlPath = resolve("docs/cms-user-manual.html");
const pdfPath = resolve(process.argv[2] ?? "docs/cms-user-manual.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
// Ensure web fonts (Poppins) are fully loaded before printing.
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
});
await browser.close();
console.log("PDF_WRITTEN " + pdfPath);
