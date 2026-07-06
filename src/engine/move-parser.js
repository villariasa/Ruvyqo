// Parses standard Rubik's Cube notation moves.
// Standardizes Rw, Lw, etc. to lowercase r, l, etc.

const VALID_MOVE_REGEX = /^([RLUDFBMESrludfbmesxyz])w?(['2]?)$/;

export function parseMove(moveStr) {
  const match = moveStr.trim().match(VALID_MOVE_REGEX);
  if (!match) {
    throw new Error(`Invalid move notation: "${moveStr}"`);
  }

  let face = match[1];
  const modifier = match[2];

  // Map Rw -> r, Lw -> l, etc.
  if (moveStr.toLowerCase().endsWith('w') || moveStr.toLowerCase().includes('w')) {
    face = face.toLowerCase();
  }

  return {
    face,
    prime: modifier === "'",
    double: modifier === '2',
    raw: moveStr
  };
}

export function parseMoveSequence(seqStr) {
  if (!seqStr || typeof seqStr !== 'string') return [];
  const tokens = seqStr.trim().split(/\s+/).filter(Boolean);
  return tokens.map(parseMove);
}

// Returns the inverse of a move
export function invertMove(move) {
  return {
    ...move,
    prime: !move.double && !move.prime,
    raw: move.face + (move.double ? '2' : (move.prime ? '' : "'"))
  };
}

// Inverts an entire sequence of moves and reverses the order
export function invertSequence(moves) {
  const parsed = (Array.isArray(moves) ? moves : parseMoveSequence(moves))
    .map(move => typeof move === 'string' ? parseMove(move) : move);
  return [...parsed].reverse().map(invertMove);
}

function getQuarterTurns(move) {
  if (move.double) return 2;
  return move.prime ? 3 : 1;
}

function moveFromQuarterTurns(face, turns) {
  const normalizedTurns = ((turns % 4) + 4) % 4;
  if (normalizedTurns === 0) return null;

  const move = {
    face,
    prime: normalizedTurns === 3,
    double: normalizedTurns === 2
  };
  move.raw = getMoveString(move);
  return move;
}

export function simplifySequence(moves) {
  const parsed = (Array.isArray(moves) ? moves : parseMoveSequence(moves))
    .map(move => typeof move === 'string' ? parseMove(move) : move);
  const stack = [];

  for (const move of parsed) {
    const normalizedMove = moveFromQuarterTurns(move.face, getQuarterTurns(move));
    if (!normalizedMove) continue;

    const previousMove = stack[stack.length - 1];
    if (previousMove?.face === normalizedMove.face) {
      const combinedTurns = getQuarterTurns(previousMove) + getQuarterTurns(normalizedMove);
      const combinedMove = moveFromQuarterTurns(normalizedMove.face, combinedTurns);

      if (combinedMove) {
        stack[stack.length - 1] = combinedMove;
      } else {
        stack.pop();
      }
    } else {
      stack.push(normalizedMove);
    }
  }

  return stack;
}

// Returns the raw string notation of a move
export function getMoveString(move) {
  return move.face + (move.double ? '2' : (move.prime ? "'" : ''));
}

// Returns the raw string notation of a sequence of moves
export function getSequenceString(moves) {
  return moves.map(getMoveString).join(' ');
}
