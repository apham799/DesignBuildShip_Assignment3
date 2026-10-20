"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { buildPlan, challenges, drills } from "@/data/drills";
import { logPractice } from "@/lib/actions";
import { hasErrors, wholeNumber, type Errors } from "@/lib/forms";
import { useStore } from "@/lib/storage";
import type { Category, PracticeSession } from "@/lib/types";
import { Alert, Button, Checkbox, ChoiceGroup, focusFirstError, LoadingCard, PageHeader, TextArea, TextInput } from "@/components/ui";

type FocusChoice = Category | "mixed";
type Field = "focus" | "minutes" | "balls" | "challenge" | "feel";

const focusOptions: { value: FocusChoice; label: string }[] = [
  { value: "driving", label: "Driving" },
  { value: "approach", label: "Approach" },
  { value: "shortGame", label: "Short game" },
  { value: "putting", label: "Putting" },
  { value: "mixed", label: "Mixed bucket" },
];

const feelOptions = [
  { value: "1", label: "1", description: "Rough" },
  { value: "2", label: "2", description: "Meh" },
  { value: "3", label: "3", description: "OK" },
  { value: "4", label: "4", description: "Good" },
  { value: "5", label: "5", description: "Great" },
];

const isFocus = (v: string | null): v is FocusChoice => focusOptions.some((o) => o.value === v);

export function PracticeLogScreen() {
  const store = useStore();
  const params = useSearchParams();
  if (!store) return <LoadingCard label="Loading form…" />;
  const fromQuery = params.get("focus");
  const focus = isFocus(fromQuery) ? fromQuery : store.focus?.category;
  const minutes = wholeNumber(params.get("minutes") ?? "");
  return <PracticeLogForm initialFocus={focus} initialMinutes={minutes ?? undefined} />;
}

function PracticeLogForm({ initialFocus, initialMinutes }: { initialFocus?: FocusChoice; initialMinutes?: number }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const planDrills = (f?: FocusChoice) => (f && initialMinutes && [15, 30, 60].includes(initialMinutes) ? buildPlan(f, initialMinutes as 15 | 30 | 60).blocks.flatMap((b) => (b.drillId ? [b.drillId] : [])) : []);

  const [focus, setFocus] = useState<FocusChoice | undefined>(initialFocus);
  const [minutes, setMinutes] = useState(initialMinutes ? String(initialMinutes) : "");
  const [balls, setBalls] = useState("");
  const [done, setDone] = useState<string[]>(planDrills(initialFocus));
  const [challenge, setChallenge] = useState("");
  const [feel, setFeel] = useState<string>();
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Errors<Field>>({});

  const challengeDef = focus ? challenges[focus] : undefined;
  const drillChoices = focus === "mixed" ? drills.filter((d) => ["distance-ladder", "fairway-gates", "lag-ladder"].includes(d.id)) : drills.filter((d) => d.category === focus);

  function validate(): Errors<Field> {
    const e: Errors<Field> = {};
    if (!focus) e.focus = "Choose what you worked on.";
    const m = wholeNumber(minutes);
    if (!minutes.trim()) e.minutes = "Enter how long you practiced, in minutes.";
    else if (m === null || m < 1 || m > 300) e.minutes = "Enter minutes as a whole number from 1 to 300.";
    if (balls.trim()) {
      const b = wholeNumber(balls);
      if (b === null || b > 500) e.balls = "Enter a number of balls from 0 to 500, or leave it blank.";
    }
    if (challenge.trim() && challengeDef) {
      const c = wholeNumber(challenge);
      if (c === null || c > challengeDef.outOf) e.challenge = `Enter a challenge score from 0 to ${challengeDef.outOf}, or leave it blank.`;
    }
    if (!feel) e.feel = "Choose how the session felt.";
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
    const session: Omit<PracticeSession, "id"> = {
      date: new Date().toISOString(),
      focus: focus!,
      minutes: wholeNumber(minutes)!,
      balls: wholeNumber(balls) ?? undefined,
      drillIds: done.filter((id) => drillChoices.some((d) => d.id === id)),
      challengeId: challenge.trim() ? challengeDef?.id : undefined,
      challengeScore: challenge.trim() ? wholeNumber(challenge)! : undefined,
      challengeOutOf: challenge.trim() ? challengeDef?.outOf : undefined,
      feel: Number(feel) as PracticeSession["feel"],
      notes: notes.trim() || undefined,
    };
    logPractice(session);
    router.push("/?saved=practice");
  }

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Log your practice" back={{ href: "/practice", label: "Practice plan" }} description="A minute now means you'll know what worked next time." />
      {errorCount > 1 && (
        <Alert tone="error" title={`${errorCount} fields need fixing`}>
          Each one says what to change.
        </Alert>
      )}
      <form ref={formRef} noValidate onSubmit={submit} className="flex max-w-md flex-col gap-6">
        <ChoiceGroup
          legend="What did you work on?"
          name="focus"
          columns={2}
          value={focus}
          onChange={(v) => {
            setFocus(v as FocusChoice);
            setDone(planDrills(v as FocusChoice));
            setChallenge("");
          }}
          options={focusOptions}
          error={errors.focus}
          hint={initialFocus ? "Filled in from your plan." : undefined}
        />
        <TextInput label="Minutes" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} error={errors.minutes} autoComplete="off" />
        <TextInput label="Balls hit" optional inputMode="numeric" value={balls} onChange={(e) => setBalls(e.target.value)} error={errors.balls} autoComplete="off" />

        {drillChoices.length > 0 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-label text-ink">
              Drills you did <span className="font-normal text-muted">(optional)</span>
            </legend>
            {drillChoices.map((d) => (
              <Checkbox
                key={d.id}
                label={d.name}
                description={d.where}
                checked={done.includes(d.id)}
                onChange={(e) => setDone((list) => (e.target.checked ? [...list, d.id] : list.filter((id) => id !== d.id)))}
              />
            ))}
          </fieldset>
        )}

        {challengeDef && (
          <TextInput
            label={`${challengeDef.name} score`}
            optional
            inputMode="numeric"
            value={challenge}
            onChange={(e) => setChallenge(e.target.value)}
            error={errors.challenge}
            hint={`Out of ${challengeDef.outOf}. Target: ${challengeDef.target}.`}
            autoComplete="off"
          />
        )}

        <ChoiceGroup legend="How did it feel?" name="feel" columns={5} value={feel} onChange={setFeel} options={feelOptions} error={errors.feel} />
        <TextArea label="Notes for next time" optional value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Lag putts felt good; short ones pushed right" maxLength={400} />

        <Button type="submit" size="lg" block>
          Save session
        </Button>
      </form>
    </div>
  );
}
