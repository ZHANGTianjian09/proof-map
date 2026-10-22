import { expect, test, type Page } from "@playwright/test";
import sample from "../../examples/statistical-estimation.graph.json" with { type: "json" };

async function ready(page: Page) {
  await expect(page.locator(".canvas-panel")).toHaveAttribute("data-layout-status", "ready");
  await page.waitForTimeout(450);
}

async function importJSON(
  page: Page,
  value: unknown,
  name = "test.graph.json",
) {
  await page.getByLabel("Import graph JSON file").setInputFiles({
    name,
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(value)),
  });
}
test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.getByLabel("Import graph JSON file").setInputFiles({
    name: "sample.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(sample)),
  });
  await ready(page);
});

test("renders all objects, edges, formulas, and evidence without external requests", async ({
  page,
}) => {
  const errors: string[] = [];
  const remoteRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      !request.url().startsWith("http://127.0.0.1:4173/") &&
      /^https?:/.test(request.url())
    )
      remoteRequests.push(request.url());
  });
  await page.reload();
  await importJSON(page, sample);
  await ready(page);
  await expect(page.locator(".react-flow__node")).toHaveCount(12);
  await expect(page.locator(".react-flow__edge")).toHaveCount(6);
  await page.locator('.react-flow__node[data-id="t-concentration"]').click();
  await expect(page.locator(".inspector .katex-display")).toHaveCount(1);
  await expect(page.locator(".math-error")).toHaveCount(0);
  await page
    .locator(".inspector .relationship-item summary")
    .filter({ hasText: "Lemma 2.1" })
    .click();
  await expect(
    page
      .locator(".relationship-item[open]")
      .getByText("Source-supported", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Inspect Lemma 2.1", exact: true })
    .click();
  await expect(page.locator(".object-heading h2")).toHaveText(
    "MGF of the average",
  );
  await importJSON(page, sample);
  await ready(page);
  await expect(
    page.locator(".notice,.import-errors,.layout-notice"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Fit view", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: ".local/proof-map-refined.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(remoteRequests).toEqual([]);
});

test("imports mathematical content and restores filtered objects", async ({
  page,
}) => {
  const graph = structuredClone(sample);
  graph.paper.title = "Imported paper — 数学";
  graph.nodes[0].statement = "  Let $\\alpha > 0$.\n\\[\\mathbb{E}X=\\mu\\]  ";
  await importJSON(page, graph);
  await ready(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    graph.paper.title,
  );
  await page.getByRole("checkbox", { name: "Lemma 3", exact: true }).uncheck();
  await expect(page.locator(".react-flow__node")).toHaveCount(9);
  await page.getByRole("checkbox", { name: "Lemma 3", exact: true }).check();
  await expect(page.locator(".react-flow__node")).toHaveCount(12);
  await expect(
    page.locator(".notice,.import-errors,.layout-notice"),
  ).toHaveCount(0);
});

test("rejects invalid JSON and structural errors without replacing the current graph", async ({
  page,
}) => {
  const before = await page.locator(".map-area").boundingBox();
  const importButton = page.getByRole("button", {
    name: "Import JSON",
    exact: true,
  });
  await page.getByLabel("Import graph JSON file").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"nodes":['),
  });
  await expect(importButton).toHaveText("Retry import");
  await importButton.hover();
  await expect(page.getByRole("tooltip")).toContainText("Invalid JSON syntax");
  await page.keyboard.press("Escape");
  const graph = structuredClone(sample);
  graph.nodes[1].id = graph.nodes[0].id;
  graph.edges[0].target = "missing";
  await importJSON(page, graph);
  await expect(importButton).toHaveAttribute(
    "data-tooltip",
    /Duplicate node ID/,
  );
  await expect(importButton).toHaveAttribute(
    "data-tooltip",
    /Unknown node "missing"/,
  );
  await expect(
    page.locator(".notice,.import-errors,.layout-notice,[role=alert]"),
  ).toHaveCount(0);
  expect(await page.locator(".map-area").boundingBox()).toEqual(before);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    sample.paper.title,
  );
  await expect(page.locator(".react-flow__node")).toHaveCount(12);
  await importJSON(page, sample);
  await expect(importButton).toHaveText("Import JSON");
  await expect(page.locator("#import-status")).toHaveCount(0);
});

test("layout fallback preserves the graph and a new upload retries automatically", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const OriginalWorker = window.Worker;
    window.Worker = new Proxy(OriginalWorker, {
      construct() {
        window.Worker = OriginalWorker;
        throw new Error("Synthetic layout failure");
      },
    });
  });
  await page.reload();
  await importJSON(page, sample);
  await expect(page.locator(".canvas-panel")).toHaveAttribute("data-layout-status", "fallback");
  await expect(page.locator("#layout-status")).toContainText("Objects are shown in a grid");
  await expect(page.locator(".react-flow__node")).toHaveCount(12);
  await expect(page.locator(".react-flow__edge")).toHaveCount(6);
  await importJSON(page, sample);
  await ready(page);
  await expect(page.locator(".react-flow__node")).toHaveCount(12);
});

test("supports drag-and-drop, search, isolated nodes, filters, and keyboard selection", async ({
  page,
}) => {
  const graph = structuredClone(sample);
  graph.paper.title = "Dropped graph";
  const data = await page.evaluateHandle((text) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File([text], "drop.json", { type: "application/json" }),
    );
    return transfer;
  }, JSON.stringify(graph));
  await page.locator(".app").dispatchEvent("drop", { dataTransfer: data });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Dropped graph",
  );
  await ready(page);
  await page
    .getByRole("button", { name: "A · Additional remarks 1", exact: true })
    .click();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await expect(page.locator(".react-flow__edge")).toHaveCount(0);
  await page.getByLabel("Search mathematical objects").fill("robust");
  await page.locator(".search-results button").click();
  await expect(page.locator(".object-heading h2")).toHaveText(
    "Beyond the sample mean",
  );
  await expect(page.locator(".react-flow__node")).toHaveCount(12);
  await page.getByRole("button", { name: "Hide all", exact: true }).click();
  await expect(
    page.getByText("No proof objects match this view"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reset filters", exact: true })
    .click();
  const target = page.locator('.react-flow__node[data-id="l-chernoff"]');
  await target.focus();
  await target.press("Enter");
  await expect(page.locator(".object-heading h2")).toHaveText("Chernoff bound");
});

test("lays out a cycle, self loops, and parallel edges without discarding relationships", async ({
  page,
}) => {
  const nodes = sample.nodes
    .slice(0, 2)
    .map((node) => ({ ...node, metadata: {} }));
  const base = {
    relation: "uses",
    origin: "inferred",
    verification: "unverified",
  };
  const graph = {
    ...sample,
    nodes,
    edges: [
      { ...base, id: "first", source: nodes[0].id, target: nodes[1].id },
      { ...base, id: "parallel", source: nodes[0].id, target: nodes[1].id },
      { ...base, id: "reverse", source: nodes[1].id, target: nodes[0].id },
      { ...base, id: "loop", source: nodes[0].id, target: nodes[0].id },
      { ...base, id: "loop-2", source: nodes[0].id, target: nodes[0].id },
    ],
  };
  await importJSON(page, graph);
  await ready(page);
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await expect(page.locator(".react-flow__edge")).toHaveCount(5);
  const paths = await page
    .locator(".react-flow__edge-path")
    .evaluateAll((elements) => elements.map((e) => e.getAttribute("d")));
  expect(new Set(paths).size).toBe(5);
});

test("keeps imported HTML inert, reports unsupported TeX, and supports a narrow viewport", async ({
  page,
}) => {
  const graph = structuredClone(sample);
  graph.nodes.find((n) => n.id === "t-concentration")!.statement =
    '<img src="https://invalid.test/leak" onerror="alert(1)"> $\\invalidcommand{x}$';
  await importJSON(page, graph);
  await ready(page);
  await page.locator('.react-flow__node[data-id="t-concentration"]').click();
  await expect(page.locator(".inspector img")).toHaveCount(0);
  await expect(page.locator(".math-error")).toContainText(
    "Formula could not render",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Import JSON", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await importJSON(page, sample);
  await ready(page);
  await page.screenshot({
    path: ".local/proof-map-refined-mobile.png",
    fullPage: true,
  });
});

test("starts empty and renders an uploaded map without extra controls", async ({ page }) => {
  await page.reload();
  await expect(page.getByRole("heading", { name: "Open a paper map" })).toBeVisible();
  await expect(page.locator(".react-flow")).toHaveCount(0);
  await page.screenshot({ path: ".local/upload-empty.png", fullPage: true });
  for (const name of ["Load example", "Export JSON", "Open mathematical context", "Recalculate automatic layout", "Fit view"])
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
  await importJSON(page, sample);
  await ready(page);
  await expect(page.locator(".react-flow__node")).toHaveCount(12);
  await expect(page.getByRole("heading", { name: "Open a paper map" })).toHaveCount(0);
});
