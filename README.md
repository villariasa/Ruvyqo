# <img src="icons/sparkles.svg" width="28" height="28" align="center" /> Ruvyqo — Next-Generation 3D Speedsolving Engine

<div align="center">

<p align="center">
  <img src="https://img.shields.io/badge/App-Ruvyqo-00F0FF?style=for-the-badge&logoColor=black" alt="Ruvyqo"/>
  <img src="https://img.shields.io/badge/Three.js-0.185-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js"/>
  <img src="https://img.shields.io/badge/Vite-8.1.1-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/JavaScript-ESModules-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/Testing-Vitest_4.1-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest"/>
  <img src="https://img.shields.io/badge/Method-Roux_(FB_/_SB_/_CMLL_/_LSE)-FF007F?style=for-the-badge" alt="Roux Method"/>
</p>

**A high-performance, interactive 3D WebGL speedcubing coach and algorithmic analysis engine built for mastering the Roux method.**  
Ditch mechanical memorization. Develop true block-building intuition, pattern recognition across all 42 CMLL cases, and effortless M-slice execution in a cyber-aesthetic simulator.

</div>

---

## <img src="icons/cpu-chip.svg" width="22" height="22" align="center" /> Why Ruvyqo?

Traditional speedcubing platforms focus narrowly on stopwatch timers or linear CFOP steps (Cross & F2L pairs). The **Roux Method** relies on structural logic, block preservation invariants, and ergonomic slice operations. 

**Ruvyqo transforms how you learn and train Roux:**

1. <img src="icons/cube.svg" width="16" height="16" align="center" /> **First Block (FB)** — Learn 1x2x3 block construction on the left lateral layer with complete move freedom and optimal piece pairing.
2. <img src="icons/cube.svg" width="16" height="16" align="center" /> **Second Block (SB)** — Master right-hand 1x2x3 block construction using the free M-slice without disturbing the solved First Block.
3. <img src="icons/bolt.svg" width="16" height="16" align="center" /> **CMLL Recognition & Algorithms** — Dedicated pattern-matching modules for all **42 CMLL cases** across 7 families (O, H, Pi, U, T, S, AS) to orient and permute last-layer corners in a single algorithmic look.
4. <img src="icons/sparkles.svg" width="16" height="16" align="center" /> **Last Six Edges (LSE / Step 4)** — Intuitive edge orientation (EO), UL/UR edge tracking, and M/U-slice parity resolution with sub-50 move efficiency.

---

## <img src="icons/bolt.svg" width="22" height="22" align="center" /> Core Features

- <img src="icons/eye.svg" width="16" height="16" align="center" /> **Interactive 3D WebGL Canvas** — 60 FPS viewport rendering built on Three.js with fluid 3D orbit controls, realistic specular lighting, and piece rotation animations.
- <img src="icons/check-badge.svg" width="16" height="16" align="center" /> **Real-Time Roux Step Recognition** — Heuristic analyzer (`stage-recognizer.js`) evaluating block invariants, edge orientation parity, and solve progress live during every turn.
- <img src="icons/command-line.svg" width="16" height="16" align="center" /> **Staged Algorithmic Solver** — Step-by-step Roux solver featuring interactive scrubber playback, move log breakdown, and phase analysis.
- <img src="icons/user-group.svg" width="16" height="16" align="center" /> **Human vs AI Competition Mode** — Live race mode featuring split timers, AI ghost playback, and move-count optimization comparisons.
- <img src="icons/window.svg" width="16" height="16" align="center" /> **Cyber Glassmorphic HUD** — Sci-fi inspired interface featuring dark glass panels, neon accent indicators, and responsive stats tracking.

---

## <img src="icons/archive-box.svg" width="22" height="22" align="center" /> Project Structure

```
Ruvyqo/
├── src/
│   ├── engine/                    # 3D Cube mechanics, rotation matrix, and state
│   ├── renderer/                  # Three.js scene, lighting, meshes, and materials
│   ├── recognition/               # Roux stage recognizer & block invariant validator
│   ├── solver/                    # Algorithmic staged Roux solver (FB / SB / CMLL / LSE)
│   ├── data/                      # 42 CMLL algorithm matrix & case definitions
│   ├── ui/                        # HUD overlays, timer panels, and onboarding modal
│   ├── persistence/               # Local solve stats and progress tracking
│   ├── main.js                    # Core orchestration lifecycle
│   └── style.css                  # Cyber-neon glassmorphic styling
├── icons/                         # Tailwind Heroicons suite
├── index.html                     # Application entry point
├── vite.config.ts                 # Build & development configuration
└── package.json                   # Dependencies & build scripts
```

---

## <img src="icons/rocket-launch.svg" width="22" height="22" align="center" /> Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- `npm` or `pnpm`

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/villariasa/Ruvyqo.git
cd Ruvyqo

# Install dependencies
npm install

# Start local development server with hot reload
npm run dev

# Run algorithmic validation tests
npm test
```

### Production Build

```bash
# Generate optimized static bundle in dist/
npm run build
```

---

## <img src="icons/document-text.svg" width="22" height="22" align="center" /> License

Proprietary © Medy Villarias. All rights reserved.
