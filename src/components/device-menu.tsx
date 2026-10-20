"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { getCourse } from "@/data/courses";
import { loadSampleWeek } from "@/lib/actions";
import { resetStore } from "@/lib/storage";
import { Button, cx, useFocusSwap } from "@/components/ui";

// A small corner menu for trying the first visit and the return visit:
// erase this device's data, or fill it with a sample week. Refreshing never erases.
export function DeviceMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const { whenOpen, whenClosed } = useFocusSwap(confirming);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    setConfirming(false);
    toggleRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      setConfirming(false);
      toggleRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="fixed bottom-20 right-3 z-30 sm:bottom-4 sm:right-4">
      {open && (
        <div id={panelId} ref={panelRef} role="dialog" aria-label="Data on this device" className="absolute bottom-full right-0 mb-2 w-72 rounded-lg border border-rule bg-surface p-4 shadow-lift">
          <p className="text-body font-semibold">Data on this device</p>
          <p className="mt-1 text-label font-normal text-muted">Refreshing keeps everything. Use these to see the first visit or a return visit.</p>
          <div className="mt-3 flex flex-col gap-2">
            {confirming ? (
              <div role="group" aria-labelledby={`${panelId}-q`} className="flex flex-col gap-2">
                <p id={`${panelId}-q`} className="text-body">
                  Erase all rounds, practice and notes on this device?
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      resetStore();
                      close();
                      router.push("/");
                    }}
                  >
                    Erase everything
                  </Button>
                  <Button ref={whenOpen} size="sm" variant="secondary" onClick={() => setConfirming(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button ref={whenClosed} size="sm" variant="danger" block onClick={() => setConfirming(true)}>
                  Reset to a first visit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  block
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    const course = await getCourse("jackson-park").catch(() => undefined);
                    if (course) loadSampleWeek(course);
                    setBusy(false);
                    close();
                    router.push("/");
                  }}
                >
                  {busy ? "Loading…" : "Load a sample week"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label="Reset or load sample data"
        onClick={() => (open ? close() : setOpen(true))}
        className={cx(
          "flex h-9 items-center justify-center gap-1.5 rounded-full border border-rule bg-surface/95 px-3 text-label text-ink shadow-card transition-colors hover:border-ink",
          open && "border-ink",
        )}
      >
        <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M2.5 8 A5.5 5.5 0 1 0 4.2 4" />
          <path d="M2.5 2.5 V5 H5" />
        </svg>
        <span aria-hidden>Reset</span>
      </button>
    </div>
  );
}
