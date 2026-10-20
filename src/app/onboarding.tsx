"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { coursePar, getCourses } from "@/data/courses";
import { buildPlan } from "@/data/drills";
import { lockFocus } from "@/lib/actions";
import { categoryLabel, type Category, type Course } from "@/lib/types";
import { Alert, Badge, Button, Card, ChoiceGroup, MultiChoiceGroup, Skeleton, Stepper, TextLink } from "@/components/ui";

// The first visit is the onboarding. No tour: one question, then the thing you came
// to do, right here on the home page.

type Intent = "play" | "practice" | "look";

function StepHeading({ n, children, id }: { n: number; children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="flex items-center gap-3 text-heading">
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-green font-display text-base text-on-green">
        {n}
      </span>
      {children}
    </h2>
  );
}

export function Onboarding() {
  const [intent, setIntent] = useState<Intent>();
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="step-1" className="flex flex-col gap-3">
        <StepHeading n={1} id="step-1">
          What brings you here today?
        </StepHeading>
        <ChoiceGroup
          legend="Choose one"
          name="intent"
          value={intent}
          onChange={(v) => setIntent(v as Intent)}
          options={[
            { value: "play", label: "Playing today", description: "Score a round" },
            { value: "practice", label: "At the range", description: "Get a plan" },
            { value: "look", label: "Just looking", description: "Try a hole" },
          ]}
        />
      </section>
      {/* New steps appear below the choice; tell screen readers where to go. */}
      <p role="status" className="sr-only">
        {intent === "play"
          ? "Step 2 is below: pick your course."
          : intent === "practice"
            ? "Step 2 is below: what costs you the most strokes?"
            : intent === "look"
              ? "Step 2 is below: try a hole."
              : ""}
      </p>
      {intent === "play" && <PlayStart />}
      {intent === "practice" && <PracticeStart />}
      {intent === "look" && <TryAHole />}
    </div>
  );
}

// ---- Playing today: start a round from here ----

type Load = { status: "loading" } | { status: "error" } | { status: "ready"; courses: Course[] };

function PlayStart() {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const fetchCourses = useCallback(() => {
    getCourses().then(
      (courses) => setLoad({ status: "ready", courses }),
      () => setLoad({ status: "error" }),
    );
  }, []);
  useEffect(fetchCourses, [fetchCourses]);

  return (
    <section aria-labelledby="step-2" className="flex flex-col gap-3">
      <StepHeading n={2} id="step-2">
        Pick your course
      </StepHeading>
      <p className="text-body text-muted">Five Chicago public courses are built in, so par, yards and handicap fill in for every hole. You&rsquo;ll be on hole 1 in two taps.</p>
      {load.status === "loading" && (
        <div role="status" className="flex flex-col gap-2">
          <span className="sr-only">Loading courses…</span>
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}
      {load.status === "error" && (
        <Alert
          tone="error"
          title="Couldn't load courses"
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setLoad({ status: "loading" });
                fetchCourses();
              }}
            >
              Try again
            </Button>
          }
        >
          Check your connection and try again.
        </Alert>
      )}
      {load.status === "ready" && (
        <ul className="flex flex-col gap-2">
          {load.courses.slice(0, 3).map((c) => (
            <li key={c.id}>
              <Link href={`/play/course/${c.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-rule bg-surface p-4 shadow-card hover:shadow-lift">
                <span className="flex flex-col">
                  <span className="text-body font-semibold">{c.name}</span>
                  <span className="text-label font-normal text-muted">
                    {c.area} · Par {coursePar(c)}
                  </span>
                </span>
                <span aria-hidden className="text-green">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-body">
        Somewhere else? <TextLink href="/play">See all courses or add your own</TextLink>
      </p>
    </section>
  );
}

// ---- At the range: one question, then a plan ----

const leakOptions: { value: Category | "unsure"; label: string }[] = [
  { value: "driving", label: "Driving" },
  { value: "approach", label: "Approach" },
  { value: "shortGame", label: "Short game" },
  { value: "putting", label: "Putting" },
  { value: "unsure", label: "Not sure" },
];

function PracticeStart() {
  const router = useRouter();
  // One main answer, then optional extras: easier to revise than pick order.
  const [main, setMain] = useState<Category | "unsure">();
  const [also, setAlso] = useState<string[]>([]);
  const extras = also as Category[];
  const plan = main ? (main === "unsure" ? buildPlan("mixed", 30) : buildPlan(main, 30, extras)) : null;
  const picked = main && main !== "unsure" ? [main, ...extras] : [];
  const names = picked.map((c) => categoryLabel[c].toLowerCase());
  const nameList = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];

  return (
    <>
      <section aria-labelledby="step-2" className="flex flex-col gap-3">
        <StepHeading n={2} id="step-2">
          What costs you the most strokes?
        </StepHeading>
        <p className="text-body text-muted">Your best guess is fine. After your first round, Bucket List checks it against your stats.</p>
        <ChoiceGroup
          legend="Biggest one"
          name="leak"
          columns={2}
          value={main}
          onChange={(v) => {
            setMain(v as Category | "unsure");
            setAlso((list) => list.filter((c) => c !== v));
          }}
          options={leakOptions}
        />
        {main && main !== "unsure" && (
          <MultiChoiceGroup
            legend="Anything else?"
            optional
            name="leak-also"
            columns={3}
            value={also}
            onChange={setAlso}
            hint="Adds a drill from each to your plan."
            options={leakOptions.filter((o) => o.value !== "unsure" && o.value !== main)}
          />
        )}
      </section>
      <p role="status" className="sr-only">
        {plan ? "Step 3 is below: your first plan is ready." : ""}
      </p>
      {plan && (
        <section aria-labelledby="step-3" className="flex flex-col gap-3">
          <StepHeading n={3} id="step-3">
            Your first plan is ready
          </StepHeading>
          <Card tone="cream" className="flex flex-col gap-3">
            <Badge tone="brass">{picked.length ? picked.map((c) => categoryLabel[c]).join(" + ") : "Starter bucket"} · 30 minutes</Badge>
            <ol className="flex flex-col gap-1 text-body">
              {plan.blocks.map((b, i) => (
                <li key={b.title}>
                  {i + 1}. <span className="font-semibold">{b.title}</span> <span className="text-muted">· {b.minutes} min</span>
                </li>
              ))}
            </ol>
            <p className="text-label font-normal text-muted">Ends with a scored challenge, so next time you have a number to beat.</p>
            <Button
              className="w-fit"
              onClick={() => {
                if (picked.length) {
                  lockFocus(picked[0], `You said ${nameList} ${picked.length > 1 ? "cost" : "costs"} you strokes. Play a round and Bucket List will check.`, undefined, picked.slice(1));
                }
                router.push("/practice");
              }}
            >
              Open my plan
            </Button>
          </Card>
        </section>
      )}
    </>
  );
}

// ---- Just looking: score one sample hole, nothing saved ----

function TryAHole() {
  const par = 4;
  const [strokes, setStrokes] = useState(par);
  const [putts, setPutts] = useState(2);
  const [tee, setTee] = useState<string>();

  const greenInReg = strokes - putts <= par - 2;
  const insight =
    putts >= 3
      ? { focus: "Putting", text: `${putts} putts. Over a round, extra putts like this are what point Bucket List to putting practice.` }
      : !greenInReg
        ? { focus: "Approach", text: "You weren't on the green in two. Miss greens like this across a round and your plan turns to approach shots." }
        : tee && tee !== "hit"
          ? { focus: "Driving", text: `Missed the fairway ${tee}. Most of your tee misses going one way gets you a specific fix, like an alignment drill.` }
          : strokes <= par
            ? { focus: null, text: "That's a par or better. Bucket List compares each hole to a bogey golfer and picks the one area costing you the most." }
            : { focus: null, text: "A bogey: on target for a bogey golfer. Over a full round, the summary picks the one area costing you the most." };

  return (
    <section aria-labelledby="step-2" className="flex flex-col gap-3">
      <StepHeading n={2} id="step-2">
        Try a hole
      </StepHeading>
      <Card className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3 rounded-md bg-cream px-4 py-3">
          <p className="text-body">
            <span className="font-semibold">Hole 2, Jackson Park</span> · Par 4 · 402 yds
          </p>
          <Badge>Practice hole</Badge>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <Stepper
            label="Score"
            unit="score"
            value={strokes}
            min={1}
            max={10}
            onChange={(v) => {
              setStrokes(v);
              setPutts((p) => Math.min(p, v - 1));
            }}
          />
          <Stepper label="Putts" unit="putts" value={putts} min={0} max={Math.max(0, strokes - 1)} onChange={setPutts} />
        </div>
        <ChoiceGroup
          legend="Tee shot"
          name="try-tee"
          value={tee}
          onChange={setTee}
          options={[
            { value: "left", label: "Left" },
            { value: "hit", label: "Fairway" },
            { value: "right", label: "Right" },
          ]}
        />
        <div role="status" aria-live="polite" className="flex flex-col gap-1 rounded-md border-2 border-brass/60 p-4">
          <p className="text-label text-muted">What Bucket List would tell you</p>
          {insight.focus && <p className="text-heading">{insight.focus}</p>}
          <p className="text-body">{insight.text}</p>
        </div>
        <p className="text-label font-normal text-muted">This practice hole isn&rsquo;t saved. Change the numbers to see how the advice changes.</p>
      </Card>
      <div className="flex flex-wrap gap-3">
        <TextLink href="/play">Start a real round</TextLink>
        <span aria-hidden className="text-muted">
          ·
        </span>
        <TextLink href="/practice">Get a practice plan</TextLink>
      </div>
    </section>
  );
}
