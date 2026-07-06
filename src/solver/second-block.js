// Piece-by-Piece Solver for Roux Second Block (Right 1x2x3 block).

import { isPieceSolved } from '../recognition/stage-recognizer.js';
import { executeMove } from '../engine/move-executor.js';
import { solvePattern } from './pattern-solver.js';

const SB_FACES = ['R', 'U', 'M'];

function applyMoves(cubeState, moves) {
  for (const move of moves) {
    executeMove(cubeState, move, { recordHistory: false });
  }
}

function solveStep(tempState, targetIds, maxDepth) {
  const moves = solvePattern(tempState, targetIds, SB_FACES, maxDepth);
  applyMoves(tempState, moves);
  return moves;
}

export function solveSecondBlock(cubeState) {
  const steps = {
    step1: [], // DR edge
    step2: [], // BR edge
    step3: [], // DBR corner
    step4: [], // FR edge
    step5: []  // DFR corner
  };

  let tempState = cubeState.clone();

  // 1. Solve DR Edge (ID 11).
  const m1 = solveStep(tempState, [11], 8);
  steps.step1 = m1;
  if (!isPieceSolved(tempState, 11)) throw new Error('Second Block failed while solving DR edge.');

  // 2. Solve BR Edge (ID 5), preserving DR.
  const m2 = solveStep(tempState, [11, 5], 9);
  steps.step2 = m2;
  if (!isPieceSolved(tempState, 11) || !isPieceSolved(tempState, 5)) {
    throw new Error('Second Block failed while solving BR edge.');
  }

  // 3. Solve DBR Corner (ID 2), completing the back-right square.
  const m3 = solveStep(tempState, [11, 5, 2], 11);
  steps.step3 = m3;
  if (!isPieceSolved(tempState, 11) || !isPieceSolved(tempState, 5) || !isPieceSolved(tempState, 2)) {
    throw new Error('Second Block failed while solving DBR corner.');
  }

  // 4. Solve FR Edge (ID 23), preserving the back-right square.
  const m4 = solveStep(tempState, [11, 5, 2, 23], 14);
  steps.step4 = m4;
  if (
    !isPieceSolved(tempState, 11) || !isPieceSolved(tempState, 5) ||
    !isPieceSolved(tempState, 2) || !isPieceSolved(tempState, 23)
  ) {
    throw new Error('Second Block failed while solving FR edge.');
  }

  // 5. Solve DFR Corner (ID 20), completing the right 1x2x3 block.
  const m5 = solveStep(tempState, [11, 5, 2, 23, 20], 15);
  steps.step5 = m5;
  if (
    !isPieceSolved(tempState, 11) || !isPieceSolved(tempState, 5) ||
    !isPieceSolved(tempState, 2) || !isPieceSolved(tempState, 23) ||
    !isPieceSolved(tempState, 20)
  ) {
    throw new Error('Second Block failed while solving DFR corner.');
  }

  return steps;
}
