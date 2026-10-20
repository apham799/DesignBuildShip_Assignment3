"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { buildPlan, challenges, drills } from "@/data/drills";
import { clearPracticeDraft, logPractice, savePracticeDraft, updatePractice } from "@/lib/actions";
import { timeAgo } from "@/lib/format";
import { hasErrors, wholeNumber, type Errors } from "@/lib/forms";
import { useStore } from "@/lib/storage";
import { categoryLabel, type Category, type PracticeDraft, type PracticeSession, type Store } from "@/lib/types";
import { Alert, Button, ButtonLink, Card, Checkbox, ChoiceGroup, Column, Columns, focusFirstError, LoadingCard, Page, PageHeader, TextArea, TextInput } from "@/components/ui";

type FocusChoice = Category | "mixed";
type Field = "focus" | "minutes" | "balls" | "challenge" | "feel";
// Everything the form holds, exactly as typed.
type Values = Omit<PracticeDraft, "savedAt">;
type Plan = { focus: FocusChoice; minutes: 15 | 30 | 60; also: Category[] };

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
const focusName = (f?: FocusChoice) => (!f ? "nothing chosen" : f === "mixed" ? "Mixed bucket" : categoryLabel[f]);

function planDrillIds(plan: Plan) {
  return buildPlan(plan.focus, plan.minutes, plan.also).blocks.flatMap((b) => (b.drillId ? [b.drillId] : []));
}

const blank = (focus?: FocusChoice): Values => ({ focus, also: [], minutes: "", balls: "", drillIds: [], challenge: "", notes: "" });

const fromPlan = (plan: Plan): Values => ({ ...blank(plan.focus), also: plan.also, plannedMinutes: plan.minutes, minutes: String(plan.minutes), drillIds: planDrillIds(plan) });

const fromSession = (p: PracticeSession): Values => ({
  focus: p.focus,
  also: [],
  minutes: String(p.minutes),
  balls: p.balls === undefined ? "" : String(p.balls),
  drillIds: p.drillIds,
  challenge: p.challengeScore === undefined ? "" : String(p.challengeScore),
  feel: String(p.feel),
  notes: p.notes ?? "",
});

function readPlan(params: URLSearchParams): Plan | null {
  const focus = params.get("focus");
  const minutes = Number(params.get("minutes"));
  if (!isFocus(focus) || ![15, 30, 60].includes(minutes)) return null;
  const also = (params.get("also") ?? "").split(",").filter((c): c is Category => isFocus(c) && c !== "mixed" && c !== focus);
  return { focus, minutes: minutes as Plan["minutes"], also };
}

export function PracticeLogScreen() {
  const store = useStore();
  const params = useSearchParams();
  const query = params.toString();
  // The choice belongs to this exact link; a new plan link asks again.
  const [choice, setChoice] = useState<{ query: string; use: "draft" | "plan" | "fresh" } | null>(null);
  // Once the form is open for a link, the choice screen can't replace it: whatever the
  // draft becomes while you type is this session, so the question is only asked on arrival.
  const [formOpenFor, setFormOpenFor] = useState<string | null>(null);
  if (!store) return <LoadingCard label="Loading form…" />;

  const editId = params.get("edit");
  if (editId) {
    const session = store.practice.find((p) => p.id === editId);
    if (!session) {
      return (
        <Page>
          <PageHeader title="Session not found" back={{ href: "/history", label: "History" }} />
          <Alert title="This practice session isn't saved on this device">It may have been deleted.</Alert>
        </Page>
      );
    }
    return <PracticeLogForm key={`edit-${editId}`} mode={{ kind: "edit", session }} initial={fromSession(session)} store={store} />;
  }

  const plan = readPlan(params);
  const draft = store.practiceDraft;
  const use = choice?.query === query ? choice.use : null;
  // Started on this same link (e.g. you changed the focus a moment ago): it's this session.
  const draftIsThisSession = Boolean(draft && draft.startedFrom === query);
  const draftMatchesPlan = Boolean(draft && plan && (draftIsThisSession || (draft.focus === plan.focus && draft.plannedMinutes === plan.minutes)));

  // A draft and a different plan: ask which one to log.
  if (draft && plan && !draftMatchesPlan && !use && formOpenFor !== query) {
    return (
      <Page>
        <PageHeader title="Log your practice" back={{ href: "/practice", label: "Practice plan" }} />
        <Card tone="cream" as="section" labelledBy="draft-choice" className="flex max-w-xl flex-col gap-3">
          <h2 id="draft-choice" className="text-heading">
            You have an unfinished log
          </h2>
          <p className="text-body">
            Started {timeAgo(draft.savedAt)}: <span className="font-semibold">{focusName(draft.focus)}</span>
            {draft.minutes.trim() ? ` · ${draft.minutes} min` : " · no minutes yet"}
            {draft.notes.trim() ? " · has notes" : ""}.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => setChoice({ query, use: "draft" })}>Resume your draft</Button>
            <Button
              variant="secondary"
              onClick={() => {
                clearPracticeDraft();
                setChoice({ query, use: "plan" });
              }}
            >
              Log this plan: {focusName(plan.focus)}, {plan.minutes} min
            </Button>
          </div>
          <p className="text-label font-normal text-muted">Logging the plan discards the draft.</p>
        </Card>
      </Page>
    );
  }

  // Remember that the form is showing for this link (React's "adjust state while rendering" pattern).
  if (formOpenFor !== query) setFormOpenFor(query);
  const resumeDraft = Boolean(draft && use !== "fresh" && use !== "plan" && (use === "draft" || draftMatchesPlan || !plan));
  const initial = resumeDraft ? draft! : plan ? fromPlan(plan) : blank(store.focus?.category);
  const source = resumeDraft ? "draft" : plan ? "plan" : "blank";
  return (
    <PracticeLogForm
      key={`${query}-${use ?? ""}`}
      mode={{ kind: "new", source, savedAt: resumeDraft ? draft!.savedAt : undefined }}
      startedFrom={query}
      initial={initial}
      store={store}
      onStartOver={() => {
        clearPracticeDraft();
        setChoice({ query, use: plan ? "plan" : "fresh" });
      }}
    />
  );
}

type Mode = { kind: "edit"; session: PracticeSession } | { kind: "new"; source: "draft" | "plan" | "blank"; savedAt?: string };

function PracticeLogForm(props: { mode: Mode; initial: Values; store: Store; onStartOver?: () => void; startedFrom?: string }) {
  const { store, onStartOver, startedFrom } = props;
  // Fixed when the form opens: saving the draft while typing must not change where it came from.
  const [{ mode, initial }] = useState(() => ({ mode: props.mode, initial: props.initial }));
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [v, setV] = useState<Values>(initial);
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [otherDrills, setOtherDrills] = useState(false);
  const drillBox = useRef<HTMLFieldSetElement>(null);
  const editing = mode.kind === "edit";

  // Every change is kept as a draft, so leaving the page loses nothing.
  const change = (patch: Partial<Values>) => {
    const next = { ...v, ...patch };
    setV(next);
    if (!editing) savePracticeDraft({ ...next, startedFrom, savedAt: new Date().toISOString() });
  };

  const challengeDef = v.focus ? challenges[v.focus] : undefined;
  const drillChoices =
    v.focus === "mixed"
      ? drills.filter((d) => ["distance-ladder", "fairway-gates", "lag-ladder"].includes(d.id))
      : drills.filter((d) => d.category === v.focus || v.also.includes(d.category) || v.drillIds.includes(d.id));
  // Logged from a plan: list that plan's drills first, the rest of the area on request.
  const planIds = v.focus && initial.plannedMinutes ? planDrillIds({ focus: v.focus, minutes: initial.plannedMinutes as Plan["minutes"], also: v.also }) : [];
  const shownDrills = planIds.length && !otherDrills ? drillChoices.filter((d) => planIds.includes(d.id) || v.drillIds.includes(d.id)) : drillChoices;
  // A putting session never touches the range, so there are no range balls to count.
  const usesRange = !(v.focus === "putting" && v.also.length === 0) || v.balls.trim() !== "";
  const prefilled = mode.kind === "new" && mode.source === "plan" && v.focus === initial.focus;

  function validate(): Errors<Field> {
    const e: Errors<Field> = {};
    if (!v.focus) e.focus = "Choose what you worked on.";
    const m = wholeNumber(v.minutes);
    if (!v.minutes.trim()) e.minutes = "Enter how long you practiced, in minutes.";
    else if (m === null || m < 1 || m > 300) e.minutes = "Enter minutes as a whole number from 1 to 300.";
    if (usesRange && v.balls.trim()) {
      const b = wholeNumber(v.balls);
      if (b === null || b > 500) e.balls = "Enter a number of balls from 0 to 500, or leave it blank.";
    }
    if (v.challenge.trim() && challengeDef) {
      const c = wholeNumber(v.challenge);
      if (c === null || c > challengeDef.outOf) e.challenge = `Enter a challenge score from 0 to ${challengeDef.outOf}, or leave it blank.`;
    }
    if (!v.feel) e.feel = "Choose how the session felt.";
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
      date: editing ? mode.session.date : new Date().toISOString(),
      focus: v.focus!,
      minutes: wholeNumber(v.minutes)!,
      balls: usesRange ? (wholeNumber(v.balls) ?? undefined) : undefined,
      drillIds: v.drillIds.filter((id) => drillChoices.some((d) => d.id === id)),
      challengeId: v.challenge.trim() ? challengeDef?.id : undefined,
      challengeScore: v.challenge.trim() ? wholeNumber(v.challenge)! : undefined,
      challengeOutOf: v.challenge.trim() ? challengeDef?.outOf : undefined,
      feel: Number(v.feel) as PracticeSession["feel"],
      notes: v.notes.trim() || undefined,
    };
    if (editing) {
      updatePractice(mode.session.id, session);
      router.push("/history");
    } else {
      logPractice(session);
      router.push("/?saved=practice");
    }
  }

  const errorCount = Object.values(errors).filter(Boolean).length;
  const recapFocus = v.focus ?? store.focus?.category;
  const recap = !editing && recapFocus ? buildPlan(recapFocus, initial.plannedMinutes === 15 || initial.plannedMinutes === 60 ? initial.plannedMinutes : 30, v.also) : null;

  return (
    <Page>
      <Columns>
        <Column span={5}>
          <PageHeader
            title={editing ? "Edit practice session" : "Log your practice"}
            back={editing ? { href: "/history", label: "History" } : { href: "/practice", label: "Practice plan" }}
            description={editing ? undefined : "A minute now means you'll know what worked next time."}
          />
          {mode.kind === "new" && mode.source === "draft" && (
            <Alert
              title={`Picked up your unfinished log from ${mode.savedAt ? timeAgo(mode.savedAt) : "earlier"}`}
              action={
                onStartOver && (
                  <Button variant="secondary" size="sm" onClick={onStartOver}>
                    Start over
                  </Button>
                )
              }
            >
              Everything you typed is here. It stays saved on this device until you save the session.
            </Alert>
          )}
          {recap && (
            <Card tone="cream" className="hidden flex-col gap-2 lg:flex">
              <h2 className="text-heading">{recap.minutes}-minute plan</h2>
              <ol className="flex flex-col gap-1 text-body">
                {recap.blocks.map((b, i) => (
                  <li key={b.title}>
                    {i + 1}. {b.title} <span className="text-muted">· {b.minutes} min</span>
                  </li>
                ))}
              </ol>
              {challengeDef && (
                <p className="text-body font-semibold">
                  Challenge target: {challengeDef.target} of {challengeDef.outOf}
                </p>
              )}
            </Card>
          )}
        </Column>
        <Column span={7}>
          {errorCount > 1 && (
            <Alert tone="error" title={`${errorCount} fields need fixing`}>
              Each one says what to change.
            </Alert>
          )}
          <form ref={formRef} noValidate onSubmit={submit} className="flex max-w-xl flex-col gap-6">
            <ChoiceGroup
              legend="What did you work on?"
              required
              name="focus"
              columns={2}
              value={v.focus}
              onChange={(f) => {
                const focus = f as FocusChoice;
                const plan = initial.plannedMinutes ? { focus, minutes: initial.plannedMinutes as Plan["minutes"], also: focus === initial.focus ? initial.also : [] } : null;
                change({ focus, also: plan?.also ?? [], drillIds: plan ? planDrillIds(plan) : [], challenge: "" });
                // The challenge (and its range) belongs to the old focus, and its field was just cleared.
                setErrors((e) => ({ ...e, focus: undefined, challenge: undefined }));
              }}
              options={focusOptions}
              error={errors.focus}
              hint={prefilled ? "Filled in from your plan." : undefined}
            />
            <TextInput label="Minutes" required inputMode="numeric" value={v.minutes} onChange={(e) => change({ minutes: e.target.value })} error={errors.minutes} autoComplete="off" />
            {usesRange && (
              <TextInput label="Range balls hit" optional inputMode="numeric" value={v.balls} onChange={(e) => change({ balls: e.target.value })} error={errors.balls} autoComplete="off" />
            )}

            {drillChoices.length > 0 && (
              <fieldset ref={drillBox} className="flex flex-col gap-2">
                <legend className="mb-1.5 text-label text-ink">
                  Drills you did <span className="font-normal text-muted">(optional)</span>
                </legend>
                {shownDrills.map((d) => (
                  <Checkbox
                    key={d.id}
                    label={d.name}
                    description={d.where}
                    checked={v.drillIds.includes(d.id)}
                    onChange={(e) => change({ drillIds: e.target.checked ? [...v.drillIds, d.id] : v.drillIds.filter((id) => id !== d.id) })}
                  />
                ))}
                {shownDrills.length < drillChoices.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit"
                    onClick={() => {
                      // The button goes away, so focus moves to the first drill it revealed.
                      const first = drillChoices.findIndex((d) => !shownDrills.includes(d));
                      setOtherDrills(true);
                      requestAnimationFrame(() => drillBox.current?.querySelectorAll("input")[first]?.focus());
                    }}
                  >
                    Did a different drill? Show {drillChoices.length - shownDrills.length} more
                  </Button>
                )}
              </fieldset>
            )}

            {challengeDef && (
              <TextInput
                label={`${challengeDef.name} score`}
                optional
                inputMode="numeric"
                value={v.challenge}
                onChange={(e) => change({ challenge: e.target.value })}
                error={errors.challenge}
                hint={`Out of ${challengeDef.outOf}. Bronze ${challengeDef.levels.bronze} · Silver ${challengeDef.levels.silver} · Gold ${challengeDef.levels.gold}.`}
                autoComplete="off"
              />
            )}

            <ChoiceGroup legend="How did it feel?" required name="feel" columns={5} value={v.feel} onChange={(feel) => change({ feel })} options={feelOptions} error={errors.feel} />
            <TextArea
              label="Notes for next time"
              optional
              value={v.notes}
              onChange={(e) => change({ notes: e.target.value })}
              placeholder="e.g. Lag putts felt good; short ones pushed right"
              maxLength={400}
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" size="lg" block={!editing}>
                {editing ? "Save changes" : "Save session"}
              </Button>
              {editing && (
                <ButtonLink href="/history" variant="ghost">
                  Cancel
                </ButtonLink>
              )}
            </div>
          </form>
        </Column>
      </Columns>
    </Page>
  );
}
