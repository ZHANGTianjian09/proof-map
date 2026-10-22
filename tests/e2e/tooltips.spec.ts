import sample from "../../examples/statistical-estimation.graph.json" with { type: "json" };
import { expect, test } from "@playwright/test";

test("toolbar tooltips support hover, keyboard, dismissal, and narrow screens", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("Import graph JSON file").setInputFiles({
    name: "sample.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(sample)),
  });
  const pdf = page.getByRole("button", { name: "Download PDF", exact: true });
  await expect(pdf).toBeEnabled();
  await pdf.hover();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toHaveText("Download the visible map as PDF");
  expect(await pdf.getAttribute("aria-describedby")).toContain(
    await tooltip.getAttribute("id"),
  );
  await page.screenshot({
    path: ".local/tooltips/desktop.png",
    clip: { x: 0, y: 0, width: 1512, height: 210 },
  });
  // Moving from the trigger onto its tooltip must not make it disappear.
  await tooltip.hover();
  await page.waitForTimeout(200);
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);

  await pdf.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(tooltip).toHaveText("Download the visible map as PDF");
  await expect(pdf).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
  await expect(pdf).not.toHaveAttribute("aria-describedby");

  await page.getByRole("button", { name: "Collapse paper navigator" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Import JSON", exact: true }).hover();
  await expect(tooltip).toHaveText("Import a paper map from a JSON file");
  const bounds = (await tooltip.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(8);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(382);
  await page.screenshot({
    path: ".local/tooltips/mobile.png",
    clip: { x: 0, y: 0, width: 390, height: 250 },
  });
  await page.getByRole("button", { name: "Edge legend", exact: true }).click();
  await expect(tooltip).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Edge legend" })).toBeVisible();
});
