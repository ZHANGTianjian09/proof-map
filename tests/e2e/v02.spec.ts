import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import sample from "../../examples/statistical-estimation.graph.json" with { type: "json" };
import { NODE_TYPES } from "../../src/graph/types";

async function ready(page: Page) {
  await expect(page.locator(".canvas-panel")).toHaveAttribute("data-layout-status", "ready");
  await page.waitForTimeout(450);
}

async function importGraph(page: Page, graph: unknown) {
  await page.getByLabel("Import graph JSON file").setInputFiles({
    name: "v02.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(graph)),
  });
  await expect(
    page.getByRole("button", { name: "Import JSON", exact: true }),
  ).toBeEnabled();
  await ready(page);
}
async function search(page: Page, query: string) {
  const input = page.getByRole("combobox", {
    name: "Search mathematical objects",
  });
  await input.fill(query);
  await input.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Node inspector" }),
  ).toBeVisible();
  await page.waitForTimeout(450);
}
async function unobscured(page: Page, id: string) {
  const node = (await page
    .locator(`.react-flow__node[data-id="${id}"]`)
    .boundingBox())!;
  const panel = (await page.locator(".floating-panel").boundingBox())!;
  const area = (await page.locator(".map-area").boundingBox())!;
  expect(node.x).toBeGreaterThanOrEqual(area.x);
  expect(node.y).toBeGreaterThanOrEqual(area.y);
  expect(
    node.x + node.width <= panel.x || node.y + node.height <= panel.y,
  ).toBe(true);
}
test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.getByLabel("Import graph JSON file").setInputFiles({
    name: "sample.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(sample)),
  });
  await ready(page);
});

test("global search navigates without filtering and keeps selection after inspector dismissal", async ({
  page,
}) => {
  await expect(page.getByLabel("Search mathematical objects")).toHaveCount(1);
  await page.keyboard.press("Control+k");
  const input = page.getByRole("combobox", {
    name: "Search mathematical objects",
  });
  const suggestions = page.getByRole("listbox");
  await expect(input).toBeFocused();
  await input.fill("thm 2.3");
  await expect(page.locator(".react-flow__node")).toHaveCount(12);
  await expect(suggestions.getByRole("option").first()).toContainText(
    "Theorem 2.3",
  );
  await input.press("Enter");
  await page.waitForTimeout(450);
  await unobscured(page, "t-concentration");
  const selected = page.locator(
    '.react-flow__node[data-id="t-concentration"] .math-node',
  );
  await expect(selected).toHaveClass(/is-selected/);
  await page.getByRole("button", { name: "Close inspector" }).click();
  await expect(
    page.getByRole("dialog", { name: "Node inspector" }),
  ).toHaveCount(0);
  await expect(selected).toHaveClass(/is-selected/);
  await page.keyboard.press("Escape");
  await expect(selected).not.toHaveClass(/is-selected/);
  await search(page, "thm 2.3");
  await page.screenshot({
    path: ".local/v02-search-inspector.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(selected).toHaveClass(/is-selected/);
  await page.keyboard.press("Meta+k");
  await expect(input).toBeFocused();
  await input.fill("lemma");
  const first = await suggestions
    .getByRole("option", { selected: true })
    .textContent();
  await input.press("ArrowDown");
  expect(
    await suggestions.getByRole("option", { selected: true }).textContent(),
  ).not.toBe(first);
  await input.press("ArrowUp");
  expect(
    await suggestions.getByRole("option", { selected: true }).textContent(),
  ).toBe(first);
  await input.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
});

test("search inspects hidden global context, reveals it explicitly, and retains all objects", async ({
  page,
}) => {
  await search(page, "d-mean");
  await expect(page.locator('.react-flow__node[data-id="d-mean"]')).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("dialog", { name: "Node inspector" }),
  ).toContainText("Global context · hidden from the map");
  await expect(page.locator(".statement-section")).toContainText("sample mean");
  await page.getByRole("button", { name: "Reveal on map" }).click();
  await ready(page);
  await unobscured(page, "d-mean");
  await expect(page.locator(".react-flow__node")).toHaveCount(
    sample.nodes.length,
  );

});

test("section fills, six border families, white controls, and neutral selection survive interaction", async ({
  page,
}) => {
  const nodes = NODE_TYPES.map((type, i) => ({
    ...sample.nodes[0],
    id: `style-${i}`,
    type,
    label: `${type} ${i}`,
    number: `${i}`,
    title: `A mathematical ${type}`,
    section: i < 5 ? "s1" : "a",
    metadata: {},
  }));
  await importGraph(page, { ...sample, nodes, edges: [] });
  await expect(page.locator(".react-flow__node")).toHaveCount(10);
  const styles = await page.locator(".math-node").evaluateAll((cards) =>
    cards.map((card) => {
      const s = getComputedStyle(card);
      return {
        fill: s.backgroundColor,
        border: s.borderTopStyle,
        top: s.borderTopWidth,
        left: s.borderLeftWidth,
        right: s.borderRightWidth,
      };
    }),
  );
  expect(styles[0].border).toBe("double");
  expect(styles[1].left).toBe("7px");
  expect(styles[2].right).toBe("3px");
  expect(styles[3].top).toBe("7px");
  expect(styles[4].border).toBe("dotted");
  expect(styles[5].border).toBe("dotted");
  expect(styles[6].border).toBe("dashed");
  expect(styles[7].border).toBe("dashed");
  expect(styles[8].border).toBe("dashed");
  expect(styles[9].left).toBe("7px");
  expect(styles.slice(0, 5).every((s) => s.fill === styles[0].fill)).toBe(true);
  expect(styles[5].fill).not.toBe(styles[0].fill);
  for (const selector of [
    "body",
    ".app-header",
    ".paper-nav",
    ".map-area",
    ".canvas-toolbar",
    ".global-search .search-box",
    ".header-actions .button",
  ]) {
    const fills = await page
      .locator(selector)
      .evaluateAll((elements) =>
        elements.map((el) => getComputedStyle(el).backgroundColor),
      );
    expect(fills.every((fill) => fill === "rgb(255, 255, 255)")).toBe(true);
  }
  await page.getByRole("button", { name: "Import JSON", exact: true }).hover();
  await expect(
    page.getByRole("button", { name: "Import JSON", exact: true }),
  ).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await search(page, "style-0");
  const selected = page.locator('[data-id="style-0"] .math-node');
  await expect(selected).toHaveCSS("background-color", styles[0].fill);
  await expect(selected).toHaveCSS("border-top-style", "double");
  await expect(selected).toHaveCSS("outline-color", "rgb(82, 82, 82)");
  await page.screenshot({
    path: ".local/v02-border-families.png",
    fullPage: true,
  });
});

test("300 synthetic objects remain searchable with bounded suggestions and readable focus", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const nodes = Array.from({ length: 300 }, (_, i) => ({
    ...sample.nodes[0],
    id: `large-${i}`,
    type: "lemma",
    label: `Lemma ${i}`,
    number: String(i),
    title: `Synthetic bound ${i}`,
    metadata: {},
  }));
  const edges = nodes.flatMap((node, i) =>
    i % 10 < 8
      ? [
          {
            id: `e${i}`,
            source: node.id,
            target: nodes[i + 1].id,
            relation: "uses",
            origin: "inferred",
            verification: "unverified",
          },
        ]
      : [],
  );
  const graph = { ...sample, nodes, edges };
  await importGraph(page, graph);
  await expect(page.locator(".react-flow__node")).toHaveCount(300);
  await expect(page.locator(".react-flow__edge")).toHaveCount(240);
  await page.getByRole("combobox").fill("lemma");
  await expect(page.getByRole("option")).toHaveCount(8);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("option").first()).toContainText("Lemma 8");
  await search(page, "large-299");
  await unobscured(page, "large-299");
  await expect(page.locator(".node-title").last()).toContainText(
    "Synthetic bound 299",
  );

  await page.screenshot({
    path: ".local/v02-large-graph-focus.png",
    fullPage: true,
  });
});

test("mobile search places the selected object above the floating inspector", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await importGraph(page, sample);
  await ready(page);
  await search(page, "thm 2.3");
  await unobscured(page, "t-concentration");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".local/v02-mobile-search.png",
    fullPage: true,
  });
});

test("PDF retains section fills and border families while excluding selection effects", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const nodes = [sample.nodes[6], sample.nodes[4], sample.nodes[1]].map(
    (node, i) => ({
      ...node,
      id: `pdf-${i}`,
      section: "s1",
      metadata: {},
      title: i === 0 ? "A bound for $\\alpha$" : node.title,
    }),
  );
  await importGraph(page, {
    ...sample,
    nodes,
    edges: [
      {
        id: "pdf-edge",
        source: "pdf-1",
        target: "pdf-0",
        relation: "uses",
        origin: "inferred",
        verification: "unverified",
      },
    ],
  });
  async function download(path: string) {
    const pending = page.waitForEvent("download", { timeout: 90_000 });
    await page
      .getByRole("button", { name: "Download PDF", exact: true })
      .click();
    const file = await pending;
    await file.saveAs(path);
    return readFile(path);
  }
  const first = await download(".local/v02-unselected.pdf");
  await search(page, "pdf-0");
  const second = await download(".local/v02-selected.pdf");
  const images = (pdf: Buffer) =>
    [
      ...pdf
        .toString("latin1")
        .matchAll(
          /\/Subtype\s*\/Image[\s\S]*?stream\r?\n([\s\S]*?)\r?\nendstream/g,
        ),
    ].map((match) => match[1]);
  expect(images(first).length).toBeGreaterThan(0);
  expect(images(first)).toEqual(images(second));
  await expect(page.locator('[data-id="pdf-0"] .math-node')).toHaveClass(
    /is-selected/,
  );
});
