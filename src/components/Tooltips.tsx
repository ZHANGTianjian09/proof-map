import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Shared tooltips keep the original buttons and toolbar layout intact. */
export function Tooltips() {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<{
    element: HTMLElement;
    text: string;
  } | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let current: HTMLElement | null = null;
    const cancel = () => clearTimeout(timer);
    const hide = () => {
      cancel();
      current = null;
      setActive(null);
    };
    const show = (element: HTMLElement, delay: number) => {
      cancel();
      if (current === element && ref.current) return;
      setActive(null);
      current = element;
      timer = setTimeout(() => {
        const text = element.dataset.tooltip;
        if (element.isConnected && text) setActive({ element, text });
      }, delay);
    };
    const trigger = (target: EventTarget | null) =>
      target instanceof Element
        ? target.closest<HTMLElement>("[data-tooltip]")
        : null;
    const over = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (event.target instanceof Node && ref.current?.contains(event.target)) {
        cancel();
        return;
      }
      const element = trigger(event.target);
      if (element) show(element, 350);
    };
    const out = (event: PointerEvent) => {
      const next = event.relatedTarget;
      if (
        next instanceof Node &&
        (current?.contains(next) || ref.current?.contains(next))
      )
        return;
      if (current?.matches(":focus-visible")) return;
      cancel();
      timer = setTimeout(hide, 100);
    };
    const focus = (event: FocusEvent) => {
      const element = trigger(event.target);
      if (element?.matches(":focus-visible")) show(element, 0);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const visible = !!ref.current;
        hide();
        if (visible) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", hide);
    document.addEventListener("pointerdown", hide);
    document.addEventListener("keydown", key, true);
    document.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      cancel();
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("pointerdown", hide);
      document.removeEventListener("keydown", key, true);
      document.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  useLayoutEffect(() => {
    if (!active || !ref.current) return;
    const anchor = active.element.getBoundingClientRect();
    const box = ref.current.getBoundingClientRect();
    const margin = 8;
    setPosition({
      left: Math.max(
        margin,
        Math.min(
          anchor.x + anchor.width / 2 - box.width / 2,
          window.innerWidth - box.width - margin,
        ),
      ),
      top:
        anchor.bottom + box.height + margin * 2 <= window.innerHeight
          ? anchor.bottom + margin
          : Math.max(margin, anchor.top - box.height - margin),
    });
    const descriptions =
      active.element
        .getAttribute("aria-describedby")
        ?.split(/\s+/)
        .filter(Boolean) ?? [];
    active.element.setAttribute(
      "aria-describedby",
      [...descriptions, id].join(" "),
    );
    return () => {
      const remaining =
        active.element
          .getAttribute("aria-describedby")
          ?.split(/\s+/)
          .filter((value) => value && value !== id) ?? [];
      if (remaining.length)
        active.element.setAttribute("aria-describedby", remaining.join(" "));
      else active.element.removeAttribute("aria-describedby");
    };
  }, [active, id]);

  return active
    ? createPortal(
        <div
          id={id}
          ref={ref}
          role="tooltip"
          className="control-tooltip"
          style={position}
        >
          {active.text}
        </div>,
        document.body,
      )
    : null;
}
