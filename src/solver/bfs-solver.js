import { executeMove } from '../engine/move-executor.js';
import { parseMove } from '../engine/move-parser.js';

export function solveBFS(initialState, goalFunc, allowedFaces, maxDepth, invariantFunc = null) {
  if (goalFunc(initialState)) return [];

  const parsedMoves = allowedFaces.flatMap(face => 
    ['', "'", '2'].map(suffix => parseMove(face + suffix))
  );

  const queue = [{ state: initialState.clone(), path: [] }];
  const visited = new Set([initialState.serialize()]);
  let cursor = 0;

  while (cursor < queue.length) {
    const current = queue[cursor++];
    if (current.path.length >= maxDepth) {
      continue;
    }

    const lastMove = current.path.length > 0 ? current.path[current.path.length - 1] : null;

    for (const move of parsedMoves) {
      if (lastMove && lastMove.face === move.face) {
        continue;
      }

      const nextState = current.state.clone();
      executeMove(nextState, move, { recordHistory: false });

      if (invariantFunc && !invariantFunc(nextState)) {
        continue;
      }

      const key = nextState.serialize();
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);

      const nextPath = [...current.path, move];
      if (goalFunc(nextState)) {
        return nextPath;
      }

      queue.push({ state: nextState, path: nextPath });
    }
  }

  return null;
}
