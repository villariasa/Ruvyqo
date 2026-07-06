import { CubeState } from '../engine/cube-state.js';
import { executeMove } from '../engine/move-executor.js';
import { getMoveString, invertSequence, parseMove } from '../engine/move-parser.js';

const MODIFIERS = ['', "'", '2'];
const searchCache = new Map();

function buildMoves(allowedFaces) {
  return allowedFaces.flatMap(face => MODIFIERS.map(mod => parseMove(face + mod)));
}

function patternKey(cubeState, targetIds) {
  return targetIds.map(id => {
    const cubie = cubeState.cubies.find(c => c.id === id);
    return [
      cubie.x,
      cubie.y,
      cubie.z,
      cubie.colors.u?.[0] ?? '-',
      cubie.colors.d?.[0] ?? '-',
      cubie.colors.f?.[0] ?? '-',
      cubie.colors.b?.[0] ?? '-',
      cubie.colors.l?.[0] ?? '-',
      cubie.colors.r?.[0] ?? '-'
    ].join('');
  }).join('|');
}

function cacheKey(targetIds, allowedFaces) {
  return `${targetIds.join(',')}::${allowedFaces.join(',')}`;
}

function getSearchTable(targetIds, allowedFaces) {
  const key = cacheKey(targetIds, allowedFaces);
  if (searchCache.has(key)) {
    return searchCache.get(key);
  }

  const solved = new CubeState();
  const table = {
    targetIds,
    allowedFaces,
    moves: buildMoves(allowedFaces),
    visited: new Map([[patternKey(solved, targetIds), []]]),
    queue: [{ state: solved, path: [], lastFace: null }],
    cursor: 0
  };

  searchCache.set(key, table);
  return table;
}

function expandUntilFound(table, wantedKey, maxDepth) {
  while (!table.visited.has(wantedKey) && table.cursor < table.queue.length) {
    const node = table.queue[table.cursor];
    if (node.path.length >= maxDepth) {
      break;
    }
    table.cursor++;

    for (const move of table.moves) {
      if (move.face === node.lastFace) {
        continue;
      }

      const nextState = node.state.clone();
      executeMove(nextState, move, { recordHistory: false });

      const nextKey = patternKey(nextState, table.targetIds);
      if (table.visited.has(nextKey)) {
        continue;
      }

      const nextPath = [...node.path, getMoveString(move)];
      table.visited.set(nextKey, nextPath);
      table.queue.push({
        state: nextState,
        path: nextPath,
        lastFace: move.face
      });
    }
  }
}

export function solvePattern(cubeState, targetIds, allowedFaces, maxDepth = 10) {
  const table = getSearchTable(targetIds, allowedFaces);
  const wantedKey = patternKey(cubeState, targetIds);

  expandUntilFound(table, wantedKey, maxDepth);

  const pathFromSolved = table.visited.get(wantedKey);
  if (!pathFromSolved) {
    throw new Error(
      `No Roux pattern path found for pieces ${targetIds.join(', ')} with ${allowedFaces.join('/')} moves to depth ${maxDepth}.`
    );
  }

  return invertSequence(pathFromSolved);
}

