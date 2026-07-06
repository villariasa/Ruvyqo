// Executes moves on a CubeState instance using 3D coordinate rotations.

import { getMoveString, parseMoveSequence, simplifySequence } from './move-parser.js';

// Primitive 90-degree rotations
function rotateCWX(cubie) {
  // y_new = z, z_new = -y
  const newY = cubie.z;
  const newZ = -cubie.y;
  cubie.y = newY;
  cubie.z = newZ;

  // Colors: (u, b, d, f) = (f, u, b, d)
  // new_u = f, new_b = u, new_d = b, new_f = d
  const temp = cubie.colors.u;
  cubie.colors.u = cubie.colors.f;
  cubie.colors.f = cubie.colors.d;
  cubie.colors.d = cubie.colors.b;
  cubie.colors.b = temp;
}

function rotateCCWX(cubie) {
  // y_new = -z, z_new = y
  const newY = -cubie.z;
  const newZ = cubie.y;
  cubie.y = newY;
  cubie.z = newZ;

  // Colors: (u, f, d, b) = (b, u, f, d)
  // new_u = b, new_b = d, new_d = f, new_f = u
  const temp = cubie.colors.u;
  cubie.colors.u = cubie.colors.b;
  cubie.colors.b = cubie.colors.d;
  cubie.colors.d = cubie.colors.f;
  cubie.colors.f = temp;
}

function rotateCWY(cubie) {
  // x_new = -z, z_new = x
  const newX = -cubie.z;
  const newZ = cubie.x;
  cubie.x = newX;
  cubie.z = newZ;

  // Colors: (r, b, l, f) = (f, r, b, l)
  // Correct mapping for CW around +y (looking from top):
  // new_r = b, new_f = r, new_l = f, new_b = l
  const temp = cubie.colors.r;
  cubie.colors.r = cubie.colors.b;
  cubie.colors.b = cubie.colors.l;
  cubie.colors.l = cubie.colors.f;
  cubie.colors.f = temp;
}

function rotateCCWY(cubie) {
  // x_new = z, z_new = -x
  const newX = cubie.z;
  const newZ = -cubie.x;
  cubie.x = newX;
  cubie.z = newZ;

  // Colors: (r, f, l, b) = (b, r, f, l)
  // Correct mapping for CCW around +y:
  // new_r = f, new_b = r, new_l = b, new_f = l
  const temp = cubie.colors.r;
  cubie.colors.r = cubie.colors.f;
  cubie.colors.f = cubie.colors.l;
  cubie.colors.l = cubie.colors.b;
  cubie.colors.b = temp;
}

function rotateCWZ(cubie) {
  // x_new = y, y_new = -x
  const newX = cubie.y;
  const newY = -cubie.x;
  cubie.x = newX;
  cubie.y = newY;

  // Colors: (r, d, l, u) = (u, r, d, l)
  // new_r = u, new_d = r, new_l = d, new_u = l
  const temp = cubie.colors.r;
  cubie.colors.r = cubie.colors.u;
  cubie.colors.u = cubie.colors.l;
  cubie.colors.l = cubie.colors.d;
  cubie.colors.d = temp;
}

function rotateCCWZ(cubie) {
  // x_new = -y, y_new = x
  const newX = -cubie.y;
  const newY = cubie.x;
  cubie.x = newX;
  cubie.y = newY;

  // Colors: (r, u, l, d) = (d, r, u, l)
  // new_r = d, new_u = r, new_l = u, new_d = l
  const temp = cubie.colors.r;
  cubie.colors.r = cubie.colors.d;
  cubie.colors.d = cubie.colors.l;
  cubie.colors.l = cubie.colors.u;
  cubie.colors.u = temp;
}

// Map a face name to its filter condition (which cubies are affected)
// and its primitive rotation direction (true for CW, false for CCW) on X, Y, or Z axis.
const MOVE_DEFINITIONS = {
  // Face turns
  R: { axis: 'x', filter: c => c.x === 1, cw: true },
  L: { axis: 'x', filter: c => c.x === -1, cw: false },
  U: { axis: 'y', filter: c => c.y === 1, cw: true },
  D: { axis: 'y', filter: c => c.y === -1, cw: false },
  F: { axis: 'z', filter: c => c.z === 1, cw: true },
  B: { axis: 'z', filter: c => c.z === -1, cw: false },

  // Middle slice turns
  M: { axis: 'x', filter: c => c.x === 0, cw: false },
  E: { axis: 'y', filter: c => c.y === 0, cw: false },
  S: { axis: 'z', filter: c => c.z === 0, cw: true },

  // Wide turns
  r: { axis: 'x', filter: c => c.x >= 0, cw: true },
  l: { axis: 'x', filter: c => c.x <= 0, cw: false },
  u: { axis: 'y', filter: c => c.y >= 0, cw: true },
  d: { axis: 'y', filter: c => c.y <= 0, cw: false },
  f: { axis: 'z', filter: c => c.z >= 0, cw: true },
  b: { axis: 'z', filter: c => c.z <= 0, cw: false },

  // Whole cube rotations
  x: { axis: 'x', filter: () => true, cw: true },
  y: { axis: 'y', filter: () => true, cw: true },
  z: { axis: 'z', filter: () => true, cw: true }
};

function recordMove(cubeState, parsedMove) {
  if (!Array.isArray(cubeState.moveHistory)) {
    cubeState.moveHistory = [];
  }

  const nextHistory = simplifySequence([...cubeState.moveHistory, getMoveString(parsedMove)]);
  cubeState.moveHistory = nextHistory.map(getMoveString);
}

export function executeMove(cubeState, parsedMove, options = {}) {
  const def = MOVE_DEFINITIONS[parsedMove.face];
  if (!def) {
    throw new Error(`Unsupported move face: "${parsedMove.face}"`);
  }

  // Determine how many 90-degree clockwise rotations to apply
  let cwRotations = 1;
  if (parsedMove.double) {
    cwRotations = 2;
  } else if (parsedMove.prime) {
    cwRotations = 3;
  }

  // Filter the cubies that should move
  const targetCubies = cubeState.cubies.filter(def.filter);

  // Apply the 90-degree rotations
  for (let i = 0; i < cwRotations; i++) {
    for (const cubie of targetCubies) {
      if (def.axis === 'x') {
        if (def.cw) rotateCWX(cubie);
        else rotateCCWX(cubie);
      } else if (def.axis === 'y') {
        if (def.cw) rotateCWY(cubie);
        else rotateCCWY(cubie);
      } else if (def.axis === 'z') {
        if (def.cw) rotateCWZ(cubie);
        else rotateCCWZ(cubie);
      }
    }
  }

  if (options.recordHistory !== false && !parsedMove.skipHistory) {
    recordMove(cubeState, parsedMove);
  }
}

export function executeSequence(cubeState, seqStr, options = {}) {
  const moves = parseMoveSequence(seqStr);
  for (const move of moves) {
    executeMove(cubeState, move, options);
  }
}
