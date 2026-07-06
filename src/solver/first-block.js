// Piece-by-Piece Solver for Roux First Block (Left 1x2x3 block).

import { isPieceSolved } from '../recognition/stage-recognizer.js';
import { executeMove } from '../engine/move-executor.js';
import { solvePattern } from './pattern-solver.js';

function applyMoves(cubeState, moves) {
  for (const move of moves) {
    executeMove(cubeState, move, { recordHistory: false });
  }
}

function solveStep(tempState, targetIds, allowedFaces, maxDepth) {
  const moves = solvePattern(tempState, targetIds, allowedFaces, maxDepth);
  applyMoves(tempState, moves);
  return moves;
}

export function solveFirstBlock(cubeState) {
  const steps = {
    step1: [], // DL edge
    step2: [], // BL edge
    step3: [], // DBL corner
    step4: [], // FL edge
    step5: []  // DFL corner
  };

  let tempState = cubeState.clone();

  // 1. Solve DL Edge (ID 9).
  const m1 = solveStep(tempState, [9], ['R', 'L', 'U', 'D', 'F', 'B'], 7);
  steps.step1 = m1;
  if (!isPieceSolved(tempState, 9)) throw new Error('First Block failed while solving DL edge.');

  // 2. Solve BL Edge (ID 3) while keeping DL solved.
  const m2 = solveStep(tempState, [9, 3], ['R', 'U', 'F', 'B', 'M'], 9);
  steps.step2 = m2;
  if (!isPieceSolved(tempState, 9) || !isPieceSolved(tempState, 3)) {
    throw new Error('First Block failed while solving BL edge.');
  }

  // 3. Solve DBL Corner (ID 0), completing the back-left square.
  const m3 = solveStep(tempState, [9, 3, 0], ['R', 'U', 'F', 'B', 'M'], 10);
  steps.step3 = m3;
  if (!isPieceSolved(tempState, 9) || !isPieceSolved(tempState, 3) || !isPieceSolved(tempState, 0)) {
    throw new Error('First Block failed while solving DBL corner.');
  }

  // 4. Solve FL Edge (ID 21), preserving the back-left square.
  const m4 = solveStep(tempState, [9, 3, 0, 21], ['R', 'U', 'F', 'M'], 10);
  steps.step4 = m4;
  if (
    !isPieceSolved(tempState, 9) || !isPieceSolved(tempState, 3) ||
    !isPieceSolved(tempState, 0) || !isPieceSolved(tempState, 21)
  ) {
    throw new Error('First Block failed while solving FL edge.');
  }

  // 5. Solve DFL Corner (ID 18), completing the left 1x2x3 block.
  const m5 = solveStep(tempState, [9, 3, 0, 21, 18], ['R', 'U', 'F', 'M'], 11);
  steps.step5 = m5;
  if (
    !isPieceSolved(tempState, 9) || !isPieceSolved(tempState, 3) ||
    !isPieceSolved(tempState, 0) || !isPieceSolved(tempState, 21) ||
    !isPieceSolved(tempState, 18)
  ) {
    throw new Error('First Block failed while solving DFL corner.');
  }

  return steps;
}
