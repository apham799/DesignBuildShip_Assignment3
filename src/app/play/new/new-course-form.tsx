"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { createCustomCourse } from "@/lib/actions";
import type { Errors } from "@/lib/forms";
import { useStore } from "@/lib/storage";
import { Button, Card, ChoiceGroup, Column, Columns, focusFirstError, Page, PageHeader, TextInput } from "@/components/ui";

export function NewCourseForm() {
  const router = useRouter();
  const store = useStore();
  const params = useSearchParams();
  const [name, setName] = useState(params.get("name") ?? "");
  const [holes, setHoles] = useState<"9" | "18">("18");
  const [errors, setErrors] = useState<Errors<"name">>({});
  const formRef = useRef<HTMLFormElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const duplicate = store?.customCourses.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    const next: Errors<"name"> = {
      name: !trimmed ? "Enter the course name." : duplicate ? `You already have a course called ${duplicate.name}. Pick it from the course list, or use a different name.` : undefined,
    };
    setErrors(next);
    if (next.name) {
      requestAnimationFrame(() => focusFirstError(formRef.current));
      return;
    }
    const course = createCustomCourse(trimmed, holes === "9" ? 9 : 18);
    router.push(`/play/course/${course.id}`);
  }

  return (
    <Page>
      <Columns>
        <Column span={5}>
          <PageHeader
            title="Add your course"
            back={{ href: "/play", label: "Courses" }}
            description="Every hole starts as a par 4. Change the par on each hole as you play, and it's saved for next time."
          />
          <Card tone="cream" className="hidden flex-col gap-2 lg:flex">
            <h2 className="text-heading">How your course works</h2>
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-body">
              <li>Every hole starts as a par 4.</li>
              <li>On each hole, tap Par 3, 4 or 5 if it&rsquo;s different.</li>
              <li>Next time, your pars and hole notes are already there.</li>
            </ol>
          </Card>
        </Column>
        <Column span={7}>
          <Card>
            <form ref={formRef} noValidate onSubmit={submit} className="flex flex-col gap-5">
              <TextInput label="Course name" required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="off" />
              <ChoiceGroup
                legend="Holes"
                required
                name="holes"
                columns={2}
                value={holes}
                onChange={(v) => setHoles(v as "9" | "18")}
                options={[
                  { value: "9", label: "9 holes" },
                  { value: "18", label: "18 holes" },
                ]}
              />
              <Button type="submit" size="lg" block>
                Save course
              </Button>
            </form>
          </Card>
        </Column>
      </Columns>
    </Page>
  );
}
