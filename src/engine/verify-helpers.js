import { isPieceSolved, getLSEEdgeOrientation } from '../recognition/stage-recognizer.js';

/**
 * Checks if a specific piece is solved in its correct slot.
 */
export function pieceSolved(cube, id) {
  return isPieceSolved(cube, id);
}

/**
 * Checks if a list of pieces are all solved.
 */
export function piecesSolved(cube, ids) {
  return ids.every(id => isPieceSolved(cube, id));
}

/**
 * Checks if a corner and an edge are currently paired.
 * A pair means they are adjacent and their colors match.
 * Specifically, we can check if their relative position and orientation match the solved state.
 */
export function isCornerEdgePaired(cube, cornerId, edgeId, cornerRefFace, edgeRefFace) {
  const corner = cube.cubies.find(c => c.id === cornerId);
  const edge = cube.cubies.find(c => c.id === edgeId);
  if (!corner || !edge) return false;

  // Let's check if they are adjacent
  const dx = Math.abs(corner.x - edge.x);
  const dy = Math.abs(corner.y - edge.y);
  const dz = Math.abs(corner.z - edge.z);
  const dist = dx + dy + dz;
  if (dist !== 1) return false; // Must be adjacent

  // Let's check color alignment.
  // For standard CMLL corners and LSE edges:
  // Let's see if the colors on shared faces are matching or if their relative orientations match.
  // To keep it simple and robust, let's also accept if they are solved in place.
  if (isPieceSolved(cube, cornerId) && isPieceSolved(cube, edgeId)) {
    return true;
  }

  // General check: if we align their positions (e.g. bring edge next to corner),
  // do their shared colors match?
  // Let's implement a robust check for specific pairs:
  // 1. BL edge (3) and DBL corner (0)
  if (cornerId === 0 && edgeId === 3) {
    // In solved state, BL edge is at (-1, 0, -1) and DBL corner is at (-1, -1, -1).
    // They share L (-1) and B (-1) colors.
    // If they are paired, the corner's L color matches edge's L color, and B matches B.
    // Let's find which faces on the current cubies have these colors.
    const lColor = 'orange';
    const bColor = 'blue';
    const dColor = 'white';

    // Find faces on corner and edge that have orange/blue colors
    const cornerLFace = Object.keys(corner.colors).find(f => corner.colors[f] === lColor);
    const cornerBFace = Object.keys(corner.colors).find(f => corner.colors[f] === bColor);
    const edgeLFace = Object.keys(edge.colors).find(f => edge.colors[f] === lColor);
    const edgeBFace = Object.keys(edge.colors).find(f => edge.colors[f] === bColor);

    if (!cornerLFace || !cornerBFace || !edgeLFace || !edgeBFace) return false;

    // Check if the relative faces match: e.g. cornerLFace and edgeLFace should point in the same direction,
    // and cornerBFace and edgeBFace should point in the same direction.
    return cornerLFace === edgeLFace && cornerBFace === edgeBFace;
  }

  // 2. BR edge (5) and DBR corner (2)
  if (cornerId === 2 && edgeId === 5) {
    const rColor = 'red';
    const bColor = 'blue';
    const cornerRFace = Object.keys(corner.colors).find(f => corner.colors[f] === rColor);
    const cornerBFace = Object.keys(corner.colors).find(f => corner.colors[f] === bColor);
    const edgeRFace = Object.keys(edge.colors).find(f => edge.colors[f] === rColor);
    const edgeBFace = Object.keys(edge.colors).find(f => edge.colors[f] === bColor);

    if (!cornerRFace || !cornerBFace || !edgeRFace || !edgeBFace) return false;
    return cornerRFace === edgeRFace && cornerBFace === edgeBFace;
  }

  // 3. FL edge (21) and DFL corner (18)
  if (cornerId === 18 && edgeId === 21) {
    const lColor = 'orange';
    const fColor = 'green';
    const cornerLFace = Object.keys(corner.colors).find(f => corner.colors[f] === lColor);
    const cornerFFace = Object.keys(corner.colors).find(f => corner.colors[f] === fColor);
    const edgeLFace = Object.keys(edge.colors).find(f => edge.colors[f] === lColor);
    const edgeFFace = Object.keys(edge.colors).find(f => edge.colors[f] === fColor);

    if (!cornerLFace || !cornerFFace || !edgeLFace || !edgeFFace) return false;
    return cornerLFace === edgeLFace && cornerFFace === edgeFFace;
  }

  // 4. FR edge (23) and DFR corner (20)
  if (cornerId === 20 && edgeId === 23) {
    const rColor = 'red';
    const fColor = 'green';
    const cornerRFace = Object.keys(corner.colors).find(f => corner.colors[f] === rColor);
    const cornerFFace = Object.keys(corner.colors).find(f => corner.colors[f] === fColor);
    const edgeRFace = Object.keys(edge.colors).find(f => edge.colors[f] === rColor);
    const edgeFFace = Object.keys(edge.colors).find(f => edge.colors[f] === fColor);

    if (!cornerRFace || !cornerFFace || !edgeRFace || !edgeFFace) return false;
    return cornerRFace === edgeRFace && cornerFFace === edgeFFace;
  }

  return false;
}

/**
 * Checks if edge orientation is completed (all 6 LSE edges oriented).
 */
export function isEOComplete(cube) {
  const { badEdges } = getLSEEdgeOrientation(cube);
  return badEdges.length === 0;
}
