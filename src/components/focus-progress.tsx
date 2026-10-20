"use client";

import { lockFocus } from "@/lib/actions";
import { daysAgo } from "@/lib/format";
import type { FocusCheck } from "@/lib/progress";
import { roughStrokes } from "@/lib/recommend";
import { categoryLabel, type Category } from "@/lib/types";
import { Button } from "@/components/ui";

// What the latest round says about the focus, so the card never quotes an old round.
export function FocusLatest({ check }: { check: FocusCheck }) {
  const { round, pay, now } = check;
  const text = pay?.text ?? now?.reason;
  if (!text) return null;
  return (
    <p className="text-body">
      <span className="font-semibold">
        Latest round, {round.courseName} {daysAgo(round.startedAt)}:
      </span>{" "}
      {text}
    </p>
  );
}

// Once the focus stops costing strokes, or another area costs more, offer to move on.
// `headingId`: where keyboard focus goes after switching, since the button goes away.
export function FocusSuggestion({ check, focus, headingId }: { check: FocusCheck; focus: Category; headingId: string }) {
  const { next, beaten, round } = check;
  if (!next && !beaten) return null;
  const name = categoryLabel[focus];
  return (
    <div className="flex flex-col gap-3 rounded-md border-2 border-green bg-surface p-3">
      <p className="text-body">
        {beaten ? `${name} cost you less than a stroke last round. ` : `${name} wasn't your biggest leak last round. `}
        {next ? (
          <>
            It points to <span className="font-semibold">{categoryLabel[next.category].toLowerCase()}</span> next ({roughStrokes(next.strokes)}).
          </>
        ) : (
          "Nothing else stood out, so keep sharpening it or pick a new area."
        )}
      </p>
      {next && (
        <Button
          size="sm"
          className="w-fit"
          onClick={() => {
            lockFocus(next.category, next.reason, round.id);
            requestAnimationFrame(() => document.getElementById(headingId)?.focus());
          }}
        >
          Switch to {categoryLabel[next.category].toLowerCase()}
        </Button>
      )}
    </div>
  );
}
