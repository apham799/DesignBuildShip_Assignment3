"use client";

import type { ReactNode } from "react";
import { dismissTip } from "@/lib/actions";
import { useStore } from "@/lib/storage";

// A one-time pointer shown the first time someone reaches a screen. It explains the
// screen in one or two sentences, next to the thing it's about, then goes away.
export function Tip({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const store = useStore();
  if (!store || store.seenTips.includes(id)) return null;
  return (
    <aside aria-label={`Tip: ${title}`} className="flex gap-3 rounded-lg border-2 border-brass/60 bg-surface p-4 shadow-card">
      <svg viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0 text-brass" aria-hidden fill="currentColor">
        <rect x="6" y="2" width="1.8" height="16" />
        <path d="M7.8 2.6 L16 5.8 L7.8 9 Z" />
      </svg>
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-body font-semibold">{title}</p>
        <div className="text-body">{children}</div>
        <button
          type="button"
          onClick={() => dismissTip(id)}
          className="mt-1 w-fit rounded-sm text-body font-semibold text-green underline decoration-green/40 decoration-2 underline-offset-[3px] hover:decoration-green"
        >
          Got it
        </button>
      </div>
    </aside>
  );
}
