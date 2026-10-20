"use client";

import { useEffect, useRef } from "react";

// When one control replaces another (Delete → "Delete? Delete / Keep", Change focus →
// the picker), keyboard and screen-reader focus would fall back to the page. This moves
// it to `whenOpen` after opening and back to `whenClosed` after closing. The first
// render is skipped so pages never steal focus on load.
export function useFocusSwap(open: boolean) {
  const whenOpen = useRef<HTMLButtonElement | null>(null);
  const whenClosed = useRef<HTMLButtonElement | null>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    (open ? whenOpen : whenClosed).current?.focus();
  }, [open]);
  return { whenOpen, whenClosed };
}
