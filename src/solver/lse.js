// Solver for Roux Last Six Edges (LSE) using high-performance zero-allocation IDDFS.

import { CubeState } from '../engine/cube-state.js';
import { executeMove } from '../engine/move-executor.js';
import { isPieceSolved, getLSEEdgeOrientation, isCMLLSolved } from '../recognition/stage-recognizer.js';
import { solveBFS } from './bfs-solver.js';
import { invertMove, parseMove } from '../engine/move-parser.js';
export function isLseStage2Solvable(state) {
  // Find U corner rotation count (c_rot)
  let c_rot = -1;
  if (isCMLLSolved(state)) {
    c_rot = 0;
  } else {
    const temp = state.clone();
    for (let i = 1; i <= 3; i++) {
      executeMove(temp, parseMove("U"), { recordHistory: false });
      if (isCMLLSolved(temp)) {
        c_rot = i;
        break;
      }
    }
  }
  if (c_rot === -1) return false;

  const order = [15, 17, 7, 25, 19, 1];
  const posOrder = [
    { x: -1, y: 1, z: 0 },  // UL (expected 15)
    { x: 1, y: 1, z: 0 },   // UR (expected 17)
    { x: 0, y: 1, z: -1 },  // UB (expected 7)
    { x: 0, y: 1, z: 1 },   // UF (expected 25)
    { x: 0, y: -1, z: 1 },  // DF (expected 19)
    { x: 0, y: -1, z: -1 }  // DB (expected 1)
  ];

  const edges = posOrder.map(pos => {
    const piece = state.cubies.find(c => c.x === pos.x && c.y === pos.y && c.z === pos.z);
    return order.indexOf(piece.id);
  });

  const isAbstractStage2Solved = (c, e) => {
    const k = (4 - c) % 4;
    let cur = [...e];
    for (let i = 0; i < k; i++) {
      const next = [...cur];
      next[3] = cur[0];
      next[1] = cur[3];
      next[2] = cur[1];
      next[0] = cur[2];
      cur = next;
    }
    return cur[0] === 0 && cur[1] === 1;
  };

  const startKey = `${c_rot},${edges.join(',')}`;
  const queue = [{ c_rot, edges, d: 0 }];
  const visited = new Set([startKey]);
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    if (isAbstractStage2Solved(current.c_rot, current.edges)) {
      return true;
    }
    if (current.d >= 6) {
      continue;
    }

    // U turn
    {
      const next_c = (current.c_rot + 1) % 4;
      const next_e = [...current.edges];
      next_e[3] = current.edges[0];
      next_e[1] = current.edges[3];
      next_e[2] = current.edges[1];
      next_e[0] = current.edges[2];
      const key = `${next_c},${next_e.join(',')}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ c_rot: next_c, edges: next_e, d: current.d + 1 });
      }
    }
    // U' turn
    {
      const next_c = (current.c_rot + 3) % 4;
      const next_e = [...current.edges];
      next_e[0] = current.edges[3];
      next_e[3] = current.edges[1];
      next_e[1] = current.edges[2];
      next_e[2] = current.edges[0];
      const key = `${next_c},${next_e.join(',')}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ c_rot: next_c, edges: next_e, d: current.d + 1 });
      }
    }
    // U2 turn
    {
      const next_c = (current.c_rot + 2) % 4;
      const next_e = [...current.edges];
      next_e[0] = current.edges[1];
      next_e[1] = current.edges[0];
      next_e[2] = current.edges[3];
      next_e[3] = current.edges[2];
      const key = `${next_c},${next_e.join(',')}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ c_rot: next_c, edges: next_e, d: current.d + 1 });
      }
    }
    // M2 turn
    {
      const next_c = current.c_rot;
      const next_e = [...current.edges];
      next_e[2] = current.edges[4];
      next_e[4] = current.edges[2];
      next_e[3] = current.edges[5];
      next_e[5] = current.edges[3];
      const key = `${next_c},${next_e.join(',')}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ c_rot: next_c, edges: next_e, d: current.d + 1 });
      }
    }
  }

  return false;
}

export function solveLSEStage1(cubeState) {
  // Goal: 0 bad edges, U center is yellow or white, and Stage 2 solvable
  const goal = (s) => {
    if (getLSEEdgeOrientation(s).badEdges.length !== 0) return false;
    const uCenter = s.cubies.find(c => c.x === 0 && c.y === 1 && c.z === 0);
    if (uCenter.colors.u !== 'yellow' && uCenter.colors.u !== 'white') return false;
    return isLseStage2Solvable(s);
  };
  const allowedFaces = ['M', 'U'];
  const temp = cubeState.clone();
  return solveBFS(temp, goal, allowedFaces, 12);
}

export function isStage2Solved(s) {
  if (isPieceSolved(s, 15) && isPieceSolved(s, 17) && isCMLLSolved(s)) {
    return true;
  }
  const temp = s.clone();
  for (let i = 1; i <= 3; i++) {
    executeMove(temp, parseMove("U"), { recordHistory: false });
    if (isPieceSolved(temp, 15) && isPieceSolved(temp, 17) && isCMLLSolved(temp)) {
      return true;
    }
  }
  return false;
}

export function isStage2SolvedAligned(s) {
  if (isPieceSolved(s, 15) && isPieceSolved(s, 17) && isCMLLSolved(s)) {
    return true;
  }
  const temp = s.clone();
  executeMove(temp, parseMove("U2"), { recordHistory: false });
  if (isPieceSolved(temp, 15) && isPieceSolved(temp, 17) && isCMLLSolved(temp)) {
    return true;
  }
  return false;
}

function getStage2AlignmentMove(s) {
  if (isPieceSolved(s, 15) && isPieceSolved(s, 17) && isCMLLSolved(s)) {
    return null;
  }
  const temp = s.clone();
  executeMove(temp, parseMove("U"), { recordHistory: false });
  if (isPieceSolved(temp, 15) && isPieceSolved(temp, 17) && isCMLLSolved(temp)) {
    return parseMove("U");
  }
  executeMove(temp, parseMove("U"), { recordHistory: false });
  if (isPieceSolved(temp, 15) && isPieceSolved(temp, 17) && isCMLLSolved(temp)) {
    return null; // Solved at 2U, which is already slice-aligned!
  }
  executeMove(temp, parseMove("U"), { recordHistory: false });
  if (isPieceSolved(temp, 15) && isPieceSolved(temp, 17) && isCMLLSolved(temp)) {
    return parseMove("U'");
  }
  return null;
}

export function solveLSEStage2(cubeState) {
  // Goal: UL and UR solved relative to corners (any of 4 rotations)
  // Invariant: all 6 LSE edges remain oriented
  const goal = (s) => isStage2Solved(s);
  const invariantCheck = (s) => getLSEEdgeOrientation(s).badEdges.length === 0;
  return solveBFS(cubeState, goal, ['M', 'U'], 12, invariantCheck);
}

export function solveLSEStage3(cubeState) {
  // Goal: Entire Cube solved
  // Invariant: UL and UR remain solved relative to corners (aligned at 0U or 2U)
  const goal = (s) => s.isSolved();
  const invariantCheck = (s) => isStage2SolvedAligned(s);
  return solveBFS(cubeState, goal, ['M', 'U'], 12, invariantCheck);
}

function alignCenters(cubeState) {
  const uCenter = cubeState.cubies.find(c => c.x === 0 && c.y === 1 && c.z === 0);
  const color = uCenter.colors.u;
  if (color === 'yellow') return [];
  if (color === 'green') return [parseMove('M')];
  if (color === 'white') return [parseMove('M2')];
  if (color === 'blue') return [parseMove("M'")];
  return [];
}

export function solveLSE(cubeState) {
  let tempState = cubeState.clone();

  const alignmentMoves = alignCenters(tempState);
  for (const m of alignmentMoves) {
    executeMove(tempState, m, { recordHistory: false });
  }

  const m1_search = solveLSEStage1(tempState);
  if (!m1_search) {
    console.log("solveLSE: Stage 1 failed!");
    throw new Error("LSE Stage 1 solving failed");
  }
  for (const m of m1_search) {
    executeMove(tempState, m, { recordHistory: false });
  }

  const m1 = [...alignmentMoves, ...m1_search];
  console.log("solveLSE: m1 found:", m1.map(m => m.raw).join(' '));

  let m2 = solveLSEStage2(tempState);
  if (!m2) {
    console.log("solveLSE: Stage 2 failed! tempState details:");
    console.log("bad edges:", getLSEEdgeOrientation(tempState).badEdges);
    for (const id of [15, 17, 7, 25, 19, 1]) {
      const c = tempState.cubies.find(x => x.id === id);
      console.log(`id ${id}: pos=(${c.x}, ${c.y}, ${c.z}), colors=`, c.colors);
    }
    for (const id of [10, 22, 16, 4]) {
      const c = tempState.cubies.find(x => x.id === id);
      console.log(`id ${id}: pos=(${c.x}, ${c.y}, ${c.z}), colors=`, c.colors);
    }
    throw new Error("LSE Stage 2 solving failed");
  }
  for (const m of m2) {
    executeMove(tempState, m, { recordHistory: false });
  }

  // Align Stage 2 solution to 0U or 2U before Stage 3
  const alignment = getStage2AlignmentMove(tempState);
  if (alignment) {
    executeMove(tempState, alignment, { recordHistory: false });
    m2 = [...m2, alignment];
  }

  const m3 = solveLSEStage3(tempState);
  if (!m3) {
    throw new Error("LSE Stage 3 solving failed");
  }

  return {
    step1: m1,
    step2: m2,
    step3: m3
  };
}
