import type { Course, CourseHole, Par, Tee } from "@/lib/types";

// The course "database". For this assignment it's sample data bundled with the app,
// served through an async API so the screens handle loading and errors like they
// would against a real one. Scorecards are plausible, not official.

type Seed = {
  id: string;
  name: string;
  area: string;
  par: Par[];
  yards: number[]; // from the longest tee
  handicap: number[];
};

const seeds: Seed[] = [
  {
    id: "jackson-park",
    name: "Jackson Park",
    area: "South Side · 18 holes",
    par: [4, 4, 3, 5, 4, 4, 3, 4, 4, 4, 3, 4, 5, 4, 3, 4, 4, 4],
    yards: [378, 402, 165, 512, 356, 390, 182, 410, 345, 368, 154, 421, 498, 372, 192, 405, 388, 360],
    handicap: [7, 3, 15, 1, 11, 5, 17, 9, 13, 8, 16, 2, 4, 12, 18, 6, 10, 14],
  },
  {
    id: "harborside-port",
    name: "Harborside International · Port",
    area: "Lake Calumet · 18 holes",
    par: [4, 5, 4, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4],
    yards: [410, 545, 388, 192, 425, 402, 205, 560, 438, 415, 396, 178, 552, 430, 390, 215, 575, 445],
    handicap: [9, 3, 7, 17, 1, 11, 15, 5, 13, 10, 4, 18, 2, 8, 14, 16, 6, 12],
  },
  {
    id: "marovitz",
    name: "Sydney R. Marovitz",
    area: "Lakefront · 9 holes",
    par: [4, 4, 3, 5, 4, 4, 3, 4, 5],
    yards: [385, 360, 155, 505, 340, 410, 170, 395, 520],
    handicap: [3, 5, 9, 1, 7, 2, 8, 4, 6],
  },
  {
    id: "columbus-park",
    name: "Columbus Park",
    area: "West Side · 9 holes",
    par: [4, 3, 4, 5, 4, 4, 3, 5, 4],
    yards: [350, 148, 372, 490, 338, 365, 160, 505, 382],
    handicap: [5, 9, 2, 4, 7, 1, 8, 3, 6],
  },
  {
    id: "robert-a-black",
    name: "Robert A. Black",
    area: "North Side · 9 holes",
    par: [4, 3, 4, 3, 4, 4, 3, 4, 4],
    yards: [320, 135, 305, 160, 345, 290, 145, 330, 310],
    handicap: [4, 8, 5, 7, 1, 6, 9, 2, 3],
  },
];

const roundTo5 = (n: number) => Math.round(n / 5) * 5;

function build(seed: Seed): Course {
  const tees: (Tee & { scale: number })[] =
    seed.par.length === 18
      ? [
          { id: "blue", name: "Blue", scale: 1 },
          { id: "white", name: "White", scale: 0.92 },
          { id: "red", name: "Red", scale: 0.8 },
        ]
      : [
          { id: "white", name: "White", scale: 1 },
          { id: "red", name: "Red", scale: 0.85 },
        ];

  const holes: CourseHole[] = seed.par.map((par, i) => ({
    number: i + 1,
    par,
    handicap: seed.handicap[i],
    yards: Object.fromEntries(tees.map((t) => [t.id, t.scale === 1 ? seed.yards[i] : roundTo5(seed.yards[i] * t.scale)])),
  }));

  return { id: seed.id, name: seed.name, area: seed.area, source: "sample", tees: tees.map(({ id, name }) => ({ id, name })), holes };
}

const courses = seeds.map(build);

// Pretend network latency, so loading states are real.
const LATENCY_MS = 450;

function respond<T>(value: T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Behave like a real fetch when the device is offline.
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        reject(new Error("offline"));
        return;
      }
      resolve(value);
    }, LATENCY_MS);
  });
}

export function getCourses(): Promise<Course[]> {
  return respond(courses);
}

export function getCourse(id: string): Promise<Course | undefined> {
  return respond(courses.find((c) => c.id === id));
}

export function coursePar(course: Pick<Course, "holes">, holeCount = course.holes.length) {
  return course.holes.slice(0, holeCount).reduce((sum, h) => sum + h.par, 0);
}

export function teeYards(course: Course, teeId: string, holeCount = course.holes.length) {
  return course.holes.slice(0, holeCount).reduce((sum, h) => sum + (h.yards[teeId] ?? 0), 0);
}
