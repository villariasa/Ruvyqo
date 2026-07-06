import { piecesSolved, pieceSolved, isCornerEdgePaired, isEOComplete } from '../engine/verify-helpers.js';
import { isFirstBlockSolved, isSecondBlockSolved, isCMLLSolved } from '../recognition/stage-recognizer.js';

export const LESSONS = [
  // --- FIRST BLOCK (FB) ---
  {
    id: 'fb_concept',
    title: 'Lesson 1: What is a "Block"?',
    step: 'First Block',
    type: 'conceptual',
    objective: 'Understand the Roux First Block (FB) concept: building a 1x2x3 block on the Left side without rotations.',
    explanation: 'Unlike CFOP which starts with a cross and builds layers, Roux builds a 1x2x3 block. This is built around the Left center (Orange) and includes 6 pieces: DL edge, BL edge, DBL corner, FL edge, DFL corner, and the Left center. By building blocks instead of layers, you preserve the top layer (U) and middle slice (M) for intuitive moves, using fewer moves overall.'
  },
  {
    id: 'fb_dl',
    title: 'Lesson 2: DL Edge Placement',
    step: 'First Block',
    type: 'interactive',
    setupScramble: "U' L2 U L2 U' L2",
    objective: 'Solve the DL edge (Orange/White) to its bottom-left position.',
    hint: 'Bring the DL edge down to its slot. Try: U L2',
    verify: (cube) => pieceSolved(cube, 9)
  },
  {
    id: 'fb_bl',
    title: 'Lesson 3: BL Edge Placement',
    step: 'First Block',
    type: 'interactive',
    setupScramble: "U M2 U' M2",
    objective: 'Solve the BL edge (Orange/Blue) while keeping the DL edge solved.',
    hint: 'Use M-slice turns to position the edge on U, then align and insert. Try: U M2 U\'',
    verify: (cube) => piecesSolved(cube, [9, 3])
  },
  {
    id: 'fb_dbl',
    title: 'Lesson 4: Back-Left Pair (DBL Corner)',
    step: 'First Block',
    type: 'interactive',
    setupScramble: "U R U' R' U' L2",
    objective: 'Pair the DBL corner (Orange/Blue/White) with the BL edge before inserting it, completing the back-left 1x2x2 square.',
    hint: 'Pair the corner with the BL edge on the U layer, then insert the pair together. Try: U R U\' R\'',
    verify: (cube) => isCornerEdgePaired(cube, 0, 3) || piecesSolved(cube, [9, 3, 0])
  },
  {
    id: 'fb_fl_dfl',
    title: 'Lesson 5: Front-Left Pair (FL & DFL)',
    step: 'First Block',
    type: 'interactive',
    setupScramble: "U R U' R' U F' U' F",
    objective: 'Solve the FL edge (Orange/Green) and DFL corner (Orange/Green/White) to complete the Left 1x2x3 block.',
    hint: 'Solve the FL edge and DFL corner together. Try: U R U\' R\' followed by inserting the pair into front-left.',
    verify: (cube) => piecesSolved(cube, [9, 3, 0, 21, 18])
  },
  {
    id: 'fb_full',
    title: 'Lesson 6: Full First Block Speed-run',
    step: 'First Block',
    type: 'interactive',
    setupScramble: "F2 U L2 U2 F2 L2 D R2 B' R2 B2 U2 L",
    objective: 'Build the entire Left 1x2x3 block from a scrambled start without any visual guides or stage constraints.',
    hint: 'Focus on DL edge first, then build the back-left square, and finish with the front-left pair.',
    verify: (cube) => isFirstBlockSolved(cube)
  },

  // --- SECOND BLOCK (SB) ---
  {
    id: 'sb_dr',
    title: 'Lesson 7: DR Edge Placement',
    step: 'Second Block',
    type: 'interactive',
    setupScramble: "U R2 U' R2",
    objective: 'Solve the DR edge (Red/White) on the right side while keeping the Left block completely intact.',
    hint: 'Position the DR edge on the U layer, then use R turns to place it. Try: U R2 U\'',
    verify: (cube) => isFirstBlockSolved(cube) && pieceSolved(cube, 11)
  },
  {
    id: 'sb_br_dbr',
    title: 'Lesson 8: Back-Right Pair (BR & DBR)',
    step: 'Second Block',
    type: 'interactive',
    setupScramble: "U R U' R' U R2 U' R2",
    objective: 'Pair and solve the BR edge (Red/Blue) and DBR corner (Red/Blue/White) while keeping FB and DR solved.',
    hint: 'Pair them up on the U layer, then insert into the back-right slot. Try: U R U\' R\'',
    verify: (cube) => isFirstBlockSolved(cube) && piecesSolved(cube, [11, 5, 2])
  },
  {
    id: 'sb_fr_dfr',
    title: 'Lesson 9: Front-Right Pair (FR & DFR)',
    step: 'Second Block',
    type: 'interactive',
    setupScramble: "U R U' R' U F R' F' R",
    objective: 'Pair and insert the FR edge (Red/Green) and DFR corner (Red/Green/White) to complete the right 1x2x3 block.',
    hint: 'Ensure your Left block remains safe. Pair the FR pair and insert. Try: U R U\' R\'',
    verify: (cube) => isFirstBlockSolved(cube) && isSecondBlockSolved(cube)
  },
  {
    id: 'sb_full',
    title: 'Lesson 10: SB Move Restrictions (R U r M)',
    step: 'Second Block',
    type: 'interactive',
    setupScramble: "U R U2 R' U R U' R'",
    objective: 'Solve the Right block using ONLY R, U, r, and M turns, which is the key to Roux efficiency.',
    hint: 'Restricting moves to R, U, r, and M preserves your completed Left block. Try: U R U2 R\'',
    verify: (cube) => isFirstBlockSolved(cube) && isSecondBlockSolved(cube)
  },

  // --- CMLL ---
  {
    id: 'cmll_concept',
    title: 'Lesson 11: Why Only U Corners?',
    step: 'CMLL Stage',
    type: 'conceptual',
    objective: 'Learn why the third stage of Roux (CMLL) focuses solely on orienting and permuting the four U-layer corners.',
    explanation: 'Since the First Block and Second Block occupy the entire Left and Right slices, all 8 bottom-layer pieces and 2 side centers are solved. The remaining unsolved pieces are the 4 U-layer corners and 6 edges (4 on top, 2 in the bottom middle). Because edges can be solved using M and U moves later, we can solve all 4 corners first using a single algorithm from the CMLL set (42 algorithms total) while leaving the bottom blocks intact.'
  },
  {
    id: 'cmll_recognition',
    title: 'Lesson 12: Corner Pattern Recognition',
    step: 'CMLL Stage',
    type: 'conceptual',
    objective: 'Understand how to recognize CMLL cases by looking at corner orientations (Sune, Bowtie, Headlights, etc.).',
    explanation: 'CMLL is divided into 8 families based on the yellow sticker orientation on the top face. For example, "Sune" has 1 corner pointing up, "H" has 0 corners up with double headlights, and "Pi" has 0 corners up with offset side stickers. Once you identify the orientation family, look at the side stickers of the corners to determine the specific permutation swap case (Adjacent, Diagonal, Columns, Rows, etc.)'
  },
  {
    id: 'cmll_drill_headlights',
    title: 'Lesson 13: CMLL Headlights Case',
    step: 'CMLL Stage',
    type: 'interactive',
    setupScramble: "R U2 R' U' R U' R2 U2 R U R' U R",
    objective: 'Solve the CMLL corners when you recognize the Headlights (T family) layout.',
    hint: 'Apply the T Rows CMLL algorithm: R U2 R\' U\' R U\' R2 U2 R U R\' U R',
    verify: (cube) => isFirstBlockSolved(cube) && isSecondBlockSolved(cube) && isCMLLSolved(cube)
  },

  // --- LAST SIX EDGES (LSE) ---
  {
    id: 'lse_concept',
    title: 'Lesson 14: M/U Move Invariants',
    step: 'LSE Stage',
    type: 'conceptual',
    objective: 'Discover why the Last Six Edges (LSE) can be solved using exclusively M and U moves.',
    explanation: 'At LSE, the two 1x2x3 blocks on Left and Right are fully solved, leaving only the M-slice (middle) and U-layer edges unsolved. Since L and R blocks are locked, we are only allowed to turn the U face and the M slice. Turning U and M never breaks the Left and Right blocks, allowing us to solve the remaining 6 edges and center orientation in three simple steps.'
  },
  {
    id: 'lse_eo',
    title: 'Lesson 15: Edge Orientation (EO)',
    step: 'LSE Stage',
    type: 'interactive',
    setupScramble: "M' U M U' M' U M",
    objective: 'Orient the remaining six edges using M and U turns (0/2/4/6 rule).',
    hint: 'Count the bad edges (misoriented). An edge is bad if its U/D sticker is pointing to the side. Align bad edges on U and M and flip them. Try: M\' U M',
    verify: (cube) => isFirstBlockSolved(cube) && isSecondBlockSolved(cube) && isCMLLSolved(cube) && isEOComplete(cube)
  },
  {
    id: 'lse_ul_ur',
    title: 'Lesson 16: UL/UR Edge Placement',
    step: 'LSE Stage',
    type: 'interactive',
    setupScramble: "M2 U M2 U M2 U M2",
    objective: 'Place the UL and UR edges in their slots on the Left and Right sides while preserving Edge Orientation.',
    hint: 'Bring UL and UR edges to the bottom middle slice, align them, and insert them with M2 turns. Try: M2 U M2',
    verify: (cube) => {
      return isFirstBlockSolved(cube) && isSecondBlockSolved(cube) && isCMLLSolved(cube) &&
             pieceSolved(cube, 15) && pieceSolved(cube, 17); // UL and UR edges solved
    }
  },
  {
    id: 'lse_m_slice',
    title: 'Lesson 17: M-Slice & Center Permutation',
    step: 'LSE Stage',
    type: 'interactive',
    setupScramble: "M2 U2 M2 U2",
    objective: 'Solve the remaining four middle edges (UF, UB, DF, DB) and align centers to complete the cube.',
    hint: 'Swap top and bottom edges using M2. Try: M2 U2 M2 U2',
    verify: (cube) => cube.isSolved()
  },
  {
    id: 'lse_full',
    title: 'Lesson 18: LSE Grand Finisher',
    step: 'LSE Stage',
    type: 'interactive',
    setupScramble: "M' U M U M2 U' M' U2 M U' M2",
    objective: 'Solve all Last Six Edges (LSE) from scratch: EO first, then UL/UR edges, and finally M-slice permutation.',
    hint: 'Orient edges first, then place UL/UR, then solve the middle slice.',
    verify: (cube) => cube.isSolved()
  }
];
