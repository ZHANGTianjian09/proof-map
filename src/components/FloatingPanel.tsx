import { useEffect, useRef, type ReactNode } from "react";
import { inspectorBounds } from "../graph/inspector-layout";

export function FloatingPanel({
  area,
  children,
  onClose,
  selectionKey,
}: {
  area: { width: number; height: number };
  children: ReactNode;
  onClose: () => void;
  selectionKey: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const panelStyle = inspectorBounds(area);
  useEffect(() => {
    const activeElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        // Returning to search would immediately reopen its suggestions. Return to
        // the selected card, or Context when the inspected object is hidden.
        const returnTarget =
          activeElement?.getAttribute("role") === "combobox"
            ? (document.querySelector<HTMLElement>(
                ".react-flow__node.selected",
              ) ?? document.querySelector<HTMLElement>('[aria-label="Toggle all relationship labels"]'))
            : activeElement;
        returnTarget?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", handleKey);
    // A nonmodal inspector gets keyboard focus without changing the viewport.
    ref.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose, selectionKey]);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="floating-panel nodrag nopan nowheel"
      style={panelStyle}
      data-side="right"
    >
      {children}
    </div>
  );
}
