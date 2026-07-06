// Solver for Roux CMLL (Corners of Last Layer).
// Identifies and applies the correct CMLL algorithm.

import cmllAlgs from '../data/cmll-algorithms.json' with { type: 'json' };
import { executeSequence } from '../engine/move-executor.js';
import { isCMLLSolved } from '../recognition/stage-recognizer.js';
import { parseMoveSequence } from '../engine/move-parser.js';

export function solveCMLL(cubeState) {
  // If already solved, return empty list and case name 'Solved'
  if (isCMLLSolved(cubeState)) {
    return {
      moves: [],
      caseName: 'Solved',
      caseId: 'Solved',
      family: 'O',
      setupMove: '',
      algMove: '',
      adjustMove: ''
    };
  }

  const U_MOVES = ['', 'U', "U'", 'U2'];

  for (const setup of U_MOVES) {
    for (const [key, caseData] of Object.entries(cmllAlgs)) {
      for (const adjust of U_MOVES) {
        const temp = cubeState.clone();
        const seqParts = [setup, caseData.alg, adjust].filter(Boolean);
        const seqStr = seqParts.join(' ');
        
        executeSequence(temp, seqStr, { recordHistory: false });

        if (isCMLLSolved(temp)) {
          return {
            moves: parseMoveSequence(seqStr),
            caseName: caseData.name,
            caseId: key,
            family: caseData.family,
            setupMove: setup,
            algMove: caseData.alg,
            adjustMove: adjust
          };
        }
      }
    }
  }

  throw new Error('CMLL solving failed: no matching algorithm found.');
}
