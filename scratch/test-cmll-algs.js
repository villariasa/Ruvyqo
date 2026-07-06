import { CubeState } from '../src/engine/cube-state.js';
import { executeSequence } from '../src/engine/move-executor.js';
import { isPieceSolved } from '../src/recognition/stage-recognizer.js';
import cmllAlgs from '../src/data/cmll-algorithms.json' with { type: 'json' };

const FIRST_BLOCK_IDS = [0, 18, 9, 21, 3, 12, 11]; // DL, DFL, DBL, FL, BL, etc.
const SECOND_BLOCK_IDS = [2, 20, 5, 23, 13, 14, 10]; // DR, DFR, DBR, FR, BR, etc.

// A more robust check for block preservation:
// The first block and second block pieces must be exactly solved (including their colors and positions).
function isFirstBlockSolved(cube) {
  // First block cubies (x = -1, y <= 0) and the centers/edges
  const fbCubies = [
    { id: 0, pos: [-1, -1, -1] }, // DBL
    { id: 18, pos: [-1, -1, 1] }, // DFL
    { id: 9, pos: [-1, 0, 0] }, // L center
    { id: 11, pos: [-1, -1, 0] }, // DL edge
    { id: 3, pos: [-1, 0, -1] }, // BL edge
    { id: 21, pos: [-1, 0, 1] } // FL edge
  ];
  for (const item of fbCubies) {
    if (!isPieceSolved(cube, item.id)) return false;
  }
  return true;
}

function isSecondBlockSolved(cube) {
  // Second block cubies (x = 1, y <= 0)
  const sbCubies = [
    { id: 2, pos: [1, -1, -1] }, // DBR
    { id: 20, pos: [1, -1, 1] }, // DFR
    { id: 13, pos: [1, 0, 0] }, // R center
    { id: 14, pos: [1, -1, 0] }, // DR edge
    { id: 5, pos: [1, 0, -1] }, // BR edge
    { id: 23, pos: [1, 0, 1] } // FR edge
  ];
  for (const item of sbCubies) {
    if (!isPieceSolved(cube, item.id)) return false;
  }
  return true;
}

console.log("Checking CMLL algorithms block preservation:");
for (const [key, caseData] of Object.entries(cmllAlgs)) {
  const cube = new CubeState();
  executeSequence(cube, caseData.alg);
  const fb = isFirstBlockSolved(cube);
  const sb = isSecondBlockSolved(cube);
  if (!fb || !sb) {
    console.log(`❌ ${key} (${caseData.name}) BREAKS BLOCKS! FB=${fb}, SB=${sb}`);
  } else {
    console.log(`✓ ${key} preserves blocks.`);
  }
}

const EXTRA_ALGS = {
  Front_Comm: "R U2 R D R' U2 R D' R2",
  Back_Comm: "R' U2 R' D' R U2 R' D R2"
};

console.log("Checking extra CMLL algorithms block preservation:");
for (const [name, alg] of Object.entries(EXTRA_ALGS)) {
  const cube = new CubeState();
  executeSequence(cube, alg);
  const fb = isFirstBlockSolved(cube);
  const sb = isSecondBlockSolved(cube);
  console.log(`${name}: FB=${fb}, SB=${sb}`);
}
