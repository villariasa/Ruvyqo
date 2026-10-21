# Roux Cyber Trainer — Interactive 3D Speedsolving Engine

<div align="center">

<p align="center">
  <img src="https://img.shields.io/badge/Three.js-0.185-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js"/>
  <img src="https://img.shields.io/badge/Vite-8.1.1-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/JavaScript-ESModules-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/Testing-Vitest_4.1-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest"/>
  <img src="https://img.shields.io/badge/Method-Roux_(FB_/_SB_/_CMLL_/_LSE)-FF4500?style=for-the-badge" alt="Roux Method"/>
</p>

**A next-generation 3D interactive speedsolving trainer and algorithmic analysis engine built for the Roux method.**  
Master block-building intuition, pattern recognition for all 42 CMLL algorithms, and M/U-slice fluency in an immersive WebGL environment.

</div>

---

## 🧩 Why Roux Cyber Trainer?

Most speedcubing applications focus strictly on timer functions or linear CFOP algorithms. The **Roux Method** requires deep intuition, freedom of block-building, and precise corner orientation without destroying lateral blocks.

Roux Cyber Trainer breaks speedcubing down into intuitive, structured mastery layers:

1. **First Block (FB)** — 1x2x3 block-building mechanics on the left lateral layer with zero move restrictions.
2. **Second Block (SB)** — Non-destructive right 1x2x3 block construction leveraging the free M-slice.
3. **CMLL Mastery** — Pattern recognition and algorithmic execution for all **42 CMLL cases** across 7 families (O, H, Pi, U, T, S, AS) without disturbing F2B.
4. **Last Six Edges (LSE / Step 4)** — Edge Orientation (EO), UL/UR edge placement, and M/U-slice parity resolution.

---

## 🌟 Core Features

- **Interactive 3D WebGL Canvas:** Smooth 60 FPS viewport rendering powered by Three.js with orbit controls, realistic specular lighting, and fluid piece rotations.
- **Roux Step Recognition:** Automated heuristics (`stage-recognizer.js`) detecting solve completion percentage, block invariants, and misoriented edges in real time.
- **Staged Algorithmic Solver:** Multi-phase automated Roux solver featuring step scrubbing, replay controls, and detailed move notation breakdowns.
- **Human vs AI Competition Mode:** Duel mode featuring real-time split timers, AI ghost playback, and comparative move-efficiency analysis.
- **Zero-Dependency Lightweight Build:** Built on native ES modules and Vite for sub-second startup times.

---

## 📁 Project Structure

```
ui-hotel/
├── src/
│   ├── engine/                    # 3D Cube mechanics, rotation matrix, and state
│   ├── renderer/                  # Three.js scene, lighting, meshes, and materials
│   ├── recognition/               # Roux stage recognizer & block validator
│   ├── solver/                    # Algorithmic staged Roux solver (FB/SB/CMLL/LSE)
│   ├── data/                      # 42 CMLL algorithms & case definition matrices
│   ├── ui/                        # HUD panels, timer overlays, and interactive modals
│   ├── main.js                    # Core event orchestration & lifecycle
│   └── style.css                  # Modern cyber-aesthetic styling
├── index.html                     # Web entry point
├── vite.config.ts                 # Build & development configuration
└── package.json                   # Scripts & dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- `npm` or `pnpm`

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/villariasa/ui-hotel.git
cd ui-hotel

# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit and algorithmic verification tests
npm test
```

### Production Build

```bash
# Generate optimized static bundle in dist/
npm run build
```

---

## 📄 License

Proprietary © Medy Villarias. All rights reserved.
