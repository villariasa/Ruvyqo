# Roux Cyber Trainer — Phase 5 / Stretch Feature Ideas

Companion doc to `roux-learning-features-plan.md`. Kept separate since that plan is already in progress — these are additional ideas to fold in whenever there's room, roughly ordered by effort.

---

## 5.1 Algorithm Alternates + Finger-Trick Notation
**Problem:** each CMLL case in `cmll-algorithms.json` has exactly one alg. Real Roux solvers often learn 2 per case — one for raw TPS, one that's easier to recognize into. Right now there's no room for that.

**Change:**
- Extend the JSON schema per case:
  ```json
  "O_Adjacent": {
    "name": "O Adjacent Swap",
    "family": "O",
    "alg": "R U2 R' U' R U2 L' U R' U' L",
    "altAlgs": [
      { "alg": "R2 U R2 U' R2 U' D R2 U' R2 U R2 D'", "note": "Alt: no L moves, easier if hands are on the right" }
    ],
    "fingerTricks": "index flick R, no regrip until U2"
  }
  ```
- `cmll-panel.js` (from the main plan's 1.1) gets a small dropdown per case to switch between alg/altAlgs when previewing or drilling.
- Purely additive — doesn't touch solver logic, since `roux-solver.js` can keep using the primary `alg` field only.

**Effort:** Low. Mostly data entry + one UI dropdown.

---

## 5.2 Two-Look CMLL Fallback Path
**Problem:** 42 cases is a wall. Nobody starts there in real life — most people learn Sune/AntiSune + a handful of corner-permutation algs first, then "graduate" to full CMLL later.

**Change:**
- Add a `tier` field to each CMLL case: `"tier": 1` for the ~7 cases needed for 2-Look CMLL (Sune, AntiSune, and the permutation-only cases), `"tier": 2` for the rest.
- Add a mode toggle in the CMLL panel: "2-Look CMLL" vs "Full CMLL (42 cases)".
- In 2-Look mode, drilling/quizzing only pulls from `tier: 1`, and the app shows a progress bar like "6/7 mastered — ready to try full CMLL?"
- On reaching mastery threshold (e.g. 90%+ accuracy across tier-1 cases from the stats dashboard in the main plan's 3.4), show a one-time prompt suggesting the switch to full CMLL.

**Effort:** Low-Medium. Needs the stats dashboard (3.4) from the main plan to exist first for the mastery-triggered prompt; the toggle itself can ship without it.

---

## 5.3 Own-Scramble Import via Sticker Readout
**Problem:** the custom scramble box only accepts move sequences, not an actual physical cube's current state. Someone holding a real scrambled cube can't easily bring it into the trainer.

**Change:**
- New input mode next to "Custom Scramble": a 54-sticker flat-net picker (6 faces x 9 stickers) using a color palette — click a sticker, pick a color, repeat. This is a fairly standard UI pattern (unfolded cube net), can be built as inline SVG/HTML, no new library needed.
- New engine function `cubeStateFromStickers(stickerMap)` in `cube-state.js` — validates the input (correct piece/color counts, no impossible cubies) and constructs a `CubeState` directly instead of via move replay.
- Reject invalid states with a clear error ("this sticker combination isn't a valid cube state") rather than silently producing garbage.
- Once loaded, everything else (solver, lessons, stage recognizer) works unmodified since they all operate on `CubeState`.

**Effort:** Medium-High. The sticker-net UI is fiddly; the validation logic needs care (rotation/parity checks) so users can't create unsolvable states.

---

## 5.4 Surface Existing Move Rationale in the Step Log
**Problem:** `roux-solver.js` already builds an `explanation` string per recorded step (e.g. "Solve the DL edge to start the left 1x2x3 block.") — but the step-log UI currently only shows stage + moves, not this text.

**Change:**
- In `main.js`'s step-log rendering, add the `explanation` field to each list item.
- No solver changes needed — this is a pure "render data that already exists" fix, essentially free.

**Effort:** Very low. Do this one first if you want a quick win before anything else in this doc.

---

## 5.5 Blindfold-Adjacent Tracing Mode (advanced/stretch)
**Problem:** experienced Rouxers build "look-ahead" — tracking pieces mentally before executing. There's no drill for this at all currently.

**Change:**
- New toggle: "Tracing Mode" — during a stage, the 3D viewport is hidden/blurred and replaced with a text-only piece tracker (same piece-tracker UI as the Freeform Block-Building Intuition Mode in the main plan's 2.2, but with the visual cube gone).
- User has to call out/select where each remaining piece is (from a set of labeled position buttons) before revealing the cube to check.
- This depends on 2.2's piece tracker existing — build it after that lands, not before.

**Effort:** Medium. Mostly UI state work reusing existing tracking primitives once 2.2 exists.

---

## 5.6 Reconstruction Import/Export
**Problem:** the playback scrubber, step log, and stage annotations are already a great "watch and learn" tool — but only for scrambles the app generates itself. Real solve reconstructions (from alg.cubing.net, WCA reconstructions, or the user's own past solves) can't be loaded in.

**Change:**
- New input: paste a scramble + move-list pair (standard reconstruction format: `Scramble: ... / Solution: ...`).
- Parse the solution into per-stage segments using the existing `stage-recognizer.js` functions (walk the move list, checking `getRouxStage()` after each move to detect stage transitions automatically) rather than requiring the pasted reconstruction to be pre-labeled.
- Feed the result into the same playback UI already used for `solveCube()` output — same scrubber, same step log, same split timer (once 3.2 exists).
- Bonus: let users save their own full-solve history (from 3.4's stats) back out in this same text format, so their solves become shareable/importable lessons for later review.

**Effort:** Medium. Parsing is straightforward; auto-detecting stage boundaries from an arbitrary (possibly non-Roux-optimal) solution needs some care since a human solve won't always cleanly separate into FB/SB/CMLL/LSE the way the generated solver's output does.

---

## 5.7 Weakness-Driven "Recommend My Next Lesson" Button
**Problem:** once there's a stats dashboard, a lesson tree, and CMLL case accuracy tracking, users still have to decide what to practice — decision fatigue is real for a self-directed trainer.

**Change:**
- Single button (dashboard or curriculum tab): "What should I practice?"
- Simple recommendation logic, no ML needed:
  1. If any lesson in the curriculum tree is incomplete, recommend the earliest incomplete one (respects prerequisite ordering).
  2. Else, pull the single worst-accuracy CMLL case from the stats in 3.4 and offer to drill it.
  3. Else (everything mastered), recommend a full timed solve to check overall improvement.
- This is entirely a read of existing state (lesson completion flags + case accuracy table) — no new tracking needed beyond what 2.1/3.4 already produce.

**Effort:** Low, but strictly depends on 2.1 (full lesson tree) and 3.4 (stats/persistence) from the main plan existing first.

---

## Suggested order if picked up later

| Priority | Feature | Depends on |
|---|---|---|
| 1 | 5.4 Surface move rationale in step log | nothing — do anytime |
| 2 | 5.1 Alt algs + finger tricks | nothing (data-only) |
| 3 | 5.2 Two-Look CMLL fallback | main plan 3.4 for the mastery prompt (toggle itself is standalone) |
| 4 | 5.7 Recommend-next-lesson button | main plan 2.1 + 3.4 |
| 5 | 5.6 Reconstruction import/export | main plan 3.2 (split timer) for full benefit |
| 6 | 5.3 Own-scramble sticker import | nothing structurally, but fiddly UI |
| 7 | 5.5 Tracing mode | main plan 2.2 (piece tracker) |