import { useMemo } from "react";
import katex from "katex";

/** Plain text plus delimited TeX. Input HTML is always escaped by React. */
export function MathText({ text }: { text: string }) {
  const fragments = useMemo(() => {
    const pattern =
      /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<!\\)\$(?!\$)(?:\\.|[^$\\])+?(?<!\\)\$)/g;
    return text.split(pattern).map((part, i) => {
      const display = part.startsWith("$$") || part.startsWith("\\[");
      const math =
        display ||
        part.startsWith("\\(") ||
        (part.startsWith("$") && part.endsWith("$"));
      if (!math) return <span key={i}>{part}</span>;
      const tex = part.slice(
        display || part.startsWith("\\(") ? 2 : 1,
        display || part.startsWith("\\(") ? -2 : -1,
      );
      try {
        const html = katex.renderToString(tex, {
          displayMode: display,
          throwOnError: true,
          trust: false,
          maxExpand: 1000,
          maxSize: 20,
          output: "htmlAndMathml",
          strict: "ignore",
        });
        return (
          <span
            key={i}
            className={display ? "math-display" : "math-inline"}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch {
        return (
          <span
            key={i}
            className="math-error"
            title="This formula could not be rendered. The original LaTeX is shown."
          >
            {part}
            <small>Formula could not render</small>
          </span>
        );
      }
    });
  }, [text]);
  return <div className="math-copy">{fragments}</div>;
}
