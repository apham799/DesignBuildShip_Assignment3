"use client";

import { useRef, useState } from "react";
import { Alert, Badge, Button, Card, Checkbox, ChoiceGroup, focusFirstError, LoadingCard, Select, Stat, Stepper, TextArea, TextInput, Toast } from "@/components/ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby={`ds-${title}`}>
      <h2 id={`ds-${title}`} className="text-heading">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Showcase() {
  const [score, setScore] = useState(4);
  const [fairway, setFairway] = useState<string>();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [toast, setToast] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-10">
      <Section title="Type roles">
        <Card className="flex flex-col gap-2">
          <p className="text-display">Display · Fraunces 36</p>
          <p className="text-heading">Heading · Fraunces 22</p>
          <p className="text-body">Body · Libre Franklin 16. Everything you read.</p>
          <p className="text-label">Label · Libre Franklin 14 semibold</p>
          <p className="text-label font-normal text-muted">Muted text for hints, 8.8:1 on white</p>
        </Card>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button>Start a round</Button>
          <Button variant="secondary">Enter totals instead</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="danger">Delete round</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Cards and stats">
        <Card>
          <dl className="grid grid-cols-3 gap-4">
            <Stat label="Score" value="88" detail="+16" />
            <Stat label="Putts" value="35" detail="1.9 per hole" />
            <Stat label="Greens" value="4/18" />
          </dl>
        </Card>
        <Card tone="cream" className="flex flex-col gap-2">
          <Badge tone="brass">Your focus</Badge>
          <p className="text-heading">Putting</p>
          <p className="text-body">Three-putts cost you roughly 3 strokes last round.</p>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Badge>Par 4</Badge>
          <Badge tone="green">Saved</Badge>
          <Badge tone="warning">In progress</Badge>
        </div>
      </Section>

      <Section title="Form fields">
        <form
          ref={formRef}
          noValidate
          className="flex max-w-md flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              setNameError("Enter the course name.");
              requestAnimationFrame(() => focusFirstError(formRef.current));
              return;
            }
            setNameError(undefined);
            setToast(`Saved ${name.trim()}`);
          }}
        >
          <TextInput label="Course name" required value={name} onChange={(e) => setName(e.target.value)} error={nameError} hint="As it appears on the scorecard." autoComplete="off" />
          <Stepper label="Score" value={score} onChange={setScore} min={1} max={15} />
          <ChoiceGroup
            legend="Fairway"
            name="fairway"
            value={fairway}
            onChange={setFairway}
            options={[
              { value: "left", label: "Left" },
              { value: "hit", label: "Hit" },
              { value: "right", label: "Right" },
            ]}
          />
          <Select
            label="Tee"
            options={[
              { value: "blue", label: "Blue · 6,412 yds" },
              { value: "white", label: "White · 6,020 yds" },
            ]}
          />
          <TextArea label="Note for next time" optional placeholder="e.g. Club down, green runs long" />
          <Checkbox label="Hit the challenge target" description="24 of 30 inside the circle" />
          <Button type="submit">Save course</Button>
        </form>
      </Section>

      <Section title="Feedback">
        <Alert title="Saved on this device">Your rounds stay in this browser. Clearing site data removes them.</Alert>
        <Alert tone="error" title="Couldn't load courses">
          Check your connection, then try again.
        </Alert>
        <LoadingCard />
      </Section>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
