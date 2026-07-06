// Identifies the current Roux solve stage and verifies stage invariants.

import { FACE_COLORS } from '../engine/cube-state.js';

// Cubie IDs for Roux structures
export const FB_CUBIE_IDS = [9, 21, 3, 18, 0];  // DL, FL, BL, DFL, DBL
export const SB_CUBIE_IDS = [11, 23, 5, 20, 2]; // DR, FR, BR, DFR, DBR
export const CMLL_CUBIE_IDS = [24, 26, 6, 8];  // UFL, UFR, UBL, UBR
export const LSE_CUBIE_IDS = [15, 17, 25, 7, 19, 1]; // UL, UR, UF, UB, DF, DB

export function isPieceSolved(cubeState, id) {
  const cubie = cubeState.cubies.find(c => c.id === id);
  if (!cubie) return false;

  // Expected positions based on ID
  const z = Math.floor(id / 9) - 1;
  const y = Math.floor((id % 9) / 3) - 1;
  const x = (id % 3) - 1;

  if (cubie.x !== x || cubie.y !== y || cubie.z !== z) {
    return false;
  }

  // Check correct orientation
  if (y === 1 && cubie.colors.u !== FACE_COLORS.u) return false;
  if (y === -1 && cubie.colors.d !== FACE_COLORS.d) return false;
  if (z === 1 && cubie.colors.f !== FACE_COLORS.f) return false;
  if (z === -1 && cubie.colors.b !== FACE_COLORS.b) return false;
  if (x === -1 && cubie.colors.l !== FACE_COLORS.l) return false;
  if (x === 1 && cubie.colors.r !== FACE_COLORS.r) return false;

  return true;
}

export function isFirstBlockSolved(cubeState) {
  return FB_CUBIE_IDS.every(id => isPieceSolved(cubeState, id));
}

export function isSecondBlockSolved(cubeState) {
  return SB_CUBIE_IDS.every(id => isPieceSolved(cubeState, id));
}

export function isCMLLSolved(cubeState) {
  return CMLL_CUBIE_IDS.every(id => isPieceSolved(cubeState, id));
}

export function getLSEEdgeOrientation(cubeState) {
  const badEdges = [];
  const goodEdges = [];

  for (const id of LSE_CUBIE_IDS) {
    const cubie = cubeState.cubies.find(c => c.id === id);
    if (!cubie) continue;

    // Find which face of the cubie has the U/D color (yellow/white)
    const udFace = Object.keys(cubie.colors).find(
      face => cubie.colors[face] === FACE_COLORS.u || cubie.colors[face] === FACE_COLORS.d
    );

    const isOriented = udFace === 'u' || udFace === 'd';
    if (isOriented) {
      goodEdges.push(id);
    } else {
      badEdges.push(id);
    }
  }

  return { goodEdges, badEdges };
}

export function getRouxStage(cubeState) {
  if (cubeState.isSolved()) {
    return 'SOLVED';
  }
  
  const fb = isFirstBlockSolved(cubeState);
  const sb = isSecondBlockSolved(cubeState);
  const cmll = isCMLLSolved(cubeState);

  if (fb && sb && cmll) {
    return 'LSE';
  }
  if (fb && sb) {
    return 'CMLL';
  }
  if (fb) {
    return 'SB';
  }
  return 'FB';
}

export function getFBPieceProgress(cubeState) {
  const pieces = {
    'DL edge': 9,
    'BL edge': 3,
    'DBL corner': 0,
    'FL edge': 21,
    'DFL corner': 18,
    'L center': 12
  };
  const progress = {};
  let solvedCount = 0;
  for (const [name, id] of Object.entries(pieces)) {
    const solved = isPieceSolved(cubeState, id);
    progress[name] = solved;
    if (solved) solvedCount++;
  }
  return { progress, solvedCount, totalCount: 6 };
}

export function getSBPieceProgress(cubeState) {
  const pieces = {
    'DR edge': 11,
    'BR edge': 5,
    'DBR corner': 2,
    'FR edge': 23,
    'DFR corner': 20,
    'R center': 14
  };
  const progress = {};
  let solvedCount = 0;
  for (const [name, id] of Object.entries(pieces)) {
    const solved = isPieceSolved(cubeState, id);
    progress[name] = solved;
    if (solved) solvedCount++;
  }
  return { progress, solvedCount, totalCount: 6 };
}
