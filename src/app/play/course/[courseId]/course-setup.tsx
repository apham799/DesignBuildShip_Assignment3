"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useId } from "react";
import { coursePar, getCourse, teeYards } from "@/data/courses";
import { deleteCustomCourse, startRound } from "@/lib/actions";
import { useStore } from "@/lib/storage";
import type { Course } from "@/lib/types";
import { Alert, Button, ButtonLink, Card, ChoiceGroup, Column, Columns, LoadingCard, Page, PageHeader, useFocusSwap } from "@/components/ui";

type Load = { status: "loading" } | { status: "error" } | { status: "ready"; course: Course | undefined };

export function CourseSetup() {
  const { courseId } = useParams<{ courseId: string }>();
  const isCustom = courseId.startsWith("custom-");
  const store = useStore();
  const [sample, setSample] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (isCustom) return;
    let live = true;
    getCourse(courseId).then(
      (course) => live && setSample({ status: "ready", course }),
      () => live && setSample({ status: "error" }),
    );
    return () => {
      live = false;
    };
  }, [courseId, isCustom, attempt]);

  if (isCustom) {
    if (!store) return <LoadingCard label="Loading course…" />;
    const course = store.customCourses.find((c) => c.id === courseId);
    return course ? <Setup key={course.id} course={course} noteCount={Object.keys(store.holeNotes[course.id] ?? {}).length} /> : <Missing />;
  }
  if (sample.status === "loading" || !store) return <LoadingCard label="Loading course…" />;
  if (sample.status === "error") {
    return (
      <Alert
        tone="error"
        title="Couldn't load this course"
        action={
          <Button
            variant="secondary"
            onClick={() => {
              setSample({ status: "loading" });
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </Button>
        }
      >
        Check your connection and try again.
      </Alert>
    );
  }
  if (!sample.course) return <Missing />;
  return <Setup key={sample.course.id} course={sample.course} noteCount={Object.keys(store.holeNotes[sample.course.id] ?? {}).length} />;
}

function Missing() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Course not found" back={{ href: "/play", label: "Courses" }} />
      <Alert title="We couldn't find that course">It may have been deleted. Pick another from the list.</Alert>
      <ButtonLink href="/play" className="w-fit">
        Back to courses
      </ButtonLink>
    </div>
  );
}

function Setup({ course, noteCount }: { course: Course; noteCount: number }) {
  const router = useRouter();
  const [tee, setTee] = useState(course.tees[0].id);
  const [holes, setHoles] = useState(String(course.holes.length));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { whenOpen, whenClosed } = useFocusSwap(confirmDelete);
  const questionId = useId();
  const holeCount = Number(holes);
  const custom = course.source === "custom";
  const yards = teeYards(course, tee, holeCount);

  return (
    <Page>
      <Columns>
        <Column span={5} sticky>
          <PageHeader title={course.name} back={{ href: "/play", label: "Courses" }} description={course.area} />

          <Card tone="cream">
            <dl className="grid grid-cols-3 gap-4">
              <div>
                <dt className="text-label text-muted">Holes</dt>
                <dd className="text-heading">{holeCount}</dd>
              </div>
              <div>
                <dt className="text-label text-muted">Par</dt>
                <dd className="text-heading">{coursePar(course, holeCount)}</dd>
              </div>
              <div>
                <dt className="text-label text-muted">Yards</dt>
                <dd className="text-heading">{yards ? yards.toLocaleString() : "—"}</dd>
              </div>
            </dl>
          </Card>

          {noteCount > 0 && <Alert title={`You have notes on ${noteCount} ${noteCount === 1 ? "hole" : "holes"} here`}>They&rsquo;ll show up on each hole as you play.</Alert>}
        </Column>

        <Column span={7} className="lg:col-start-6 lg:row-span-2 lg:row-start-1">
          <Card>
            <form
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                const id = startRound(course, tee, holeCount);
                router.push(`/round/${id}/hole/1`);
              }}
            >
              {course.tees.length > 1 && (
                <ChoiceGroup
                  legend="Tees"
                  required
                  name="tee"
                  columns={course.tees.length as 2 | 3}
                  value={tee}
                  onChange={setTee}
                  options={course.tees.map((t) => ({ value: t.id, label: t.name, description: `${teeYards(course, t.id, holeCount).toLocaleString()} yds` }))}
                />
              )}
              {course.holes.length === 18 && (
                <ChoiceGroup
                  legend="How many holes?"
                  required
                  name="holes"
                  columns={2}
                  value={holes}
                  onChange={setHoles}
                  options={[
                    { value: "9", label: "Front 9" },
                    { value: "18", label: "All 18" },
                  ]}
                />
              )}
              <Button type="submit" size="lg" block>
                Start on hole 1
              </Button>
            </form>
          </Card>
        </Column>

        {custom && (
          <Column span={5} className="lg:col-start-1 lg:row-start-2">
            {/* Folded away, so Delete never sits right under Start on a phone. */}
            <details className="group mt-6 rounded-lg border border-rule px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-sm [&::-webkit-details-marker]:hidden">
                <span className="text-heading">Manage this course</span>
                <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-green transition-transform group-open:rotate-180" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6 L8 10 L12 6" />
                </svg>
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                <p className="text-body text-muted">Pars you set while playing are saved here for next time.</p>
                {confirmDelete ? (
                  <div role="group" aria-labelledby={questionId} className="flex flex-col gap-3">
                    <p id={questionId} className="text-body">
                      Delete {course.name}? Rounds you played here stay in History.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="danger"
                        onClick={() => {
                          deleteCustomCourse(course.id);
                          router.push("/play");
                        }}
                      >
                        Delete course
                      </Button>
                      <Button ref={whenOpen} variant="secondary" onClick={() => setConfirmDelete(false)}>
                        Keep it
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button ref={whenClosed} variant="danger" className="w-fit" onClick={() => setConfirmDelete(true)}>
                    Delete this course
                  </Button>
                )}
              </div>
            </details>
          </Column>
        )}
      </Columns>
    </Page>
  );
}
