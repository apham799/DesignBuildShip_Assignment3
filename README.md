# Bucket List ⛳

*Log your round hole by hole, find out what cost you strokes, and take a plan to the range.*

Bucket List is a small golf tool for two rhythms: the weekend round and the weeknight range session. During a round you tap in each hole. Course data (par, yards, handicap) comes from a built-in course list, so there's no scorecard to type in. Afterwards it names the one area that cost you the most strokes and turns it into a practice plan. At the range you log how the session went. Everything is saved in your browser, so it remembers you next time on the same device.

> I tap in each hole as I play → the summary shows what cost me the most strokes → next time I'm at the range it gives me a plan for that → I log how practice went, and it's all waiting when I come back.

- **Live:** _coming soon (Vercel)_
- **Stack:** Next.js, Tailwind CSS and `localStorage`. No accounts, database or external APIs. The course "database" is sample data bundled with the app.

## Flows

The full set of diagrams, plus the steps, states and errors chosen during planning and after feedback, is in [`flows.md`](flows.md). Routes in a box are their own page; rounded boxes link to another diagram; cylinders are saves to `localStorage`.

### Overview: the loop

```mermaid
flowchart LR
  S(["First visit<br/>pick a path"]) --> A
  S --> D
  A["Play a round<br/>tap in each hole"] --> B["Round summary<br/>biggest leak"]
  B --> C["Lock in<br/>practice focus"]
  C --> D["Practice plan<br/>at the range"]
  D --> E["Log the session<br/>how it felt"]
  E --> F["Come back<br/>Welcome back"]
  F --> A
  F --> D
```

### 1 · First visit (nothing saved): the onboarding

No tour and no setup wall: one question, then the thing you came to do, right on the home page.

```mermaid
flowchart TD
  open(["Open Bucket List"]) --> check{"Anything saved<br/>on this device?"}
  check -- "Yes" --> back(["Go to Coming back"])
  check -- "No" --> home["/ · Home, first visit<br/>What brings you here today?"]

  home -- "Playing today" --> courses["Pick your course<br/>3 courses right on Home"]
  courses -- "loading fails" --> cerr["Couldn't load courses<br/>Try again"]
  cerr --> courses
  courses --> setup["/play/course/[id]<br/>tees + 9 or 18"]
  courses -- "Somewhere else?" --> all["/play<br/>all courses or add your own"]
  setup --> round(["Go to Play a round"])
  all --> round

  home -- "At the range" --> leak["What costs you the most strokes?<br/>biggest one (or Not sure) + anything else"]
  leak --> ready["Your first plan is ready<br/>a drill from each pick + a scored challenge"]
  ready -- "Open my plan" --> focus[("Focus saved")]
  focus --> plan(["Go to Practice"])

  home -- "Just looking" --> try["Try a hole<br/>score a sample par 4, nothing saved"]
  try --> insight["What Bucket List would tell you<br/>changes as you tap"]
  insight -- "Start a real round" --> all
  insight -- "Get a practice plan" --> plan
```

### 2 · Core task: play a round → get a focus

```mermaid
flowchart TD
  pick["/play · Pick a course"] --> loading["Loading courses…"]
  loading -- "fails" --> lerr["Couldn't load courses<br/>Try again"]
  lerr --> loading
  loading --> list["Course list<br/>sample courses + Your courses"]
  list -- "search finds nothing" --> empty["No match<br/>Course not listed?"]
  empty --> custom["/play/new · Name your course<br/>every hole starts at par 4"]
  custom -- "name blank or already used" --> cerr["! Enter the course name.<br/>typed text kept"]
  cerr --> custom
  list --> tee["/play/course/[id]<br/>tees + 9 or 18 holes"]
  custom --> tee
  tee --> hole["/round/[id]/hole/[n]<br/>par · yards · handicap on one line, last time's note<br/>score · putts · tee shot · green"]
  hole -. first time only .-> tip1["One-line tip · Got it"]
  hole -- "every change" --> autosave[("Saved on this device")]
  hole -- "edit par on a custom course" --> cc[("Custom course updated")]
  hole -- "Next hole, or tap any hole in the strip" --> hole
  hole -- "Enter totals instead" --> totals["/round/[id]/totals<br/>score · putts · fairways · greens · penalties"]
  totals -- "putts more than score, etc." --> terr["! Error under the field<br/>says what to fix, input kept"]
  terr --> totals
  totals -- "switch front 9 / all 18" --> recheck["Errors on screen are rechecked<br/>against the new hole count"]
  recheck --> totals
  hole -- "last hole, or Finish early after 6+" --> summary["/round/[id]/summary<br/>score vs par + one place to focus, and why"]
  totals --> summary
  summary -. first time only .-> tip2["Tip: one thing to work on"]
  summary -- "Lock it in" --> focus[("Focus saved")]
  focus --> plan(["Go to Practice"])
```

### 3 · Practice: plan → log

```mermaid
flowchart TD
  start(["/practice"]) --> has{"Focus locked?"}
  has -- "No" --> starter["Starter bucket · a bit of everything<br/>Tailor it to your game (folded)"]
  starter -. Tailor it .-> pick["Main focus (one)<br/>+ Also include (optional)"]
  pick -- "Build my plan, no main focus" --> aerr["! Choose a main focus,<br/>or a bit of everything."]
  aerr --> pick
  pick -- "Build my plan" --> fsaved[("Focus saved")]
  fsaved --> plan
  starter --> time
  has -- "Yes" --> plan["Putting + Approach · your pick<br/>Why this plan (folded) · Change focus"]
  plan -. Change focus .-> pick
  plan --> time["Pick time · 15 / 30 / 60 min<br/>Bring: range balls + balls for the green"]
  time --> range["At the range<br/>each drill: repeat until time is up"]
  range --> open["Done? Log this session"]
  open --> draft{"Unfinished draft<br/>from a different plan?"}
  draft -- "Yes" --> choose["Resume your draft<br/>or Log this plan"]
  choose --> log
  draft -- "Same plan" --> resumed["Draft picked up · Start over"]
  resumed --> log
  draft -- "No draft" --> log["/practice/log<br/>prefilled from the plan, saved as a draft as you type"]
  log -- "missing or out of range" --> perr["! Error under the field<br/>input kept, focus moves to the first error"]
  perr --> log
  log -- "change what you worked on" --> clear["Old challenge score and its error cleared"]
  clear --> log
  log --> saved[("Session saved, draft cleared")]
  saved --> toast["Saved · 1 of 2 this week"]
  toast --> home(["Home"])
```

### 4 · Coming back (something saved)

```mermaid
flowchart TD
  open(["Open Bucket List"]) --> wb["/ · Home, Welcome back<br/>days since last round or practice"]
  wb --> inprog{"Round in progress?"}
  inprog -- "Yes" --> resume["Resume · Hole 7 at Jackson Park"]
  resume --> hole(["Go to Hole n"])
  wb --> focus["Focus card<br/>Putting cost about 3 strokes last round"]
  focus --> plan(["Go to Practice plan"])
  wb --> checklist["Getting started<br/>play holes → lock a focus → log practice<br/>ticks itself off · Hide this"]
  wb --> note["Last practice note<br/>lag putts good, short ones pushed right"]
  wb --> goal["Weekly goal · 1 of 2 sessions"]
  wb --> hist["/history · rounds + practice sessions<br/>Edit · Delete on each · download my data"]
  wb --> again["Play the same course again"]
  again --> notes["Hole screens show your notes<br/>custom pars already filled in"]

  menu["Top bar · Reset"] -- "Reset to a first visit" --> erase[("Device data erased")]
  erase --> first(["First visit again"])
  menu -- "Load a sample week" --> sample[("Sample round, focus and practice")]
  sample --> wb
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
