# Bucket List: user flows

**Core flow, in one sentence:**

> I tap in each hole as I play → the summary shows what cost me the most strokes → next time I'm at the range it gives me a plan for that → I log how practice went, and it's all waiting when I come back.

Each box with a route (`/play`, `/practice/log`, …) is its own page in the app. Rounded boxes link to another diagram. Cylinders are writes to `localStorage`.

## Overview: the loop

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

## 1 · First visit (nothing saved)

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

## 2 · Core task: play a round → get a focus

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

## 3 · Practice: plan → log

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

## 4 · Coming back (something saved)

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

## Steps, states, and errors added while planning with the agent

I asked the agent what steps, states and errors it would add, then chose which to keep:

| Added | Why |
|---|---|
| Course loading and load-error states | The course "database" is faked as an async call, so there's a real loading/retry moment |
| Search empty state → "Course not listed" | No dead ends when your course isn't in the list |
| Custom courses | Pars you set for an unlisted course are saved and reused next time |
| Autosave every hole + Resume card | Phones die mid-round, and the round can't be lost |
| Finish early after 6+ holes | From Arccos: you still get a useful summary from a partial round |
| Green prefilled from score − putts; fairway hidden on par 3s | From 18Birdies: fewer taps per hole |
| Totals fallback with cross-field errors | For when you forgot to track hole by hole |
| Practice-now starter plan on the first visit | From Break X: value before you've logged anything |
| Weekly goal instead of a daily streak | A forgiving reason to return, not guilt |
| Hole notes from last time on the hole screen | Course memory: the reason to open it on the course again |
| JSON export on History *(stretch)* | localStorage can be cleared, so give people a way out |
