import mammoth from "mammoth";
import { definePDFJSModule, extractImages, extractText, getDocumentProxy, renderPageAsImage } from "unpdf";
import type { SkillRow, StoredProfileSkill } from "@workspace/db";
import zlib from "node:zlib";

export class CvError extends Error {}

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_SCANNED_PAGES = 10;
const MAX_PDF_PAGES = 50;
const MIN_SEARCHABLE_PAGE_CHARS = 40;
const SCANNED_PAGE_RENDER_WIDTH = 1200;
const MAX_SCANNED_PAGE_RENDER_DIMENSION = 8192;
const MAX_SCANNED_PAGE_RENDER_PIXELS = 12_000_000;
const MIN_SCANNED_PAGE_RENDER_DIMENSION = 64;
let pdfJsModuleReady: Promise<void> | undefined;

async function ensurePdfJsModule(): Promise<void> {
  if (!pdfJsModuleReady) {
    pdfJsModuleReady = (async () => {
      try {
        await definePDFJSModule(() => import("pdfjs-dist/legacy/build/pdf.mjs"));
      } catch {}
    })();
  }
  await pdfJsModuleReady;
}

const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c;
}

function crc32(buf: Uint8Array | Uint8ClampedArray): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function encodeRawImageToPng(width: number, height: number, channels: number, data: Uint8Array | Uint8ClampedArray): Buffer {
  const stride = width * channels;
  const filtered = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (stride + 1)] = 0;
    const srcStart = y * stride;
    filtered.set(data.subarray(srcStart, srcStart + stride), y * (stride + 1) + 1);
  }
  const compressed = zlib.deflateSync(filtered);

  function makeChunk(type: string, chunkData: Buffer): Buffer {
    const chunk = Buffer.alloc(12 + chunkData.length);
    chunk.writeUInt32BE(chunkData.length, 0);
    chunk.write(type, 4, 4, "ascii");
    chunkData.copy(chunk, 8);
    const crc = crc32(chunk.subarray(4, 8 + chunkData.length));
    chunk.writeUInt32BE(crc, 8 + chunkData.length);
    return chunk;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = channels === 4 ? 6 : channels === 3 ? 2 : 0;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

export type CvImageInput = {
  mediaType: "image/png" | "image/jpeg" | "image/webp";
  base64: string;
};
export type CvDocumentPage = {
  pageNumber: number;
  text: string;
  image?: CvImageInput;
};

export function isCvImageFile(fileName: string): boolean {
  return /\.(?:png|jpe?g|webp)$/i.test(fileName);
}

function decodeBase64(contentBase64: string): Buffer {
  const cleaned = contentBase64.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (contentBase64.trim() && !/^[A-Za-z0-9+/=]+$/.test(cleaned)) throw new CvError("cv_corrupt");
  const padLength = (4 - (cleaned.length % 4)) % 4;
  const padded = cleaned + "=".repeat(padLength);
  const buf = Buffer.from(padded, "base64");
  if (buf.length === 0) throw new CvError("cv_empty");
  if (buf.length > MAX_BYTES) throw new CvError("cv_too_large");
  return buf;
}

export function validateCvImage(fileName: string, contentBase64: string): CvImageInput {
  const buf = decodeBase64(contentBase64);
  const ext = fileName.toLowerCase().split(".").pop();
  const signatureMime = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ? "image/png"
    : buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
      ? "image/jpeg"
      : buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP"
        ? "image/webp"
        : null;
  const extensionMime = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : null;
  if (!signatureMime || signatureMime !== extensionMime || buf.length < 24) throw new CvError("cv_corrupt");
  return { mediaType: signatureMime, base64: contentBase64 };
}

let ocrWorkerPromise: Promise<any> | undefined;
let ocrIdleTimer: NodeJS.Timeout | undefined;

async function getOcrWorker(): Promise<any> {
  if (ocrIdleTimer) {
    clearTimeout(ocrIdleTimer);
    ocrIdleTimer = undefined;
  }
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      try {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng");
        return worker;
      } catch (err) {
        ocrWorkerPromise = undefined;
        throw err;
      }
    })();
  }
  return ocrWorkerPromise;
}

function scheduleWorkerCleanup(): void {
  if (ocrIdleTimer) clearTimeout(ocrIdleTimer);
  ocrIdleTimer = setTimeout(async () => {
    await terminateOcrWorker();
  }, 2000);
  ocrIdleTimer.unref();
}

export async function terminateOcrWorker(): Promise<void> {
  if (ocrIdleTimer) {
    clearTimeout(ocrIdleTimer);
    ocrIdleTimer = undefined;
  }
  if (ocrWorkerPromise) {
    const p = ocrWorkerPromise;
    ocrWorkerPromise = undefined;
    try {
      const worker = await p;
      await worker.terminate();
    } catch {}
  }
}

export async function recognizeCvImage(image: CvImageInput | Buffer): Promise<string> {
  try {
    const worker = await getOcrWorker();
    const input = Buffer.isBuffer(image) ? image : Buffer.from(image.base64, "base64");
    const ret = await worker.recognize(input);
    scheduleWorkerCleanup();
    return normalizeCvText(ret?.data?.text || "");
  } catch {
    scheduleWorkerCleanup();
    return "";
  }
}

export function repairPdfKerning(text: string): string {
  if (!text) return "";
  let res = text.replace(/\uFFFD/g, "-");

  // Fix numbers with spaces: e.g. "201 8" -> "2018", "1 .2" -> "1.2", "1 5%" -> "15%"
  res = res.replace(/\b(19\d|20\d)\s+(\d)\b/g, "$1$2");
  res = res.replace(/\b(\d+)\s*\.\s*(\d+)\b/g, "$1.$2");
  res = res.replace(/\b(\d+)\s+([%MkB])\b/g, "$1$2");

  // Fix single-letter spaced uppercase words: "S E N I O R" -> "Senior", "K A R T H I K" -> "Karthik"
  res = res.replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\b/g, "$1$2$3$4$5$6$7$8");
  res = res.replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\b/g, "$1$2$3$4$5$6");
  res = res.replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\b/g, "$1$2$3$4");

  // Specific common PDF broken fragments
  const replacements: [RegExp, string][] = [
    [/\bS\s*E\s*NI\s*OR\b/gi, "Senior"],
    [/\bMACHI\s*NE\b/gi, "Machine"],
    [/\bLEARNI\s*NG\b/gi, "Learning"],
    [/\bENGI\s*NE\s*E\s*R\b/gi, "Engineer"],
    [/\bENGI\s*NEER\b/gi, "Engineer"],
    [/\bSU\s*MMARY\b/gi, "Summary"],
    [/\bCONT\s*ACT\b/gi, "Contact"],
    [/\bWORK\s*&\s*TECH\s*N\s*I\s*CAL\s*PROJ\s*E\s*CTS\b/gi, "Work & Technical Projects"],
    [/\bTECH\s*N\s*I\s*CAL\b/gi, "Technical"],
    [/\bPROJ\s*E\s*CTS\b/gi, "Projects"],
    [/\bSKI\s*LLS\b/gi, "Skills"],
    [/\bEDU\s*CATI\s*ON\b/gi, "Education"],
    [/\bADDI\s*TI\s*ON\s*AL\b/gi, "Additional"],
    [/\bI\s*N\s*FORMATI\s*ON\b/gi, "Information"],
    [/\bLANGU\s*AGES\b/gi, "Languages"],
    [/\bCERTIFI\s*CATI\s*ON\b/gi, "Certification"],
    [/\bACHIEVE\s*MENTS\b/gi, "Achievements"],
    [/\bEXPERI\s*ENCE\b/gi, "Experience"],
    [/\bPROFESSI\s*ONAL\b/gi, "Professional"],
    [/\bQUALIFI\s*CATI\s*ONS\b/gi, "Qualifications"],
  ];

  for (const [re, rep] of replacements) {
    res = res.replace(re, rep);
  }

  return res;
}

export function normalizeCvText(value: string): string {
  const cleaned = value.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return repairPdfKerning(cleaned).slice(0, 60000);
}

function safeScannedPageScale(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new CvError("cv_unreadable");
  }

  const scale = Math.min(
    SCANNED_PAGE_RENDER_WIDTH / width,
    MAX_SCANNED_PAGE_RENDER_DIMENSION / width,
    MAX_SCANNED_PAGE_RENDER_DIMENSION / height,
    Math.sqrt(MAX_SCANNED_PAGE_RENDER_PIXELS / (width * height)),
  ) * 0.999;
  const renderedWidth = Math.ceil(width * scale);
  const renderedHeight = Math.ceil(height * scale);
  if (
    !Number.isFinite(scale) ||
    scale <= 0 ||
    renderedWidth < MIN_SCANNED_PAGE_RENDER_DIMENSION ||
    renderedHeight < MIN_SCANNED_PAGE_RENDER_DIMENSION ||
    renderedWidth > MAX_SCANNED_PAGE_RENDER_DIMENSION ||
    renderedHeight > MAX_SCANNED_PAGE_RENDER_DIMENSION ||
    renderedWidth * renderedHeight > MAX_SCANNED_PAGE_RENDER_PIXELS
  ) {
    throw new CvError("cv_unreadable");
  }
  return scale;
}

export async function extractCvText(fileName: string, contentBase64: string): Promise<string> {
  const document = await extractCvDocument(fileName, contentBase64);
  if ("pages" in document) throw new CvError("cv_unreadable");
  return document.text;
}

export async function extractCvDocument(
  fileName: string,
  contentBase64: string,
): Promise<{ text: string; pages?: never } | { text?: never; pages: CvDocumentPage[] }> {
  const buf = decodeBase64(contentBase64);
  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "pdf") {
    await ensurePdfJsModule();
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    try {
      if (pdf.numPages > MAX_PDF_PAGES) throw new CvError("cv_too_many_pages");
      const out = await extractText(pdf, { mergePages: false });
      const pageTexts = out.text.map(normalizeCvText);
      const searchableText = normalizeCvText(pageTexts.join("\n\n"));
      const scannedPages = pageTexts
        .map((text, index) => ({ pageNumber: index + 1, text }))
        .filter((page) => page.text.length < MIN_SEARCHABLE_PAGE_CHARS);

      if (scannedPages.length === 0) {
        if (searchableText.length < 40 || !/[\p{L}]{2}/u.test(searchableText)) {
          throw new CvError("cv_unreadable");
        }
        return { text: searchableText };
      }

      if (scannedPages.length > MAX_SCANNED_PAGES) throw new CvError("cv_too_many_pages");

      const rendered: Array<{ pageNumber: number; image: CvImageInput }> = [];
      for (const { pageNumber } of scannedPages) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const scale = safeScannedPageScale(viewport.width, viewport.height);
        let imageInput: CvImageInput | undefined;
        try {
          const canvasImport = () => import("@napi-rs/canvas");
          const png = Buffer.from(await renderPageAsImage(pdf, pageNumber, { canvasImport, scale }));
          const { createCanvas, loadImage } = await canvasImport();
          const source = await loadImage(png);
          const canvas = createCanvas(source.width, source.height);
          const context = canvas.getContext("2d");
          context.drawImage(source, 0, 0);
          const jpeg = canvas.toBuffer("image/jpeg", 75);
          imageInput = {
            mediaType: "image/jpeg" as const,
            base64: jpeg.toString("base64"),
          };
        } catch (renderErr) {
          if (renderErr instanceof CvError) throw renderErr;
          // Fallback: extract embedded image directly without native canvas dependency
          const extracted = await extractImages(pdf, pageNumber);
          if (extracted.length > 0) {
            const best = extracted.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];
            const pngBuf = encodeRawImageToPng(best.width, best.height, best.channels, best.data);
            imageInput = {
              mediaType: "image/png" as const,
              base64: pngBuf.toString("base64"),
            };
          }
        }
        if (!imageInput) {
          if (searchableText.length >= 40 && /[\p{L}]{2}/u.test(searchableText)) {
            return { text: searchableText };
          }
          throw new CvError("cv_unreadable");
        }
        rendered.push({ pageNumber, image: imageInput });

        try {
          const ocrText = await recognizeCvImage(imageInput);
          if (ocrText && ocrText.length >= MIN_SEARCHABLE_PAGE_CHARS) {
            pageTexts[pageNumber - 1] = ocrText;
          }
        } catch {}
      }
      const renderedByPage = new Map(rendered.map((page) => [page.pageNumber, page.image]));
      const pages = pageTexts.map((text, index) => ({
        pageNumber: index + 1,
        text,
        ...(renderedByPage.has(index + 1) ? { image: renderedByPage.get(index + 1)! } : {}),
      }));
      return { pages };
    } finally {
      await pdf.destroy();
    }
  }
  let text: string;
  if (ext === "docx") text = (await mammoth.extractRawText({ buffer: buf })).value;
  else if (ext === "txt") text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
  else throw new CvError("cv_unsupported");
  text = normalizeCvText(text);
  if (text.length < 40 || !/[\p{L}]{2}/u.test(text)) throw new CvError("cv_unreadable");
  return { text };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

export function extractSkills(text: string, skills: SkillRow[]): StoredProfileSkill[] {
  const found: StoredProfileSkill[] = [];
  const flat = text.replace(/\s+/g, " ");
  for (const s of skills) {
    const terms = [s.name, ...s.aliases];
    for (const t of terms) {
      const re = new RegExp(`(^|[^a-z0-9])${escape(t.toLowerCase())}([^a-z0-9]|$)`, "i");
      const m = re.exec(flat);
      if (m) {
        const start = Math.max(0, m.index - 50);
        const end = Math.min(flat.length, m.index + t.length + 60);
        found.push({ skillId: s.id, status: "evidenced", evidence: `...${flat.slice(start, end).trim()}...` });
        break;
      }
    }
  }
  return found;
}
