import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import sample from "../examples/statistical-estimation.graph.json";
import { MathText } from "../src/components/MathText";

const render = (text: string) =>
  renderToStaticMarkup(createElement(MathText, { text }));

describe("mathematical statement rendering", () => {
  it("renders every example statement without unsupported formulas", () => {
    for (const node of sample.nodes)
      expect(render(node.statement), node.id).not.toContain("math-error");
  });
  it("renders all four documented delimiters with accessible MathML", () => {
    const html = render("$x$ and \\(y\\)\n$$z^2$$\n\\[\\alpha\\]");
    expect(html.match(/class="katex"/g)).toHaveLength(4);
    expect(html.match(/class="katex-mathml"/g)).toHaveLength(4);
    expect(html.match(/class="math-display"/g)).toHaveLength(2);
  });
  it("keeps HTML inert and rejects TeX attempts to insert external images or links", () => {
    const html = render(
      '<img src="https://invalid.test/leak"> $\\includegraphics{https://invalid.test/leak}$ $\\href{https://invalid.test}{click}$',
    );
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<a ");
    expect(html).toContain("&lt;img");
  });
  it("retains original invalid TeX and reports rendering failure", () => {
    const html = render("Original $\\notARealMacro{q}$ remains.");
    expect(html).toContain("$\\notARealMacro{q}$");
    expect(html).toContain("Formula could not render");
  });
});
