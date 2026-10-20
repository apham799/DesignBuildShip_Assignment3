# Bucket List ⛳

*Log your round hole by hole, find out what cost you strokes, and take a plan to the range.*

Bucket List is a small golf tool for two rhythms: the weekend round and the weeknight range session. During a round you tap in each hole. Course data (par, yards, handicap) comes from a built-in course list, so there's no scorecard to type in. Afterwards it names the one area that cost you the most strokes and turns it into a practice plan. At the range you log how the session went. Everything is saved in your browser, so it remembers you next time on the same device.

> I tap in each hole as I play → the summary shows what cost me the most strokes → next time I'm at the range it gives me a plan for that → I log how practice went, and it's all waiting when I come back.

- **Live:** _coming soon (Vercel)_
- **Stack:** Next.js, Tailwind CSS and `localStorage`. No accounts, database or external APIs. The course "database" is sample data bundled with the app.

## Flows

The full set of diagrams, plus the steps, states and errors chosen during planning, is in [`flows.md`](flows.md).

### Overview: the loop
```mermaid
flowchart LR
  A["Play a round<br/>tap in each hole"] --> B["Round summary<br/>biggest leak"]
  B --> C["Lock in<br/>practice focus"]
  C --> D["Practice plan<br/>at the range"]
  D --> E["Log the session<br/>how it felt"]
  E --> F["Come back<br/>Welcome back"]
  F --> A
  F --> D
```

### First visit
```mermaid
flowchart TD
  open(["Open Bucket List"]) --> check{"Anything saved<br/>on this device?"}
  check -- "Yes" --> back(["Go to Coming back"])
  check -- "No" --> home["/ · Home, first visit<br/>Track a round. Get a practice plan."]
  home --> play["Start a round"]
  home --> starter["Practice now<br/>starter range plan, no stats needed"]
  play --> round(["Go to Play a round"])
  starter --> plan["/practice · 15 / 30 / 60 min"]
  plan --> log(["Go to Log practice"])
```

### Core task: play a round → get a focus
```mermaid
flowchart TD
  pick["/play · Pick a course"] --> loading["Loading courses…"]
  loading -- "fails" --> lerr["Couldn't load courses<br/>Try again"]
  lerr --> loading
  loading --> list["Course list<br/>sample courses + Your courses"]
  list -- "search finds nothing" --> empty["No match<br/>Course not listed?"]
  empty --> custom["Name your course<br/>every hole starts at par 4"]
  custom -- "name left blank" --> cerr["! Enter the course name.<br/>typed text kept"]
  cerr --> custom
  list --> tee["Choose tee + 9 or 18 holes"]
  custom --> tee
  tee --> hole["/play/[round]/hole/[n]<br/>par, yards, your note from last time<br/>score · putts · fairway · green"]
  hole -- "every change" --> autosave[("Saved on this device")]
  hole -- "edit par on a custom course" --> cc[("Custom course updated")]
  hole -- "Next hole" --> hole
  hole -- "Enter totals instead" --> totals["/play/[round]/totals<br/>score · putts · fairways · greens · penalties"]
  totals -- "putts more than score, etc." --> terr["! Error under the field<br/>says what to fix, input kept"]
  terr --> totals
  hole -- "last hole, or Finish early after 6+" --> summary["/play/[round]/summary<br/>score vs par + biggest leak and why"]
  totals --> summary
  summary -- "Lock in as practice focus" --> focus[("Focus saved")]
  focus --> plan(["Go to Practice"])
```

### Practice: plan → log
```mermaid
flowchart TD
  plan["/practice · Plan for your focus<br/>warm-up → drill → challenge + target"] --> time["Pick time · 15 / 30 / 60 min"]
  time --> range["At the range"]
  range --> log["/practice/log<br/>focus · minutes · balls · drills · challenge score · feel · notes"]
  log -- "no focus chosen / score out of range" --> perr["! Choose what you worked on.<br/>Enter a challenge score from 0 to 30.<br/>input kept"]
  perr --> log
  log --> saved[("Session saved")]
  saved --> toast["Saved · goal 1 of 2 this week"]
  toast --> home(["Home"])
```

### Coming back
```mermaid
flowchart TD
  open(["Open Bucket List"]) --> wb["/ · Home, Welcome back<br/>days since last round or practice"]
  wb --> inprog{"Round in progress?"}
  inprog -- "Yes" --> resume["Resume · Hole 7 at Jackson Park"]
  resume --> hole(["Go to Hole n"])
  wb --> focus["Focus card<br/>Putting cost about 3 strokes last round"]
  focus --> plan(["Go to Practice plan"])
  wb --> note["Last practice note<br/>lag putts good, short ones pushed right"]
  wb --> goal["Weekly goal · 1 of 2 sessions"]
  wb --> hist["/history · rounds + practice sessions"]
  wb --> again["Play the same course again"]
  again --> notes["Hole screens show your notes<br/>custom pars already filled in"]
```

## Onboarding research

Subagents studied how 18Birdies, Arccos Caddie and Break X Golf welcome someone new. The findings and the patterns borrowed are in [`docs/research.md`](docs/research.md). In short, Bucket List skips the setup wall all three use and gives value before you've logged anything: a starter practice plan on the first visit.

## Design

The visual style builds on my Assignment 2 **Clubhouse Almanac** design system, revised after class feedback:
- A white background and cards, with cream and tan kept for accents (the feedback: too much tan, and light text was hard to read on beige).
- Two typefaces and four text styles (the feedback: around 10 typographies made the hierarchy hard to follow).
- Red is used only for errors, always with an icon, and every text color is contrast-checked.

## Accessibility

_To be filled in: keyboard walkthrough results and contrast checks._

## First-run check

_To be filled in after deploy: an agent tries the live site as a brand-new user, and its usability feedback and the resulting changes go here._

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.
