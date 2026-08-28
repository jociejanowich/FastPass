# FastPass

**FastPass turns fragmented onboarding information into prioritized action.**

FastPass is an AI-powered onboarding **orchestration** experience. Microsoft already
has platforms for learning, content, collaboration, and communication. FastPass is the
layer on top that connects employee context, tasks, milestones, blockers, resources,
recommendations, AI guidance, and manager action, and answers:

- What applies to this employee?
- What should this employee do next?
- What is due soon?
- What is blocked, and what depends on that blocker?
- Which resource is relevant?
- When should a manager intervene?
- What is the employee's current milestone?
- What comes after onboarding?

This repository replaces an earlier Power Apps prototype with a maintainable React
application that runs locally with **no backend and no secrets**.

---

## Architecture

```
src/
  config/          demoConfig.ts – the single demo-date anchor (DEMO_TODAY)
  domain/          pure business logic, fully unit tested
    types.ts             domain model (storage-agnostic)
    businessRules.ts      progress, journey status, recommendations, ordering,
                          milestone status, readiness, due-date sorting
    signals.ts           completion-signal model (source, status, reading)
    detection.ts         task -> signal rules; applySignalsToTasks (auto status)
    connectedSystems.ts  "Connected systems" panel view model
    selectors.ts          derived view models (EmployeeViewModel, MilestoneViewModel,
                          BlockerViewModel, ManagerSummary)
    assistantEngine.ts    deterministic local "mock response engine"
    testFactories.ts      test helpers
  data/            data-service layer
    FastPassRepository.ts          the interface every page depends on
    mockData.ts                   the demo data set (one place)
    mockSignals.ts                simulated readings from connected systems
    MockFastPassRepository.ts      in-memory, signal-driven implementation
    DataverseFastPassRepository.ts placeholder adapter (same interface)
    MicrosoftGraphProfileAdapter.ts placeholder profile adapter
    repositoryFactory.ts          picks an implementation from env
  state/           React Context + useReducer
    context.ts / AppContext.tsx / appHooks.ts / appReducer.ts / derivedHooks.ts
  components/       presentational components (no business logic)
  pages/           one component per route
  theme/           palette + layout constants (Fluent supplies the rest)
  utils/           date + id helpers
```

**Layering rule:** business logic lives in `domain/`. Components and pages read
`selectors`/`derivedHooks`; they never recompute progress, status, or milestone
rollups themselves. Data access goes through the `FastPassRepository` interface only.

### State flow

`AppProvider` (Context + `useReducer`) owns the single copy of employee, tasks,
milestones, resources, connected-system signals, refresh timestamp, and the
assistant transcript. Actions (`refresh`, `sendAssistantMessage`, and the manual
`setTaskStatus` fallback) call the repository and dispatch. Every derived value
(progress %, journey status,
milestone status, readiness, recommendations, blocker list, KPI counts, manager
summary) is recomputed by memoized selectors, so a signal change immediately
updates the Dashboard, Milestones, Assistant context, and blocker count.

---

## How completion is detected (no manual checklist)

FastPass does not ask the employee to tick boxes. Each task has a **detection
rule** (`domain/detection.ts`) pointing at a **signal** from the system that
already knows the answer:

| Task                                                | Detected from                      |
| --------------------------------------------------- | ---------------------------------- |
| Setup Laptop, Install Development Tools             | Device management (Intune / Entra) |
| Request Required Access                             | Access management (ITSM)           |
| Complete Security / Compliance Training             | Learning (LMS)                     |
| Join Teams Channels                                 | Collaboration (Teams / Graph)      |
| Meet Manager, First Manager Check-In                | Calendar                           |
| Read Engineering Standards, Review Engineering Wiki | Knowledge base analytics           |

`applySignalsToTasks(tasks, signals)` is a pure function that rewrites each
task's status (and blocker) from the latest reading. The repository holds the
signal readings and re-applies them on every read and every change, so task
status, progress, milestones, and recommendations are always derived — never
stored by hand. Manual `updateTaskStatus` is rejected for any task that has a
detection rule (it remains available only as a fallback for tasks without one).

The **Connected systems** panel on the Tasks page shows every source, its
signals, and when each last reported; **Check now** re-polls.

**Integration:** implement `DataverseFastPassRepository.getSignals()` to read
those systems (or a Dataverse table they write to) and return `SignalReading[]`;
`ingestSignal(reading)` is the entry point for a webhook pushing a single update.
Everything downstream is unchanged.

---

## Technology choices

| Area        | Choice                                            | Why                                                                                 |
| ----------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Build       | Vite                                              | Fast dev server, simple config                                                      |
| UI          | Fluent UI React Components **v9**                 | First-party Microsoft look; `webLightTheme` already uses the Microsoft product blue |
| Icons       | `@fluentui/react-icons`                           | Matches Fluent; no hand-drawn SVG                                                   |
| Routing     | React Router v6                                   | Standard SPA routing                                                                |
| State       | React Context + `useReducer`                      | Enough for this scope; no heavy state library                                       |
| Styling     | Fluent `makeStyles` + a small global `index.css`  | Co-located, themeable, no Tailwind/Bootstrap/MUI                                    |
| Tests       | Vitest                                            | Business-logic unit tests                                                           |
| Lint/format | ESLint (flat config) + Prettier                   | Strict, `no-explicit-any` is an error                                               |
| Language    | TypeScript, `strict` + `noUncheckedIndexedAccess` | No `any` in the codebase                                                            |

---

## Local setup

Requirements: Node 18+ (built and verified on Node 24), npm.

```bash
npm install
npm run dev
```

The app opens at http://localhost:5173 and redirects `/` to `/dashboard`.
No environment file is needed — it runs entirely on mock data.

### Development commands

| Command                                   | Purpose                                     |
| ----------------------------------------- | ------------------------------------------- |
| `npm run dev`                             | Start the dev server                        |
| `npm run build`                           | Type-check (`tsc -b`) then production build |
| `npm run preview`                         | Serve the production build                  |
| `npm run typecheck`                       | Type-check only                             |
| `npm run lint`                            | ESLint                                      |
| `npm run format` / `npm run format:check` | Prettier                                    |
| `npm test`                                | Run the Vitest suite once                   |
| `npm run test:watch`                      | Vitest in watch mode                        |

---

## Routes

| Path          | Page                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------- |
| `/`           | Redirects to `/dashboard`                                                                     |
| `/dashboard`  | Welcome dashboard: context, progress hero, KPI cards, blocker callout, recommended next steps |
| `/tasks`      | Tasks grouped into Blocked / In Progress / Not Started / Completed, with status controls      |
| `/assistant`  | FastPass Assistant chat + "what your manager sees" previews                                   |
| `/milestones` | Milestone accordion + "Ready for Production Work" summary                                     |
| `/career`     | Career journey — timeline, role guidance, readiness outlook                                   |
| `/about`      | About Me — AI-generated development profile + upcoming-risk detection                         |
| `*`           | Polished not-found page                                                                       |

---

## Mock-data approach

- `src/data/mockData.ts` is the **only** place demo content lives: one employee
  (`EMP-001`, "Cesar Martinez", Junior Software Engineer, IT), exactly ten tasks
  across four categories, four milestones, and eight resources.
- Every date is derived from `DEMO_TODAY` in `src/config/demoConfig.ts` via
  `demoDateOffset(days)`. Change that one constant to shift the whole demo.
- `src/data/mockSignals.ts` holds the simulated connected-system readings. The
  demo starts in a deliberately mixed state derived from them: 5 completed,
  2 in progress, 2 not started, 1 blocked → **50% progress**. The blocked task
  ("Setup Laptop") carries the device-management blocker detail and a resource.
- `MockFastPassRepository` holds signals + data in memory, simulates ~260 ms
  latency, and re-derives task status from signals on every read and change.

---

## Business rules (all in `domain/businessRules.ts`, all tested)

- **Progress %** = completed _required_ tasks ÷ total required tasks × 100, rounded,
  `0` when there are no required tasks (no divide-by-zero).
- **Journey status**: `0` → Not Started, `1–99` → In Progress, `100` → Completed.
- **Recommended next steps**: exclude Completed; order Blocked → In Progress →
  Not Started; then earliest due date (undated last); return the first two.
- **Tasks page ordering**: sections in order Blocked, In Progress, Not Started,
  Completed; within each, due date ascending with undated tasks last.
- **Milestone status**: any task Blocked → Blocked; else all Completed → Complete;
  else any Completed/In Progress → In Progress; else Not Started.
- **Readiness**: "Ready for Production Work" only when every required task is
  Completed; otherwise "Onboarding In Progress" plus the count remaining.

---

## FastPass Assistant — mock response engine

`src/domain/assistantEngine.ts` is a **deterministic local response engine**.
`detectIntent()` keyword-matches the message; each intent handler inspects the
**live task / milestone / signal state** and returns text plus resource
citations. It makes **no external calls** and needs **no secrets**.

Handled intents: next steps (blocker first, with reasoning, due dates, and a
resource), blockers, tasks due soon, current milestone, relevant resource, manager
visibility, overall progress, and a helpful fallback.

**Replacing it with a real service:** swap `generateAssistantReply()` for a call to
Azure OpenAI, Microsoft Copilot Studio, or another approved service inside
`AppContext.sendAssistantMessage`. Pass the same context object (employee view model,
tasks, milestones, resources) as grounding data and keep the `AssistantReply` shape
(`{ intent, text, citations }`). Configure via `VITE_ASSISTANT_ENGINE` /
`VITE_AZURE_OPENAI_*` (see `.env.example`).

---

## Manager notification preview

FastPass has **no separate manager dashboard**. Manager visibility is represented by
two reusable preview components in `src/components/ManagerEmailPreview.tsx`:

- **`ManagerBlockerAlert`** — automated alert: employee, blocked task, due date,
  blocker detail, recommended manager action.
- **`ManagerDailySummary`** — daily digest: profile, progress, journey status,
  blockers, priority tasks, completed tasks, recommended actions.

Both render from `selectManagerSummary()` and appear on the Assistant page under
"What your manager sees".

---

## About Me — development profile & risk detection

`/about` is a compact enterprise dashboard (many small cards, no wall of text)
that answers, in ~30 seconds: who this employee is professionally, what they are
good at, where they have struggled, what to learn next, which career directions
fit, which upcoming tasks may be difficult, and what to do about them.

`src/domain/profileAnalysis.ts` — `analyzeProfile(input)` — is a **deterministic
analysis engine**. It derives each section from onboarding data alone; every
strength and development area carries its own evidence string, career suggestions
are phrased as possibilities, and risks are "potential" (matched to prior
friction), never predictions of failure.

**Upcoming-risk logic:** each incomplete, not-currently-blocked task is scored on
overlap with tasks that have been **blocked, finished late, stalled, or carry a
note flagging a dependency** — same connected-system source, same work type
(access-approval / device-setup / self-directed-reading / …), external-dependency
shape, whether it gates an open milestone, and how soon it is due.
`High` ≥ strong similarity to a prior blocker, `Medium` = partial overlap,
`Low` = little prior evidence. Top 3 are shown, highest first, each with shared
components, next steps, a learning plan, and support recommendations.

**Power Automate:** `data/ProfileAnalysisService.ts` is the seam. The flow is
expected to return one field per card (`ProfileSummary`, `Strengths`,
`FocusAreas`, `SkillsSnapshot`, `LearningAreas`, `PerformanceSummary`,
`CareerDirection`, `CareerTrajectory`, `UpcomingRisks`) mapping 1:1 onto
`ProfileAnalysis`. Set `VITE_PROFILE_ANALYSIS=power-automate` + `VITE_PROFILE_FLOW_URL`
and implement `PowerAutomateProfileAnalysisService`. The analysis runs
automatically when the screen mounts (`useProfileAnalysis`), with an
"Analyzing your onboarding journey…" loading state and a manual **Re-analyze**
fallback.

---

## Replacing `MockFastPassRepository` with Dataverse

1. Implement `DataverseFastPassRepository` (`src/data/DataverseFastPassRepository.ts`)
   against the `FastPassRepository` interface. The file documents suggested table
   names and the mapping approach. Translate Dataverse option sets and GUIDs into the
   string unions and ids used by `domain/types.ts` — **never leak GUIDs or OData
   annotations into domain objects or the UI**.
2. Add MSAL (or the Power Platform connector) for tokens on the
   `${environmentUrl}/.default` scope.
3. Set `VITE_FASTPASS_DATA_SOURCE=dataverse` and `VITE_DATAVERSE_ENVIRONMENT_URL`
   (plus client/tenant ids). `repositoryFactory.ts` will construct the Dataverse
   adapter; if the URL is missing it logs a warning and falls back to mock.
4. No page or component changes are required — they depend only on the interface.

### Where a Microsoft Graph adapter fits

`getCurrentEmployee()` in the Dataverse adapter should call
`MicrosoftGraphProfileAdapter` (`src/data/MicrosoftGraphProfileAdapter.ts`) for
identity and profile fields (`displayName`, `jobTitle`, `department`, manager), then
merge the onboarding-specific fields (`journeyStatus`, `currentMilestone`,
`startDate`) from Dataverse. Scopes: `User.Read` (self) or `User.Read.All` (manager
viewing a report).

### Where a real AI service fits

Two seams, both already isolated:

- **Assistant** — `AppContext.sendAssistantMessage` (see "FastPass Assistant").
- **About Me profile** — `data/ProfileAnalysisService.ts`, a Power Automate flow
  returning one field per card (see "About Me").

---

## Environment-variable strategy

- The demo needs **none**. `.env.example` documents every variable.
- All client variables are prefixed `VITE_`.
- `VITE_FASTPASS_DATA_SOURCE` (`mock` | `dataverse`) selects the repository.
- `VITE_ASSISTANT_ENGINE` (`mock` | `azure-openai` | `copilot-studio`) is reserved
  for the assistant swap.
- `VITE_PROFILE_ANALYSIS` (`mock` | `power-automate`) + `VITE_PROFILE_FLOW_URL`
  select the About Me analysis source.
- Secrets (API keys, client secrets) must **never** be shipped to the browser; a real
  deployment routes AI and Dataverse calls through a backend / Power Platform.

---

## Accessibility notes

- Semantic landmarks (`header`, `nav`, `main`), a skip-to-content link, and
  `main` is focusable.
- Left navigation is a real `nav > ul > NavLink` list; the mobile drawer is a Fluent
  `OverlayDrawer` with focus management.
- Task and milestone sections use Fluent `Accordion`, which provides
  `aria-expanded` / `aria-controls` and full keyboard operation.
- Status is **never color-only**: `StatusBadge` and `MilestoneStatus` always pair an
  icon and a text label with color.
- All interactive controls are real `button` / `a` elements with descriptive labels;
  focus is visible (Fluent `colorStrokeFocus2`).
- `prefers-reduced-motion` is respected globally in `index.css`.
- The assistant transcript is an `aria-live="polite"` log.

---

## Responsiveness

| Breakpoint        | Layout                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Desktop (>1024px) | Persistent left nav, multi-column dashboard, horizontal career timeline                    |
| Tablet (≤1024px)  | Nav collapses to a drawer (hamburger), cards reflow to 1–2 columns                         |
| Mobile (≤640px)   | Single-column cards, full-width task sections, vertical career timeline, condensed top bar |

---

## Theme (light / dark)

`src/theme/ThemeProvider.tsx` wraps the app above `FluentProvider` and swaps
`webLightTheme` / `webDarkTheme`. The toggle is the sun/moon button in the top bar.
The choice is persisted to `localStorage` (`fastpass:theme`); on first visit it
follows the OS `prefers-color-scheme`. The page background behind the Fluent surface
is kept in sync via a `body.fp-theme-dark` class, with a `prefers-color-scheme` media
query covering first paint before JS runs. FastPass-specific status colors use Fluent
palette tokens so they stay readable in both modes.

## Error and empty states

Polished states (`src/components/StateViews.tsx`) cover: no employee profile, data
load failure (with retry), no tasks, no blocked / in-progress / not-started tasks
(per-section empty copy), no recommendations / all complete (success state), no
milestones, assistant unable to answer (fallback), and "all onboarding complete".
The UI never renders blank cards, `undefined`, `NaN`, or raw identifiers.

---

## Resetting local state

State is in-memory, so a full page reload restores the seed state. For tests,
`MockFastPassRepository.resetDemo()` does the same programmatically.

---

## Known MVP limitations

- Single hard-coded employee; no authentication.
- State is in-memory only — a full page reload restores the seed state (SPA
  navigation preserves changes within a session).
- The Dataverse and Graph adapters are typed placeholders that throw if selected.
- The assistant is keyword-routed, not a language model.
- The Career Journey page reflects a first-year path, not a per-employee plan.
- `getManagerSummary` is computed client-side from the same state; a real system
  would generate and send it server-side on a schedule.

---

## Walkthrough

1. **Dashboard** — employee context bar, 50% progress hero, KPI cards (5/2/2/1),
   the "Setup Laptop" blocker callout with recommended action and resource, and two
   recommended next steps (blocker first).
2. **Tasks** — four collapsible sections; each row shows an **Auto · {system}**
   chip. The **Connected systems** panel below lists every source and its latest
   readings.
3. **Milestones** — expand the buckets; "Account Setup" is Blocked because
   "Setup Laptop" is blocked; "Ready for Production Work" shows remaining count.
4. **FastPass Assistant** — click _"What should I work on next?"_: the reply names the
   blocker first, explains why, recommends the next task with its due date, and cites
   the IT Equipment Portal. Below it, the **blocker alert** and **daily summary**
   manager previews.
5. **Career Journey** — the five-stage timeline, role-based guidance, and readiness
   outlook.
