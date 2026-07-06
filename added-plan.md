# Roux Cyber Trainer — "Actually Learn Roux" Implementation Plan

## 0. Where the app stands today (audit)

| Layer | What exists | What it's missing |
|---|---|---|
| **Curriculum tab** | Static 4 stage cards (FB/SB/CMLL/LSE) + isolate-piece highlighting | No case-level detail, no algorithms, no "why" |
| **Lessons tab** | 5 hardcoded lessons (`LESSONS` array in `main.js`), each with a fixed setup scramble + a `verify()` check | Covers only DL/BL/DBL/DR/basic EO — nowhere near full Roux; no branching, no retry logic, no hints beyond one static string |
| **CMLL data** | `src/data/cmll-algorithms.json` — **all 42 cases**, correctly grouped by family | Never imported into `main.js`. No UI panel, no case picker, no drilling |
| **Solver** | Full FB→SB→CMLL→LSE staged solve with playback scrubber, step log, per-stage move breakdown | Solver explains *what* moves, never *why* — no annotated reasoning, no alternate/optimal-vs-your-attempt comparison |
| **Recognition** | `stage-recognizer.js` can already tell you `getRouxStage()`, `isFirstBlockSolved()`, `getLSEEdgeOrientation()` | Never used for live feedback outside the 5 lessons — no real-time "you just broke SB" warning, no free-solve intuition coaching |
| **Compete mode** | Solid human-vs-AI race with a countdown, dual renderer, timer | No split times, no history, no difficulty scaling, single AI speed dial only |
| **Persistence** | None — every reload wipes all progress | No stats, no streaks, no "resume where I left off" |
| **Onboarding** | None — app drops you straight into an MVP dashboard | No explanation of what Roux even is or why it differs from CFOP |

**The core gap:** the app can execute Roux and animate it beautifully, but it doesn't yet *teach the method's logic* — block-building intuition, why CMLL only touches 4 corners, why LSE is move-restricted to M/U, or how to recognize a case instead of memorizing scrambles. Everything below is designed to close that gap.

---

## 1. Guiding principle for every feature below

Roux is learned in this order, and the app should teach in this order too:
1. **Concept** (why this stage exists / what invariant it preserves)
2. **Intuition** (free-form problem solving, not memorized algs) — this is what makes Roux "Roux" instead of "more CFOP"
3. **Recognition** (pattern-matching a case, esp. for CMLL)
4. **Algorithm execution** (only after recognition is solid)
5. **Speed / fluency** (timed drills, split times, spaced repetition)

Every phase below maps to one of these five learning layers.

---

## 2. Phase 1 — Surface what already exists (highest ROI, lowest effort)

### 1.1 CMLL Case Browser & Drill Mode
You have 42 correct algorithms sitting in a JSON file. This is the fastest feature to ship.

**New files:**
- `src/data/cmll-diagrams.js` — a small lookup that maps each case's corner sticker layout (U-face 4-corner colors + orientation) to an SVG-friendly array, generated once from each case's algorithm applied to a solved cube.
- `src/ui/cmll-panel.js` — renders the case browser (extracted out of `main.js` to keep it from growing further; see Phase 4 refactor note).

**New UI (Curriculum tab, third sub-tab "CMLL Cases"):**
- Grid of 42 cards grouped by family (O, H, Pi, U, T, L, Sune, AntiSune), each showing:
  - Mini top-down SVG diagram of the corner state (generated from `cube-state.js` colors, not hardcoded images)
  - Case name + alg in monospace
  - "Preview" button → plays the alg on an isolated mini-cube (small `Cube3DRenderer` instance scoped to just the U-layer corners, reusing your existing renderer)
  - "Drill This Case" button → scrambles the main cube to **exactly** that case (apply the alg in reverse from solved) and starts a per-case stopwatch

**Data flow:**
```js
import cmllAlgorithms from '../data/cmll-algorithms.json';

function drillCase(caseId) {
  const alg = cmllAlgorithms[caseId].alg;
  const inverse = invertSequence(alg); // new helper in move-parser.js
  cube.reset();
  executeSequence(cube, /* solved FB+SB setup */ + inverse);
  renderer.setCubeState(cube);
  startCaseTimer(caseId);
}
```

**New engine helper needed:** `invertSequence(moveString)` in `move-parser.js` — reverses order and toggles `'`/non-prime on each move. Small, ~15 lines.

**Why this matters for learning:** right now, a user finishes SB and just watches CMLL happen. This turns CMLL from "a magic animation" into the actual flashcard-based skill every Roux solver builds.

---

### 1.2 Live Stage Awareness Overlay (uses `stage-recognizer.js`, already built)
`getRouxStage()`, `isFirstBlockSolved()`, `isSecondBlockSolved()` already exist and are only used inside the 5 fixed lessons. Wire them into **free manual solving** (not just lessons):

- After every manual turn (`handleManualTurn`), call `getRouxStage(cube)` and update a persistent HUD chip: `Stage: Building FB → 2/6 pieces placed`.
- If a previously-solved stage becomes un-solved (e.g., user breaks FB while working on SB), flash a non-blocking toast: "⚠️ FB was disturbed — DBL corner is now unsolved." This is the single most requested type of feedback for anyone learning block-building, because breaking your block without noticing is the #1 beginner mistake in Roux.
- Extend `STAGE_PIECES` bookkeeping to report **partial** progress (e.g., "DL ✅, BL ❌, DBL ❌") instead of only all-or-nothing `isFirstBlockSolved`.

**File touched:** `main.js` (add a `checkLiveStageProgress()` call inside `handleManualTurn`), `stage-recognizer.js` (add `getFBPieceProgress(cube)` returning per-piece booleans).

---

## 3. Phase 2 — Real lesson depth (Concept + Intuition layers)

### 2.1 Expand `LESSONS` into a full curriculum tree
Replace the flat 5-item array with a structured, stage-complete tree. Move it out of `main.js` into `src/data/lessons.js` (data/logic separation — `main.js` is already 1047 lines and will only grow).

Proposed full lesson set (this is the actual Roux curriculum, not just what fits in an MVP):

**First Block (FB) — 6 lessons**
1. What is a "block" and why 1×2×3? (conceptual, no cube manipulation — just a diagram + text)
2. DL edge intuitive placement (exists)
3. BL edge + keeping DL intact (exists)
4. DBL corner pairing with BL edge *before* insertion (teaches the "pair then insert" intuition, not brute-force)
5. FL edge + DFL corner (second pair — currently missing entirely)
6. Full FB speed-run: scrambled cube, no hints, just a checklist

**Second Block (SB) — 4 lessons** (currently only 1 exists)
1. DR edge (exists)
2. BR edge + DBR corner pair
3. FR edge + DFR corner pair
4. Full SB speed-run using only R U r M moves (introducing move restriction awareness)

**CMLL — 3 conceptual lessons + links into the Phase 1.1 case browser**
1. "Why only corners?" — explain that FB+SB already solved all edges except the last 6
2. Reading the case: first-look corner recognition (headlights, bars, no-shape) taught as *shapes*, not memorization
3. First 8 cases (the ones with headlights, easiest) as a guided subset before the full 42-case browser

**LSE — 5 lessons** (currently 1 shallow EO lesson)
1. Why only M/U moves now (invariant preservation explanation)
2. EO (edge orientation) — exists, but add the "count bad edges, 0/2/4 rule" explanation
3. UL/UR placement via M-slice tracking
4. The "4-corner-4-edge" trigger / 6-move solutions for L/R edge + centers
5. Final step: L5EP / L4E recognition (the true finisher of Roux)

**New verify() capability needed:** most of these need partial-state verification, not just "fully solved." Add a small helper library `src/engine/verify-helpers.js` with reusable predicates (`edgePaired(cube, id1, id2)`, `blockComplete(cube, ids)`, `noBadEdges(cube)`) so lesson `verify()` functions stop being 15-line inline closures duplicated across the file.

### 2.2 Freeform Block-Building Intuition Mode
This is the feature that most separates "watching Roux" from "learning Roux." Roux is fundamentally intuitive for FB/SB — there's no algorithm to memorize, just spatial reasoning.

**New mode, toggled like Compete Mode:**
- Scrambles the cube, hides algorithmic hints entirely
- Shows only a **progress meter** ("3 of 6 FB pieces placed") and a **piece tracker** panel: 6 small icons for DL/BL/DBL/FL/DFL/L-center, greying out as each becomes solved-in-place
- A "Show me one move" assist button that, if pressed, computes just the *next single best move* toward FB completion (using your existing `first-block.js` solver internals, but exposing only one move at a time instead of the full sequence) — this teaches without giving away the whole solution
- On FB completion, auto-transitions the tracker to SB pieces

**Implementation note:** `first-block.js` already contains the logic to solve FB fully. Refactor its internal per-piece solve functions (if not already separated) to be callable individually so "next hint move" can call `solveNextFBPiece(cube)` and return just the first move of the result instead of the whole thing.

---

## 4. Phase 3 — Recognition & speed training

### 3.1 CMLL Flashcard Quiz Mode
Separate from the "Drill This Case" mode in 1.1 — this is pure recognition training, no solving required.
- Show a rendered top-down view of a random CMLL case (small isolated cube render, U layer only)
- Present 4 multiple-choice case names (1 correct, 3 distractors from the same or a visually-similar family)
- Track accuracy per family in a running session score
- After enough correct answers on a case, it drops out of the active quiz pool (basic spaced repetition, see 3.3)

### 3.2 Split-Time HUD During Full Solves
Extend the existing `solveCube()` playback (which already segments steps by `stage: 'FB'|'SB'|'CMLL'|'LSE'`) to show a running split timer, the way real speedcubers track FB time / SB time / CMLL time / LSE time separately.
- Add a small `SplitTimer` component: starts on first move, records a lap whenever `step.stage` changes in the playback loop, displays 4 lap times + total
- Store each full solve's splits in local history (see 3.4) for trend charts

### 3.3 Lightweight Spaced Repetition for weak CMLL cases
- Track `{ caseId: { attempts, correct, avgTimeMs, lastSeen } }` in local storage
- Weighted random selection for both Drill Mode (1.1) and Quiz Mode (3.1): cases with lower accuracy or older `lastSeen` are picked more often
- Small "Weak Cases" panel showing your worst 5 cases by accuracy, each clickable to drill directly

### 3.4 Progress & Stats Dashboard (new tab in the right sidebar or a modal)
Needs a `src/persistence/storage.js` module wrapping `localStorage` (namespaced key `roux-trainer:v1:*`) since nothing persists today. Track:
- Lessons completed (checklist state)
- Full-solve history: scramble, total move count, total time, per-stage split times
- CMLL case accuracy table (from 3.3)
- Compete Mode win/loss record vs AI
- Simple line chart (can reuse the existing dashboard's neon aesthetic) of solve time trend over last 20 solves — implement with plain SVG (no new dependency needed) or add `chart.js` only if you want richer interactivity

---

## 5. Phase 4 — Structural / onboarding features

### 4.1 "What is Roux?" Onboarding Modal
First-visit modal (guarded by a `localStorage` flag) explaining:
- Roux vs CFOP at a glance (block-building vs layers, fewer moves, more rotations, M-slice-heavy)
- The four stages with a small animated diagram each
- A "Start with Lesson 1" CTA that jumps straight into the curriculum tab

### 4.2 Interactive Glossary
Small searchable term list (FB, SB, CMLL, LSE, EO, headlights, bar, block, influence, M-slice, etc.) — clicking a term highlights the relevant pieces on the live cube using your existing `renderer.updateStageHighlight()`, so the glossary is spatial, not just text.

### 4.3 Codebase refactor to support all of the above
`main.js` is already 1047 lines and every phase above adds more DOM wiring. Before Phase 2–3 land, split it:
- `src/ui/curriculum-panel.js`
- `src/ui/lessons-panel.js`
- `src/ui/cmll-panel.js`
- `src/ui/compete-mode.js`
- `src/ui/stats-panel.js`
- `main.js` becomes an orchestrator that wires global cube/renderer state and imports each panel module

This isn't a user-facing feature, but skipping it means every subsequent phase gets harder to land safely — worth doing as its own small PR between Phase 1 and Phase 2.

---

## 6. Suggested build order (priority × effort)

| Priority | Feature | Effort | Depends on |
|---|---|---|---|
| 1 | CMLL Case Browser + Drill (1.1) | Medium | none — data already exists |
| 2 | Live Stage Awareness Overlay (1.2) | Low | none — recognizer already exists |
| 3 | Full Lesson Tree expansion (2.1) | Medium-High | verify-helpers.js |
| 4 | main.js modularization (4.3) | Medium | do before Phase 2/3 UI grows further |
| 5 | Freeform Block-Building Intuition Mode (2.2) | High | first-block.js refactor for single-move hints |
| 6 | CMLL Flashcard Quiz (3.1) | Low-Medium | 1.1's diagram generation |
| 7 | Split-Time HUD (3.2) | Low | none — solver already emits staged steps |
| 8 | Stats Dashboard + persistence (3.4) | Medium | storage.js |
| 9 | Spaced repetition weighting (3.3) | Low | 3.4's storage layer |
| 10 | Onboarding modal + Glossary (4.1, 4.2) | Low | can ship anytime, good "polish" pass |

---

## 7. What I'd start with today

Given your stack (Vite, three.js, no framework, no backend) and your track record of wanting surgical, verifiable changes: start with **1.1 (CMLL browser) + 1.2 (live stage overlay)**. Both use data/logic you've already written correctly, need zero new architecture, and immediately turn the app from "a solver you watch" into "a trainer you use." I can write the actual `cmll-panel.js` module plus the `invertSequence()` helper and the `main.js` wiring for either of these as a next step — just say which one to start with.