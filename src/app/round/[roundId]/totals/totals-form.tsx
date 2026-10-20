"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { saveTotals } from "@/lib/actions";
import { hasErrors, wholeNumber, type Errors } from "@/lib/forms";
import { playedHoles } from "@/lib/recommend";
import type { Round } from "@/lib/types";
import { Alert, Button, Card, ChoiceGroup, Column, Columns, focusFirstError, Page, PageHeader, TextInput } from "@/components/ui";
import { RoundGate } from "../round-gate";

type Field = "strokes" | "putts" | "fairways" | "greens" | "penalties";

export function TotalsScreen() {
  return <RoundGate>{(round) => <TotalsForm key={round.id} round={round} />}</RoundGate>;
}

function TotalsForm({ round }: { round: Round }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [holeCount, setHoleCount] = useState(String(round.holes.length));
  // Editing a round saved as totals starts from what was saved.
  const saved = round.mode === "totals" ? round.totals : undefined;
  const [values, setValues] = useState<Record<Field, string>>(
    saved
      ? { strokes: String(saved.strokes), putts: String(saved.putts), fairways: String(saved.fairwaysHit), greens: String(saved.greensHit), penalties: String(saved.penalties) }
      : { strokes: "", putts: "", fairways: "", greens: "", penalties: "" },
  );
  const [errors, setErrors] = useState<Errors<Field>>({});

  const holes = round.holes.slice(0, Number(holeCount));
  const n = holes.length;
  const fairwaysPossible = holes.filter((h) => h.par !== 3).length;
  const par = holes.reduce((s, h) => s + h.par, 0);
  const tracked = playedHoles(round).length;
  // Already saved as totals: this is an edit, not a switch away from hole-by-hole entry.
  const editingTotals = round.mode === "totals";

  const field = (name: Field) => ({
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [name]: e.target.value })),
    error: errors[name],
    inputMode: "numeric" as const,
    autoComplete: "off",
  });

  // Limits depend on how many holes were played, so validate takes the count.
  function validate(count = Number(holeCount)): Errors<Field> {
    const holes = round.holes.slice(0, count);
    const n = holes.length;
    const fairwaysPossible = holes.filter((h) => h.par !== 3).length;
    const strokes = wholeNumber(values.strokes);
    const putts = wholeNumber(values.putts);
    const fairways = values.fairways.trim() ? wholeNumber(values.fairways) : 0;
    const greens = values.greens.trim() ? wholeNumber(values.greens) : 0;
    const penalties = values.penalties.trim() ? wholeNumber(values.penalties) : 0;
    const e: Errors<Field> = {};

    if (!values.strokes.trim()) e.strokes = "Enter your total score.";
    else if (strokes === null) e.strokes = "Enter your score as a whole number, like 92.";
    else if (strokes < n || strokes > n * 12) e.strokes = `Enter a score between ${n} and ${n * 12} for ${n} holes.`;

    if (!values.putts.trim()) e.putts = "Enter your total putts.";
    else if (putts === null) e.putts = "Enter your putts as a whole number, like 34.";
    else if (strokes !== null && putts >= strokes) e.putts = "Putts can't be more than your score. Check your putts.";
    else if (putts > n * 6) e.putts = `Enter ${n * 6} putts or fewer for ${n} holes.`;

    if (fairways === null) e.fairways = "Enter fairways hit as a whole number, or leave it blank.";
    else if (fairways > fairwaysPossible) e.fairways = `Fairways hit can't be more than ${fairwaysPossible}, the par 4s and 5s you played.`;

    if (greens === null) e.greens = "Enter greens hit as a whole number, or leave it blank.";
    else if (greens > n) e.greens = `Greens hit can't be more than ${n}, the holes you played.`;

    if (penalties === null) e.penalties = "Enter penalty strokes as a whole number, or leave it blank.";
    else if (strokes !== null && penalties >= strokes) e.penalties = "Penalty strokes can't be more than your score.";
    return e;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (hasErrors(e)) {
      requestAnimationFrame(() => focusFirstError(formRef.current));
      return;
    }
    saveTotals(
      round.id,
      {
        strokes: wholeNumber(values.strokes)!,
        putts: wholeNumber(values.putts)!,
        fairwaysHit: wholeNumber(values.fairways) ?? 0,
        greensHit: wholeNumber(values.greens) ?? 0,
        penalties: wholeNumber(values.penalties) ?? 0,
      },
      n,
    );
    router.push(`/round/${round.id}/summary`);
  }

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <Page>
      <Columns>
        <Column span={5}>
          <PageHeader
            title={editingTotals ? "Edit totals" : "Enter your totals"}
            step={round.courseName}
            // A totals round has no holes to go back to; return to its summary instead.
            back={
              editingTotals
                ? { href: `/round/${round.id}/summary`, label: "Back to the summary" }
                : { href: `/round/${round.id}/hole/${round.currentHole}`, label: `Back to hole ${round.currentHole}` }
            }
            description={editingTotals ? `Editing totals for ${round.holes.length} holes. Saving updates the summary.` : "For when you didn't track every hole. You'll still get a practice focus."}
          />
          <Card tone="cream" className="hidden flex-col gap-2 lg:flex">
            <h2 className="text-heading">What counts</h2>
            <dl className="flex flex-col gap-2 text-body">
              <div>
                <dt className="font-semibold">Fairway hit</dt>
                <dd>Your tee shot on a par 4 or 5 finished in the fairway.</dd>
              </div>
              <div>
                <dt className="font-semibold">Green in regulation</dt>
                <dd>On the green in par minus two: 1 shot on a par 3, 2 on a par 4, 3 on a par 5.</dd>
              </div>
              <div>
                <dt className="font-semibold">Penalty strokes</dt>
                <dd>Out of bounds, water, lost ball, unplayable lie.</dd>
              </div>
            </dl>
          </Card>
        </Column>
        <Column span={7}>
          {!editingTotals && tracked > 0 && <Alert title={`You tracked ${tracked} ${tracked === 1 ? "hole" : "holes"} one by one`}>Saving totals replaces those holes with these numbers.</Alert>}
          {errorCount > 1 && (
            <Alert tone="error" title={`${errorCount} fields need fixing`}>
              Each one says what to change.
            </Alert>
          )}

          <form ref={formRef} noValidate onSubmit={submit} className="flex max-w-xl flex-col gap-5">
            {round.holes.length === 18 && (
              <ChoiceGroup
                legend="Holes played"
                required
                name="holes"
                columns={2}
                value={holeCount}
                onChange={(v) => {
                  setHoleCount(v);
                  // Errors already on screen quote hole-count limits; recheck them against the new count.
                  if (hasErrors(errors)) setErrors(validate(Number(v)));
                }}
                options={[
                  { value: "9", label: "Front 9", description: `Par ${round.holes.slice(0, 9).reduce((s, h) => s + h.par, 0)}` },
                  { value: "18", label: "All 18", description: `Par ${round.holes.reduce((s, h) => s + h.par, 0)}` },
                ]}
              />
            )}
            <TextInput label="Total score" required hint={`Par is ${par}.`} {...field("strokes")} />
            <TextInput label="Total putts" required {...field("putts")} />
            <TextInput label="Fairways hit" optional hint={`Out of ${fairwaysPossible} par 4s and 5s.`} {...field("fairways")} />
            <TextInput label="Greens in regulation" optional hint={`Out of ${n} holes.`} {...field("greens")} />
            <TextInput label="Penalty strokes" optional {...field("penalties")} />
            <Button type="submit" size="lg" block>
              Save round
            </Button>
          </form>
        </Column>
      </Columns>
    </Page>
  );
}
