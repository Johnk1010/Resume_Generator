import type { ResumeDto } from "@curriculo/shared";
import puppeteer from "puppeteer";
import { renderResumeDocx } from "../views/templates/render-docx.js";
import { renderResumeHtml } from "../views/templates/render-html.js";
import { sanitizeFilename } from "../views/templates/utils.js";

const dateTag = (): string => new Date().toISOString().slice(0, 10);

export const buildExportBaseName = (resume: ResumeDto): string => {
  const source = resume.content.header.fullName || resume.title || "Curriculo";
  return `Curriculo_${sanitizeFilename(source)}_${dateTag()}`;
};

export const exportPdf = async (resume: ResumeDto): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(renderResumeHtml(resume), { waitUntil: "networkidle0" });
    return Buffer.from(
      await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0",
          right: "0",
          bottom: "0",
          left: "0"
        }
      })
    );
  } finally {
    await browser.close();
  }
};

export const exportDocx = async (resume: ResumeDto): Promise<Buffer> => {
  return renderResumeDocx(resume);
};

