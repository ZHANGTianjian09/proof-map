import type { MathEdge, Paper } from "../graph/types";
import { jsPDF } from "jspdf";
import { toCanvas, getFontEmbedCSS } from "html-to-image";
import { RELATION_STYLE } from "../graph/presentation";
import {
  mapBounds,
  planPdf,
  PDF_HEADER,
  PDF_MARGIN,
  type ExportNode,
} from "./pdf-plan";

export async function exportMapPdf(
  viewport: HTMLElement,
  paper: Paper,
  nodes: ExportNode[],
  edges: MathEdge[],
) {
  if (!nodes.length) throw new Error("There are no visible objects to export.");
  const diagram = viewport.cloneNode(true) as HTMLElement;
  // PDF dependencies load with the application, not on the first download.
  // An already-open page must not depend on fetching a late JavaScript chunk.
  await document.fonts.ready;
  const pages = planPdf(mapBounds(nodes, edges), nodes);
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: pages[0].format,
    compress: true,
  });
  doc.setProperties({
    title: paper.title,
    subject: "Proof Map — visible mathematical graph",
    creator: "Proof Map (client-side export)",
  });
  // This clone predates asynchronous image/font work and ignores live pan/zoom changes.
  diagram
    .querySelectorAll(".is-selected,.selected,.is-neighbor")
    .forEach((el) =>
      el.classList.remove("is-selected", "selected", "is-neighbor"),
    );
  diagram
    .querySelectorAll(
      '.react-flow__handle,.react-flow__edge-interaction,[data-selection-label="true"]',
    )
    .forEach((el) => el.remove());
  diagram.querySelectorAll(".react-flow__node").forEach((el) => {
    if (!nodes.some((n) => n.id === el.getAttribute("data-id"))) el.remove();
  });
  diagram.querySelectorAll<SVGGElement>(".react-flow__edge").forEach((el) => {
    const edge = edges.find((e) => e.id === el.getAttribute("data-id"));
    if (!edge) {
      el.remove();
      return;
    }
    el.querySelectorAll<SVGPathElement>(".react-flow__edge-path").forEach(
      (path) => {
        path.style.opacity = "1";
        path.style.strokeWidth = String(RELATION_STYLE[edge.relation].width);
      },
    );
  });
  const stage = document.createElement("div");
  stage.className = "pdf-export-stage";
  // Keep offscreen positioning on an ancestor that is never rasterized. Cloning
  // computed logical inset properties can otherwise retain the offscreen offset.
  const host = document.createElement("div");
  Object.assign(host.style, {
    position: "fixed",
    left: "-100000px",
    top: "0",
    pointerEvents: "none",
  });
  Object.assign(stage.style, {
    position: "relative",
    background: "#fff",
    overflow: "hidden",
    pointerEvents: "none",
    color: "#171717",
  });
  host.append(stage);
  document.body.append(host);
  try {
    const fontEmbedCSS = await getFontEmbedCSS(viewport, {
      preferredFontFormat: "woff2",
    });
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageWidth = (page.format[0] - 2 * PDF_MARGIN) / page.scale;
      if (i) doc.addPage(page.format, "landscape");
      stage.replaceChildren();
      stage.style.width = `${pageWidth}px`;
      stage.style.height = `${page.rect.height + PDF_HEADER}px`;
      const heading = document.createElement("div");
      Object.assign(heading.style, {
        height: `${PDF_HEADER}px`,
        padding: "0 0 14px",
        fontFamily: "Georgia, serif",
        background: "white",
      });
      const title = document.createElement("div");
      title.textContent = paper.title;
      Object.assign(title.style, {
        fontSize: "19px",
        lineHeight: "24px",
        maxHeight: "48px",
        overflow: "hidden",
      });
      const caption = document.createElement("div");
      caption.textContent = `Proof Map · ${nodes.length} objects · ${edges.length} relationships${pages.length > 1 ? ` · Tile ${page.row + 1}.${page.column + 1} · ${i + 1}/${pages.length} · Adjacent pages overlap` : ""}`;
      Object.assign(caption.style, {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#666666",
        marginTop: "6px",
      });
      heading.append(title, caption);
      const clipping = document.createElement("div");
      // Preserve React Flow's scoped SVG overflow/position rules and CSS variables.
      clipping.className = "react-flow";
      Object.assign(clipping.style, {
        position: "relative",
        width: `${page.rect.width}px`,
        height: `${page.rect.height}px`,
        overflow: "hidden",
        background: "white",
        marginInline: "auto",
      });
      const copy = diagram.cloneNode(true) as HTMLElement;
      Object.assign(copy.style, {
        transform: `translate(${-page.rect.x}px, ${-page.rect.y}px) scale(1)`,
        transformOrigin: "0 0",
        width: `${page.rect.width}px`,
        height: `${page.rect.height}px`,
      });
      clipping.append(copy);
      stage.append(heading, clipping);
      // 3 pixels per graph pixel yields at least 216 dpi, and 288 dpi on tiled pages.
      const canvas = await toCanvas(stage, {
        pixelRatio: 3,
        backgroundColor: "#ffffff",
        fontEmbedCSS,
        skipAutoScale: true,
        width: pageWidth,
        height: page.rect.height + PDF_HEADER,
      });
      doc.addImage(
        canvas,
        "PNG",
        PDF_MARGIN,
        PDF_MARGIN,
        pageWidth * page.scale,
        (page.rect.height + PDF_HEADER) * page.scale,
        undefined,
        "FAST",
      );
      // Release each raster before rendering the next page.
      canvas.width = 0;
      canvas.height = 0;
    }
    doc.save(
      `${paper.id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "paper"}.proof-map.pdf`,
    );
    return pages.length;
  } finally {
    host.remove();
  }
}
