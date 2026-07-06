// Roux Method Solve Orchestrator.
// Builds and verifies FB -> SB -> CMLL -> LSE so playback demonstrates the
// method stages instead of hiding everything in one full-cube inverse.

import { executeMove } from '../engine/move-executor.js';
import { getSequenceString } from '../engine/move-parser.js';
import {
  isFirstBlockSolved,
  isSecondBlockSolved,
  isCMLLSolved
} from '../recognition/stage-recognizer.js';

import { solveFirstBlock } from './first-block.js';
import { solveSecondBlock } from './second-block.js';
import { solveCMLL } from './cmll.js';
import { solveLSE } from './lse.js';

function moveCount(steps) {
  return steps.flatMap(step => step.moves.split(' ').filter(Boolean)).length;
}

export function solveCube(initialCubeState, options = {}) {
  const stages = {
    fb: options.fb ?? true,
    sb: options.sb ?? true,
    cmll: options.cmll ?? true,
    lse: options.lse ?? true
  };

  const steps = [];
  const currentState = initialCubeState.clone();

  function recordStep(stage, name, moves, explanation) {
    const normalizedMoves = moves ?? [];
    const stateBefore = currentState.clone();

    for (const move of normalizedMoves) {
      executeMove(currentState, move, { recordHistory: false });
    }

    steps.push({
      stage,
      name,
      moves: getSequenceString(normalizedMoves),
      explanation,
      stateBefore,
      stateAfter: currentState.clone()
    });
  }

  if (currentState.isSolved()) {
    return {
      steps: [],
      totalMoves: '',
      moveCount: 0,
      source: 'roux'
    };
  }

  // --- STAGE 1: FIRST BLOCK (FB) ---
  if (stages.fb) {
    const fbRes = solveFirstBlock(currentState);

    recordStep(
      'FB',
      'First Block: DL Edge',
      fbRes.step1,
      'Solve the DL edge to start the left 1x2x3 block.'
    );

    recordStep(
      'FB',
      'First Block: BL Edge',
      fbRes.step2,
      'Place the BL edge while keeping the DL edge solved.'
    );

    recordStep(
      'FB',
      'First Block: DBL Corner',
      fbRes.step3,
      'Insert DBL to complete the back-left 1x2x2 square.'
    );

    recordStep(
      'FB',
      'First Block: FL Edge',
      fbRes.step4,
      'Place the FL edge while preserving the solved back-left square.'
    );

    recordStep(
      'FB',
      'First Block: DFL Corner',
      fbRes.step5,
      'Insert DFL to complete the left 1x2x3 first block.'
    );

    if (!isFirstBlockSolved(currentState)) {
      throw new Error('Roux solver failed: First Block is not solved after FB.');
    }
  }

  // --- STAGE 2: SECOND BLOCK (SB) ---
  if (stages.sb) {
    const sbRes = solveSecondBlock(currentState);

    recordStep(
      'SB',
      'Second Block: DR Edge',
      sbRes.step1,
      'Solve the DR edge to start the right 1x2x3 block.'
    );

    recordStep(
      'SB',
      'Second Block: BR Edge',
      sbRes.step2,
      'Place the BR edge while preserving the first block.'
    );

    recordStep(
      'SB',
      'Second Block: DBR Corner',
      sbRes.step3,
      'Insert DBR to complete the back-right 1x2x2 square.'
    );

    recordStep(
      'SB',
      'Second Block: FR Edge',
      sbRes.step4,
      'Place the FR edge while preserving both back squares.'
    );

    recordStep(
      'SB',
      'Second Block: DFR Corner',
      sbRes.step5,
      'Insert DFR to complete the right 1x2x3 second block.'
    );

    if (stages.fb && !isFirstBlockSolved(currentState)) {
      throw new Error('Roux solver failed: First Block was broken during SB.');
    }
    if (!isSecondBlockSolved(currentState)) {
      throw new Error('Roux solver failed: Second Block is not solved after SB.');
    }
  }

  // --- STAGE 3: CMLL ---
  if (stages.cmll) {
    const cmllResult = solveCMLL(currentState);
    recordStep(
      'CMLL',
      `CMLL: ${cmllResult.caseName}`,
      cmllResult.moves,
      `Recognized ${cmllResult.caseName}; solve the four U-layer corners without losing the blocks.`
    );

    if (stages.fb && !isFirstBlockSolved(currentState)) {
      throw new Error('Roux solver failed: Blocks were broken during CMLL.');
    }
    if (stages.sb && !isSecondBlockSolved(currentState)) {
      throw new Error('Roux solver failed: Blocks were broken during CMLL.');
    }
    if (!isCMLLSolved(currentState)) {
      throw new Error('Roux solver failed: CMLL corners are not solved.');
    }
  }

  // --- STAGE 4: LAST SIX EDGES (LSE) ---
  if (stages.lse) {
    const lseRes = solveLSE(currentState);

    recordStep(
      'LSE',
      'LSE: Edge Orientation',
      lseRes.step1,
      'Orient the six remaining edges so M/U moves can finish the cube.'
    );

    recordStep(
      'LSE',
      'LSE: UL/UR Placement',
      lseRes.step2,
      'Place UL and UR while maintaining edge orientation.'
    );

    recordStep(
      'LSE',
      'LSE: M-slice Permutation',
      lseRes.step3,
      'Permute the final M-slice edges and align centers.'
    );

    if (stages.fb && stages.sb && stages.cmll && !currentState.isSolved()) {
      console.log("Roux solver failed. currentState details:");
      for (const c of currentState.cubies) {
        const init = { x: (c.id % 3) - 1, y: Math.floor((c.id % 9) / 3) - 1, z: Math.floor(c.id / 9) - 1 };
        if (c.x !== init.x || c.y !== init.y || c.z !== init.z) {
          console.log(`Misplaced cubie ${c.id}: pos=(${c.x}, ${c.y}, ${c.z}) vs init=(${init.x}, ${init.y}, ${init.z})`);
        }
      }
      throw new Error('Roux solver failed: Cube is not solved after LSE.');
    }
  }

  return {
    steps,
    totalMoves: steps.map(step => step.moves).filter(Boolean).join(' '),
    moveCount: moveCount(steps),
    source: 'roux'
  };
}
