"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { coursePar, getCourses } from "@/data/courses";
import { inProgressRound } from "@/lib/actions";

import { playedHoles, roundStats } from "@/lib/recommend";
import { useStore } from "@/lib/storage";
import type { Course } from "@/lib/types";
import { Alert, Badge, Button, ButtonLink, Card, Column, Columns, Page, PageHeader, Skeleton, TextInput, ToPar } from "@/components/ui";

type Load = { status: "loading" } | { status: "error" } | { status: "ready"; courses: Course[] };

function CourseRow({ course }: { course: Course }) {
  return (
    <li>
      <Link href={`/play/course/${course.id}`} className="flex items-center justify-between gap-4 rounded-lg border border-rule bg-surface p-4 shadow-card transition-shadow hover:shadow-lift">
        <span className="flex flex-col">
          <span className="text-heading">{course.name}</span>
          <span className="text-label font-normal text-muted">
            {course.area} · Par {coursePar(course)}
          </span>
        </span>
        <svg viewBox="0 0 16 16" className="size-5 shrink-0 text-green" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3 L11 8 L6 13" />
        </svg>
      </Link>
    </li>
  );
}

export function CoursePicker() {
  const store = useStore();
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [query, setQuery] = useState("");

  const fetchCourses = useCallback(() => {
    getCourses().then(
      (courses) => setLoad({ status: "ready", courses }),
      () => setLoad({ status: "error" }),
    );
  }, []);

  useEffect(fetchCourses, [fetchCourses]);

  const q = query.trim().toLowerCase();
  const matches = (c: Course) => !q || c.name.toLowerCase().includes(q) || c.area.toLowerCase().includes(q);
  const mine = (store?.customCourses ?? []).filter(matches);
  const listed = load.status === "ready" ? load.courses.filter(matches) : [];
  const nothingFound = load.status === "ready" && q && mine.length === 0 && listed.length === 0;
  const current = store ? inProgressRound(store) : undefined;
  const newCourseHref = `/play/new${q ? `?name=${encodeURIComponent(query.trim())}` : ""}`;

  return (
    <Page>
      <Columns>
        <Column span={5} sticky>
          <PageHeader
            title="Where are you playing?"
            description="Five Chicago public courses are built in, with par, yards and handicap for every hole. Playing somewhere else? Search for it and add it."
          />

          {current && (
            <Card tone="cream" className="flex flex-col gap-3">
              <Badge tone="warning">Round in progress</Badge>
              <p className="text-body">
                <span className="font-semibold">{current.courseName}</span>, hole {current.currentHole} of {current.holes.length}
                {playedHoles(current).length > 0 && (
                  <>
                    {" · "}
                    <ToPar strokes={roundStats(current).strokes} par={roundStats(current).par} /> so far
                  </>
                )}
              </p>
              <ButtonLink href={`/round/${current.id}/hole/${current.currentHole}`} className="w-fit">
                Resume round
              </ButtonLink>
              <p className="text-label font-normal text-muted">Starting a new round finishes this one where you left off.</p>
            </Card>
          )}

          <TextInput label="Find a course" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Jackson Park" autoComplete="off" />
          <p role="status" className="sr-only">
            {load.status === "ready" && q
              ? nothingFound
                ? `No courses match ${query.trim()}.`
                : `${mine.length + listed.length} ${mine.length + listed.length === 1 ? "course matches" : "courses match"}.`
              : ""}
          </p>
        </Column>

        <Column span={7} className="lg:col-start-6 lg:row-span-2 lg:row-start-1">
          {mine.length > 0 && (
            <section aria-labelledby="mine" className="flex flex-col gap-3">
              <h2 id="mine" className="text-heading">
                Your courses
              </h2>
              <ul className="flex flex-col gap-3">
                {mine.map((c) => (
                  <CourseRow key={c.id} course={c} />
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="listed" aria-busy={load.status === "loading"} className="flex flex-col gap-3">
            <h2 id="listed" className="text-heading">
              Chicago courses
            </h2>
            {load.status === "loading" && (
              <div role="status" className="flex flex-col gap-3">
                <span className="sr-only">Loading courses…</span>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
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
                Check your connection and try again. Your own courses still work offline.
              </Alert>
            )}
            {load.status === "ready" && listed.length > 0 && (
              <ul className="flex flex-col gap-3">
                {listed.map((c) => (
                  <CourseRow key={c.id} course={c} />
                ))}
              </ul>
            )}
            {nothingFound && (
              <Card className="flex flex-col gap-3">
                <p className="text-body">No courses match &ldquo;{query.trim()}&rdquo;.</p>
                <ButtonLink href={newCourseHref} className="w-fit">
                  Add &ldquo;{query.trim()}&rdquo; as your course
                </ButtonLink>
              </Card>
            )}
            {load.status === "ready" && !nothingFound && listed.length === 0 && q && <p className="text-body text-muted">No Chicago courses match, but one of yours does.</p>}
          </section>
        </Column>

        <Column span={5} className="lg:col-start-1 lg:row-start-2">
          {!nothingFound && (
            <p className="text-body">
              Course not listed?{" "}
              <Link href={newCourseHref} className="font-semibold text-green underline decoration-green/40 decoration-2 underline-offset-[3px] hover:decoration-green">
                Add your own
              </Link>{" "}
              and set the pars as you play.
            </p>
          )}
        </Column>
      </Columns>
    </Page>
  );
}
