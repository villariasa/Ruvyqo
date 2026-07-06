import { CubeState } from '../src/engine/cube-state.js';
import { solveFirstBlock } from '../src/solver/first-block.js';
import { solveBFS } from '../src/solver/bfs-solver.js';
import { isPieceSolved } from '../src/recognition/stage-recognizer.js';
import { executeSequence, executeMove } from '../src/engine/move-executor.js';

const cube = new CubeState();
const scramble = "D U R' U' R' L2 U F' L R2 D L B2 R' L'";
executeSequence(cube, scramble);

const fbSteps = solveFirstBlock(cube);
const temp = cube.clone();
const allFbMoves = [...fbSteps.step1, ...fbSteps.step2, ...fbSteps.step3, ...fbSteps.step4, ...fbSteps.step5];
for (const m of allFbMoves) executeMove(temp, m);

// DR solved with R'
executeMove(temp, { face: 'R', double: false, prime: true });
// BR solved with R' U2 R
executeMove(temp, { face: 'R', double: false, prime: true });
executeMove(temp, { face: 'U', double: true, prime: false });
executeMove(temp, { face: 'R', double: false, prime: false });

console.log("Searching for DBR corner solve path...");
const goal = (s) => isPieceSolved(s, 11) && isPieceSolved(s, 5) && isPieceSolved(s, 2);
const path = solveBFS(temp, goal, ['R', 'U', 'M'], 12); // Search up to depth 12!
if (path) {
  console.log("FOUND solution:", path.map(m => m.raw).join(' '));
  console.log("Length:", path.length);
} else {
  console.log("NOT FOUND even at depth 12!");
}
