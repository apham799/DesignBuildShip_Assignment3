# Bucket List: user flows

**Core flow, in one sentence:**

> I tap in each hole as I play → the summary shows what cost me the most strokes → next time I'm at the range it gives me a plan for that → I log how practice went, and it's all waiting when I come back.

Each box with a route (`/play`, `/practice/log`, …) is its own page in the app. Rounded boxes link to another diagram. Cylinders are writes to `localStorage`. Dotted lines are one-time or optional extras.

## Overview: the loop

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

## 1 · First visit (nothing saved): the onboarding

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

## 2 · Core task: play a round → get a focus

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
  hole -- "last hole, or End round after any hole (confirm first)" --> summary["/round/[id]/summary<br/>score vs par + one place to focus, and why"]
  totals --> summary
  summary -. first time only .-> tip2["Tip: one thing to work on"]
  summary -- "Lock it in" --> focus[("Focus saved")]
  focus --> plan(["Go to Practice"])
```

## 3 · Practice: plan → log

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

## 4 · Coming back (something saved)

```mermaid
flowchart TD
  open(["Open Bucket List"]) --> wb["/ · Home, Welcome back<br/>Start a round or Resume · Log practice"]
  new{"Anything newly earned?"} -- "Yes" --> party["Celebration at the top of the page<br/>Crossed off: Birdie! · Level up: Gold<br/>Nice, next · See your bucket list"]
  open --> new
  wb --> inprog{"Round in progress?"}
  inprog -- "Yes" --> resume["Resume · Hole 7 at Jackson Park"]
  resume --> hole(["Go to Hole n"])
  wb --> focus["Focus card · the latest round since you locked it in<br/>2.3 → 1.9 putts a hole · 3 sessions since<br/>Today's practice plan · Change focus"]
  focus --> plan(["Go to Practice plan<br/>challenge shows your level and the next one"])
  focus --> moveon{"Focus costs under a stroke now,<br/>or another area costs more?"}
  moveon -- "Yes" --> switch["Switch to approach<br/>or pick a new area"]
  switch --> refocus[("New focus saved")]
  wb --> streakc["Practice streak · weeks in a row at your goal<br/>goal: 1–4 sessions a week, starts at 1 · Change goal<br/>each session rolls the putt closer; the goal holes it<br/>8-week dots · one mulligan a month"]
  wb --> bucket["Your bucket list · latest badges<br/>10 of 20 earned · up next: 3 to go for"]
  bucket --> list["/bucket-list · Trophy case (new badges unlock)<br/>Still on your list · challenge medals"]
  wb --> checklist["Getting started<br/>ticks itself off · Hide this"]
  wb --> note["Last practice note"]
  wb --> hist["/history · Edit · Delete · download my data"]
  wb --> again["Play again"]
  again --> notes["Hole notes from last time<br/>custom pars filled in"]
  again --> pay["Next summary: practice payoff<br/>2.2 → 1.8 putts a hole, roughly 4 strokes back"]

  menu["Corner · Reset"] -- "Reset to a first visit" --> erase[("Device data erased")]
  erase --> first(["First visit again"])
  menu -- "Load a sample week" --> sample[("Two rounds, a focus, practice that levels up")]
  sample --> wb
```

## Steps, states, and errors added while planning with the agent

I asked the agent what steps, states and errors it would add, then chose which to keep:

| Added | Why |
|---|---|
| Course loading and load-error states | The course "database" is faked as an async call, so there's a real loading/retry moment |
| Search empty state → "Course not listed" | No dead ends when your course isn't in the list |
| Custom courses | Pars you set for an unlisted course are saved and reused next time |
| Autosave every hole + Resume card | Phones die mid-round, and the round can't be lost |
| Finish early (first after 6+ holes, now after any hole) | From Arccos: you still get a useful summary from a partial round |
| Green prefilled from score − putts; fairway hidden on par 3s | From 18Birdies: fewer taps per hole |
| Totals fallback with cross-field errors | For when you forgot to track hole by hole |
| Weekly goal instead of a daily streak | A forgiving reason to return, not guilt |
| Hole notes from last time on the hole screen | Course memory: the reason to open it on the course again |
| JSON export on History | localStorage can be cleared, so give people a way out |

### Added after the first build, from my feedback

| Added | Why |
|---|---|
| Three-path first visit (playing / at the range / just looking) | "How it works" text wasn't real onboarding. Each path does something useful right away instead |
| At the range: pick every area that costs you strokes | One leak is rarely the whole story. The first pick leads, drills mix in from the rest, and "Not sure" stays exclusive |
| Just looking: try a sample hole | From 18Birdies' "preview from the couch": see the advice before committing to a round. Nothing is saved |
| Getting-started checklist | Guides the first week (play → focus → practice) and checks itself off from what you actually did |
| One-time tips on the hole, summary and practice screens | Explain each screen once, in place, instead of a tour up front |
| Practice with no focus asks you to pick one | "Why this plan" made no sense when nothing had been chosen |
| Errors recheck when a field they depend on changes | Switching focus or 9/18 holes left messages quoting the old limits |
| Reset menu in the top bar (reset / sample week) | Lets me test the first visit and the return visit without clearing the browser by hand |
| Compact hole screen | Simplicity: course facts on one line and fewer hints, so Next fits on a phone screen |
| Main focus + Also include | Changing the lead area by pick order was confusing; one main choice is easy to revise |
| Practice drafts with Resume / Log this plan | Leaving the log form never loses work, and it never silently mixes an old draft with a new plan |
| Drills say how to fill their time; minutes add up | "Repeat the ladder until time is up" instead of a fixed count that didn't match the minutes |
| "Bring:" instead of a ball count | Range balls get used up; putting and chipping reuse a few balls |
| Edit and Delete in History | Fixing a mistyped score or note matters more than another dashboard card |
| End round after any hole | Rounds get cut short (weather, daylight, a call). One confirm step stops stray taps, and summaries under 6 holes say they're a first hint |
| A golf bucket list (20 achievements) | Leans into the name: goals that tick themselves off from what you log, with "up next" so there's always a target |
| Weekly streak with a monthly mulligan | Weeks, not days, and one forgiven week a month, so the streak motivates instead of guilting |
| Bronze / Silver / Gold challenge levels | From Break X: every session has a next level to beat |
| Practice → round payoff | Shows whether practice showed up in the next round, which closes the loop the app is built on |
| Celebrations at the top of the page | New achievements and level-ups get a moment, without covering inputs; announced to screen readers |
| Badges and a trophy case | A checklist didn't read as accomplishments: each goal is now a medallion badge that unlocks with a pop, shine and sparkles, and earned ones live in a Trophy case (latest ones on Home) |
| Focus card follows the latest round | First-run feedback: the card quoted the round that set the focus, rounds later. It now shows progress since you locked it in, and offers to switch when the focus stops costing strokes |
| Weekly goal you choose, starting at 1 | First-run feedback: a fixed goal of 2 kept the streak at 0 for someone practising weekly |
