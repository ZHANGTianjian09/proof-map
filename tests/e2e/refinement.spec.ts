import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import sample from "../../examples/statistical-estimation.graph.json" with { type: "json" };
async function ready(page: Page) {
  await expect(page.locator(".canvas-panel")).toHaveAttribute("data-layout-status", "ready");
  await page.waitForTimeout(450);
}

async function importGraph(page: Page, graph: unknown) {
  await page.getByLabel("Import graph JSON file").setInputFiles({
    name: "refinement.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(graph)),
  });
  await expect(
    page.getByRole("button", { name: "Import JSON", exact: true }),
  ).toBeEnabled();
  await ready(page);
}
async function viewport(page: Page) {
  return page.locator(".react-flow__viewport").evaluate((el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return { x: m.e, y: m.f, zoom: m.a };
  });
}
async function zoomOut(page: Page) {
  const point = await canvasPoint(page);
  await page.mouse.move(point.x, point.y);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, 5000);
  await page.keyboard.up("Control");
  await page.waitForTimeout(350);
}
async function canvasPoint(page: Page) {
  const box = (await page.locator(".map-area").boundingBox())!;
  return { x: box.x + 50, y: box.y + 50 };
}
async function downloadPDF(page: Page, path: string) {
  const waiting = page.waitForEvent("download", { timeout: 90_000 });
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  const download = await waiting;
  await download.saveAs(path);
  await expect(
    page.getByRole("button", { name: "Download PDF", exact: true }),
  ).toBeEnabled();
  return readFile(path);
}
test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.getByLabel("Import graph JSON file").setInputFiles({
    name: "sample.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(sample)),
  });
  await ready(page);
});

test("uses a dominant canvas and a bounded nonmodal inspector without changing layout or camera", async ({
  page,
}) => {
  await expect(
    page.locator(".inspector,.react-flow__minimap,.canvas-status,.app-footer"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Enable node dragging" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Toggle map overview" }),
  ).toHaveCount(0);
  const node = page.locator('.react-flow__node[data-id="t-concentration"]');
  const positions = await page
    .locator(".react-flow__node")
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).transform));
  const before = await viewport(page);
  await node.click();
  const panel = page.getByRole("dialog", { name: "Node inspector" });
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute("aria-modal", "false");
  expect(await viewport(page)).toEqual(before);
  expect(
    await page
      .locator(".react-flow__node")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).transform)),
  ).toEqual(positions);
  const box = (await page.locator(".floating-panel").boundingBox())!,
    area = (await page.locator(".map-area").boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(area.x);
  expect(box.y).toBeGreaterThanOrEqual(area.y);
  expect(box.x + box.width).toBeLessThanOrEqual(area.x + area.width);
  expect(box.y + box.height).toBeLessThanOrEqual(area.y + area.height);
  await page.screenshot({
    path: ".local/proof-map-floating-inspector.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await node.click();
  await page.mouse.click(
    (await canvasPoint(page)).x,
    (await canvasPoint(page)).y,
  );
  await expect(panel).toHaveCount(0);
});

test("pans both scroll axes without zooming, supports the pinch wheel signal, and prevents moving nodes", async ({
  page,
}) => {
  const point = await canvasPoint(page);
  await page.mouse.move(point.x, point.y);
  const overview = await viewport(page);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -30);
  await page.keyboard.up("Control");
  await expect
    .poll(async () => (await viewport(page)).zoom)
    .toBeGreaterThan(overview.zoom);
  const before = await viewport(page);
  await page.mouse.wheel(160, 120);
  await expect
    .poll(async () => (await viewport(page)).x)
    .toBeLessThan(before.x - 50);
  const panned = await viewport(page);
  expect(panned.y).toBeLessThan(before.y - 50);
  expect(panned.zoom).toBeCloseTo(before.zoom, 5);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -120);
  await page.keyboard.up("Control");
  await expect
    .poll(async () => (await viewport(page)).zoom)
    .toBeGreaterThan(before.zoom);
  await zoomOut(page);
  await page.waitForTimeout(350);
  const node = page.locator('.react-flow__node[data-id="l-mgf"]');
  const transform = await node.getAttribute("style");
  const box = (await node.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 80,
    box.y + box.height / 2 + 60,
    { steps: 8 },
  );
  await page.mouse.up();
  expect(await node.getAttribute("style")).toBe(transform);
});

test("zooming out stops at the full visible map and adapts to resizing", async ({
  page,
}) => {
  for (const size of [
    { width: 1512, height: 982 },
    { width: 900, height: 700 },
  ]) {
    await page.setViewportSize(size);
    await zoomOut(page);
    await page.waitForTimeout(350);
    const fitted = await viewport(page);
    const point = await canvasPoint(page);
    await page.mouse.move(point.x, point.y);
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -120);
    await page.keyboard.up("Control");
    await expect
      .poll(async () => (await viewport(page)).zoom)
      .toBeGreaterThan(fitted.zoom);
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, 5000);
    await page.keyboard.up("Control");
    await expect
      .poll(async () => (await viewport(page)).zoom)
      .toBeCloseTo(fitted.zoom, 4);
    await expect
      .poll(async () => (await viewport(page)).x)
      .toBeCloseTo(fitted.x, 1);
    await expect
      .poll(async () => (await viewport(page)).y)
      .toBeCloseTo(fitted.y, 1);
    await page.mouse.wheel(400, 400);
    await page.mouse.down();
    await page.mouse.move(point.x + 80, point.y + 60, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    const locked = await viewport(page);
    expect(locked.x).toBeCloseTo(fitted.x, 1);
    expect(locked.y).toBeCloseTo(fitted.y, 1);
    expect(locked.zoom).toBeCloseTo(fitted.zoom, 4);
  }
});

test("Example filter groups examples and counterexamples without changing their data", async ({
  page,
}) => {
  const example = page.getByRole("checkbox", { name: /^Example/ });
  await expect(example).toHaveCount(1);
  await expect(
    page.getByRole("checkbox", { name: /^Counterexample/ }),
  ).toHaveCount(0);
  await example.uncheck();
  await expect(
    page.locator('.math-node[data-object-type="example"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('.math-node[data-object-type="counterexample"]'),
  ).toHaveCount(0);
  await example.check();
  await expect(
    page.locator('.math-node[data-object-type="example"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('.math-node[data-object-type="counterexample"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('.math-node[data-object-type="counterexample"]'),
  ).toContainText("Counterexample 4.3");
});

test("keeps long formulas and inspector scrolling independent of graph gestures", async ({
  page,
}) => {
  const graph = structuredClone(sample);
  graph.nodes.find((n) => n.id === "t-concentration")!.statement =
    "For all samples,\n$$" +
    Array.from({ length: 25 }, (_, i) => `X_{${i}}`).join("+") +
    "$$\n" +
    "A long mathematical explanation.\n".repeat(80);
  await importGraph(page, graph);
  await page.locator('.react-flow__node[data-id="t-concentration"]').click();
  const scroller = page.locator(".inspector-scroll");
  const formula = page.locator(".statement-section .math-display");
  expect(await formula.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
  const before = await viewport(page);
  const box = (await scroller.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 350);
  await expect
    .poll(async () => scroller.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(50);
  expect(await viewport(page)).toEqual(before);
});

test("search exposes hidden context and scope classification retains local definitions", async ({
  page,
}) => {
  await page.getByLabel("Search mathematical objects").fill("d-mean");
  await page.getByLabel("Search mathematical objects").press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Node inspector" }),
  ).toContainText("Global context · hidden from the map");
  await expect(page.locator('.react-flow__node[data-id="d-mean"]')).toHaveCount(
    0,
  );
  await page.getByLabel("Scope of Definition 1.2").selectOption("local_proof");
  await ready(page);
  await expect(page.locator(".react-flow__node")).toHaveCount(13);
  await expect(page.locator('.react-flow__node[data-id="d-mean"]')).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: "Close inspector" }).click();
  await page.getByRole("button", { name: "Show complete map", exact: true }).click();
  await ready(page);
  await expect(page.locator(".react-flow__node")).toHaveCount(16);
  await expect(page.locator(".react-flow__edge")).toHaveCount(16);

});

test("explains edge origins independently of verification and opens direct evidence inspection", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Edge legend", exact: true }).click();
  const legend = page.getByRole("region", { name: "Edge legend" });
  await expect(legend).toContainText("Solid · source-supported");
  await expect(legend).toContainText("Dashed · inferred");
  await expect(legend).toContainText("unverified or disputed");
  await page.keyboard.press("Escape");
  const path = page.locator(
    '.react-flow__edge[data-id="e05"] .react-flow__edge-path',
  );
  const point = await path.evaluate((el) => {
    const p = el as SVGPathElement;
    const xy = p.getPointAtLength(p.getTotalLength() / 2);
    const m = p.getScreenCTM()!;
    const screen = new DOMPoint(xy.x, xy.y).matrixTransform(m);
    return { x: screen.x, y: screen.y };
  });
  await page.mouse.click(point.x, point.y);
  const inspector = page.getByRole("dialog", {
    name: "Relationship inspector",
  });
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText("Solid · source-supported");
  await expect(inspector).toContainText("unverified");
  await expect(inspector).toContainText("Combine Lemma 2.1");
});

test("exports identical full-map imagery regardless of pan and zoom, excluding application UI", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const lateScripts: string[] = [];
  await page.route(/\.js(?:\?|$)/, (route) => {
    lateScripts.push(route.request().url());
    return route.abort();
  });
  const first = await downloadPDF(page, ".local/proof-map-refined.pdf");
  expect(lateScripts).toEqual([]);
  await expect(page.locator(".notice")).toHaveCount(0);
  const p = await canvasPoint(page);
  await page.mouse.move(p.x, p.y);
  await page.mouse.wheel(1400, 1800);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -100);
  await page.keyboard.up("Control");
  await page.waitForTimeout(300);
  const second = await downloadPDF(page, ".local/proof-map-panned.pdf");
  expect(first.subarray(0, 5).toString()).toBe("%PDF-");
  const images = (pdf: Buffer) =>
    [
      ...pdf
        .toString("latin1")
        .matchAll(
          /\/Subtype\s*\/Image[\s\S]*?stream\r?\n([\s\S]*?)\r?\nendstream/g,
        ),
    ].map((m) => m[1]);
  expect(images(first).length).toBeGreaterThan(0);
  // A valid downloadable PDF can still be blank if offscreen capture fails.
  // PNG streams use FlateDecode; real text/card imagery has rich pixel variation.
  expect(
    Math.max(
      ...images(first).map(
        (bytes) => new Set(inflateSync(Buffer.from(bytes, "latin1"))).size,
      ),
    ),
  ).toBeGreaterThan(100);
  expect(images(second)).toEqual(images(first));
  expect(first.length).toBeGreaterThan(20000);
});

test("keeps PDF failures out of banners and lets the download button retry", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function () {
      HTMLCanvasElement.prototype.toDataURL = original;
      throw new Error("Importing a module script failed.");
    };
  });
  const button = page.getByRole("button", {
    name: "Download PDF",
    exact: true,
  });
  await button.click();
  await expect(button).toHaveAttribute(
    "data-tooltip",
    "Download failed. Click to try again.",
  );
  await expect(button).toBeEnabled();
  await expect(page.locator(".export-error,[role=alert]")).toHaveCount(0);
  await expect(
    page.getByText("Importing a module script failed.", { exact: false }),
  ).toHaveCount(0);
  const pdf = await downloadPDF(page, ".local/pdf-download-fix/retried.pdf");
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  await expect(button).toHaveAttribute(
    "data-tooltip",
    "Download the visible map as PDF",
  );
  await expect(page.locator("#pdf-download-status")).toHaveCount(0);
});

test("exports a larger graph as readable overlapping pages with math and Unicode titles", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const nodes = sample.nodes.slice(0, 8).map((n, i) => ({
    ...n,
    id: `n${i}`,
    metadata: {},
    title: i === 3 ? "$\\alpha_n$ concentration · 均值" : n.title,
  }));
  const edges = nodes.slice(1).map((n, i) => ({
    id: `e${i}`,
    source: nodes[i].id,
    target: n.id,
    relation: "uses",
    origin: "inferred",
    verification: "unverified",
  }));
  await importGraph(page, { ...sample, nodes, edges });
  await expect(page.locator(".math-error")).toHaveCount(0);
  const pdf = await downloadPDF(page, ".local/proof-map-tiled.pdf");
  const count = Number(
    pdf.toString("latin1").match(/\/Type \/Pages[\s\S]*?\/Count (\d+)/)?.[1],
  );
  expect(count).toBeGreaterThan(1);
});

test("keeps the floating inspector inside a narrow viewport and offers navigator collapse", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await importGraph(page, sample);
  await ready(page);
  await expect(
    page.getByRole("button", { name: "Open paper navigator" }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Paper navigation" }),
  ).toHaveCount(0);
  await page.locator('.react-flow__node[data-id="t-concentration"]').click();
  const panel = (await page.locator(".floating-panel").boundingBox())!;
  expect(panel.x).toBeGreaterThanOrEqual(0);
  expect(panel.x + panel.width).toBeLessThanOrEqual(390);
  expect(panel.y + panel.height).toBeLessThanOrEqual(844);
  expect(panel.height).toBeLessThan(600);
  await page.screenshot({
    path: ".local/proof-map-floating-mobile.png",
    fullPage: true,
  });
});

test("zoomed-in panning reaches every edge with the overview margin", async ({ page }) => {
  const nodes = Array.from({ length: 25 }, (_, i) => ({
    ...sample.nodes[0], id: `margin-${i}`, metadata: {},
  }));
  await importGraph(page, { ...sample, nodes, edges: [] });
  const area = (await page.locator(".map-area").boundingBox())!;
  const point = await canvasPoint(page);
  await page.mouse.move(point.x, point.y);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -500);
  await page.keyboard.up("Control");
  await expect.poll(async () => (await viewport(page)).zoom).toBeCloseTo(2, 4);
  const bounds = () => page.locator(".math-node").evaluateAll((elements) => {
    const rects = elements.map((el) => el.getBoundingClientRect());
    return { left: Math.min(...rects.map((r) => r.left)), top: Math.min(...rects.map((r) => r.top)),
      right: Math.max(...rects.map((r) => r.right)), bottom: Math.max(...rects.map((r) => r.bottom)) };
  });
  await page.mouse.wheel(-10000, -10000);
  await expect.poll(async () => (await bounds()).left - area.x).toBeCloseTo(40, 0);
  await expect.poll(async () => (await bounds()).top - area.y).toBeCloseTo(40, 0);
  await page.mouse.wheel(10000, 10000);
  await expect.poll(async () => area.x + area.width - (await bounds()).right).toBeCloseTo(40, 0);
  await expect.poll(async () => area.y + area.height - (await bounds()).bottom).toBeCloseTo(40, 0);
  await zoomOut(page);
  const fitted = await bounds();
  expect(fitted.left - area.x).toBeGreaterThanOrEqual(39);
  expect(fitted.top - area.y).toBeGreaterThanOrEqual(39);
  expect(area.x + area.width - fitted.right).toBeGreaterThanOrEqual(39);
  expect(area.y + area.height - fitted.bottom).toBeGreaterThanOrEqual(39);
});
