"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { dismissTip } from "@/lib/actions";
import { useStore } from "@/lib/storage";

const LEAVE_MS = 250;
const FOCUSABLE = "a, button, input, select, textarea";

// A one-time pointer shown the first time someone reaches a screen. It explains the
// screen in one or two sentences, next to the thing it's about, then goes away.
// "Got it" folds it away (height, opacity, and the gap it leaves) before it's removed;
// with reduced motion it's removed at once.
export function Tip({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const store = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState<CSSProperties | null>(null);
  if (!store || store.seenTips.includes(id)) return null;

  const dismiss = () => {
    const el = ref.current;
    // Keyboard focus moves on to the next control instead of vanishing with the tip.
    const next = el?.nextElementSibling;
    const focusNext = () => {
      const target = next?.matches(FOCUSABLE) ? next : next?.querySelector(FOCUSABLE);
      if (target instanceof HTMLElement) target.focus();
    };
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      focusNext();
      return dismissTip(id);
    }
    // Close the flex/grid gap next to the tip too, so nothing jumps when it's removed.
    const gap = parseFloat(getComputedStyle(el.parentElement!).rowGap) || 0;
    setLeaving(el.nextElementSibling ? { marginBottom: -gap } : { marginTop: -gap });
    setTimeout(() => {
      focusNext();
      dismissTip(id);
    }, LEAVE_MS);
  };

  return (
    <div
      ref={ref}
      style={leaving ?? undefined}
      className={`grid transition-[grid-template-rows,opacity,margin] duration-[250ms] ease-out ${leaving ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
    >
      <aside aria-label={`Tip: ${title}`} className="min-h-0 overflow-hidden">
        <div className="flex gap-3 rounded-lg border-2 border-brass/60 bg-surface p-4">
          <svg viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0 text-brass" aria-hidden fill="currentColor">
            <rect x="6" y="2" width="1.8" height="16" />
            <path d="M7.8 2.6 L16 5.8 L7.8 9 Z" />
          </svg>
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-body font-semibold">{title}</p>
            <div className="text-body">{children}</div>
            <button
              type="button"
              onClick={dismiss}
              disabled={Boolean(leaving)}
              className="mt-1 w-fit rounded-sm text-body font-semibold text-green underline decoration-green/40 decoration-2 underline-offset-[3px] hover:decoration-green"
            >
              Got it
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
