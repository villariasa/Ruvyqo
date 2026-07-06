// 3D coordinate-based Rubik's Cube representation.
// Coordinates: x (left-right: -1 to 1), y (down-up: -1 to 1), z (back-front: -1 to 1)
// Standard orientation colors:
// U (+y): yellow
// D (-y): white
// F (+z): green
// B (-z): blue
// L (-x): orange
// R (+x): red

export const FACE_COLORS = {
  u: 'yellow',
  d: 'white',
  f: 'green',
  b: 'blue',
  l: 'orange',
  r: 'red'
};

export function getCubieId(x, y, z) {
  return (x + 1) + 3 * (y + 1) + 9 * (z + 1);
}

export function getInitialCoordinates(id) {
  const z = Math.floor(id / 9) - 1;
  const y = Math.floor((id % 9) / 3) - 1;
  const x = (id % 3) - 1;
  return { x, y, z };
}

export class CubeState {
  constructor() {
    this.cubies = [];
    this.moveHistory = [];
    this.reset();
  }

  reset() {
    this.moveHistory = [];
    this.cubies = [];
    for (let z = -1; z <= 1; z++) {
      for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
          const id = getCubieId(x, y, z);
          this.cubies.push({
            id,
            x,
            y,
            z,
            colors: {
              u: y === 1 ? FACE_COLORS.u : null,
              d: y === -1 ? FACE_COLORS.d : null,
              f: z === 1 ? FACE_COLORS.f : null,
              b: z === -1 ? FACE_COLORS.b : null,
              l: x === -1 ? FACE_COLORS.l : null,
              r: x === 1 ? FACE_COLORS.r : null
            }
          });
        }
      }
    }
  }

  clone() {
    const cloneState = new CubeState();
    cloneState.cubies = this.cubies.map(c => ({
      id: c.id,
      x: c.x,
      y: c.y,
      z: c.z,
      colors: { ...c.colors }
    }));
    cloneState.moveHistory = [...this.moveHistory];
    return cloneState;
  }

  getCubieAt(x, y, z) {
    return this.cubies.find(c => c.x === x && c.y === y && c.z === z);
  }

  isSolved() {
    for (const c of this.cubies) {
      const init = getInitialCoordinates(c.id);
      if (c.x !== init.x || c.y !== init.y || c.z !== init.z) {
        return false;
      }
      // Check colors orientation
      if (c.y === 1 && c.colors.u !== FACE_COLORS.u) return false;
      if (c.y === -1 && c.colors.d !== FACE_COLORS.d) return false;
      if (c.z === 1 && c.colors.f !== FACE_COLORS.f) return false;
      if (c.z === -1 && c.colors.b !== FACE_COLORS.b) return false;
      if (c.x === -1 && c.colors.l !== FACE_COLORS.l) return false;
      if (c.x === 1 && c.colors.r !== FACE_COLORS.r) return false;
    }
    return true;
  }

  // Serializes current state to a compact representation for hash-checking
  serialize() {
    let result = '';
    const sorted = [...this.cubies].sort((a, b) => a.id - b.id);
    for (let i = 0; i < 27; i++) {
      const c = sorted[i];
      result += (c.x + 1).toString() + (c.y + 1).toString() + (c.z + 1).toString();
      result += (c.colors.u ? c.colors.u[0] : '-') +
                (c.colors.d ? c.colors.d[0] : '-') +
                (c.colors.f ? c.colors.f[0] : '-') +
                (c.colors.b ? c.colors.b[0] : '-') +
                (c.colors.l ? c.colors.l[0] : '-') +
                (c.colors.r ? c.colors.r[0] : '-');
    }
    return result;
  }

  deserialize(str) {
    this.moveHistory = [];
    const charToColor = {
      'y': 'yellow', 'w': 'white', 'g': 'green', 'b': 'blue', 'o': 'orange', 'r': 'red', '-': null
    };
    const sorted = [...this.cubies].sort((a, b) => a.id - b.id);
    for (let i = 0; i < 27; i++) {
      const offset = i * 9;
      const x = parseInt(str[offset], 10) - 1;
      const y = parseInt(str[offset + 1], 10) - 1;
      const z = parseInt(str[offset + 2], 10) - 1;
      const c = sorted[i];
      c.x = x;
      c.y = y;
      c.z = z;
      c.colors.u = charToColor[str[offset + 3]];
      c.colors.d = charToColor[str[offset + 4]];
      c.colors.f = charToColor[str[offset + 5]];
      c.colors.b = charToColor[str[offset + 6]];
      c.colors.l = charToColor[str[offset + 7]];
      c.colors.r = charToColor[str[offset + 8]];
    }
  }

  // Constructs state from a 54-sticker map and validates parities
  setStickersState(stickerColors) {
    // 1. Validate color counts
    const counts = {};
    Object.values(stickerColors).flat().forEach(c => counts[c] = (counts[c] || 0) + 1);
    const validColors = ['yellow', 'white', 'green', 'blue', 'orange', 'red'];
    for (const c of validColors) {
      if ((counts[c] || 0) !== 9) {
        throw new Error(`Invalid color count: Exactly 9 of each color required. Found ${counts[c] || 0} for ${c}.`);
      }
    }

    // 2. Set colors on cubies based on coordinates
    for (const cubie of this.cubies) {
      const { x, y, z } = cubie;
      cubie.colors.u = null;
      cubie.colors.d = null;
      cubie.colors.f = null;
      cubie.colors.b = null;
      cubie.colors.l = null;
      cubie.colors.r = null;

      if (y === 1) {
        const row = z + 1;
        const col = x + 1;
        cubie.colors.u = stickerColors.u[row * 3 + col];
      }
      if (y === -1) {
        const row = 1 - z;
        const col = x + 1;
        cubie.colors.d = stickerColors.d[row * 3 + col];
      }
      if (z === 1) {
        const row = 1 - y;
        const col = x + 1;
        cubie.colors.f = stickerColors.f[row * 3 + col];
      }
      if (z === -1) {
        const row = 1 - y;
        const col = 1 - x;
        cubie.colors.b = stickerColors.b[row * 3 + col];
      }
      if (x === -1) {
        const row = 1 - y;
        const col = z + 1;
        cubie.colors.l = stickerColors.l[row * 3 + col];
      }
      if (x === 1) {
        const row = 1 - y;
        const col = 1 - z;
        cubie.colors.r = stickerColors.r[row * 3 + col];
      }
    }

    // 3. Validate parities
    this.validateParities();
  }

  validateParities() {
    // Corner orientation twist sum must be modulo 3 = 0
    let cornerTwistSum = 0;
    // Edge flip sum must be even
    let edgeFlipSum = 0;

    for (const cubie of this.cubies) {
      const stickersCount = Object.values(cubie.colors).filter(Boolean).length;
      
      // Corner check
      if (stickersCount === 3) {
        const colors = cubie.colors;
        const hasUDOnUD = (colors.u === 'yellow' || colors.u === 'white' || colors.d === 'yellow' || colors.d === 'white');
        if (!hasUDOnUD) {
          const udFace = Object.keys(colors).find(f => (f === 'l' || f === 'r' || f === 'f' || f === 'b') && (colors[f] === 'yellow' || colors[f] === 'white'));
          if (udFace) {
            const isOnLR = (udFace === 'l' || udFace === 'r');
            const twist = cubie.y === 1 ? (isOnLR ? 1 : 2) : (isOnLR ? 2 : 1);
            cornerTwistSum += twist;
          }
        }
      }

      // Edge check
      if (stickersCount === 2) {
        const colors = cubie.colors;
        const hasUD = Object.values(colors).some(c => c === 'yellow' || c === 'white');
        if (hasUD) {
          const udOnFace = (colors.u === 'yellow' || colors.u === 'white' || colors.d === 'yellow' || colors.d === 'white');
          if (!udOnFace) {
            edgeFlipSum++;
          }
        } else {
          // If no UD color, F/B color (green/blue) must be on F/B face
          const hasFB = Object.values(colors).some(c => c === 'green' || c === 'blue');
          if (hasFB) {
            const fbOnFace = (colors.f === 'green' || colors.f === 'blue' || colors.b === 'green' || colors.b === 'blue');
            if (!fbOnFace) {
              edgeFlipSum++;
            }
          }
        }
      }
    }

    if (cornerTwistSum % 3 !== 0) {
      throw new Error(`Corner Twist Parity Error: Corner twists sum mod 3 must be 0 (got sum ${cornerTwistSum}).`);
    }

    if (edgeFlipSum % 2 !== 0) {
      throw new Error(`Edge Flip Parity Error: Edge flips must be even (got ${edgeFlipSum} flipped edges).`);
    }
  }
}
