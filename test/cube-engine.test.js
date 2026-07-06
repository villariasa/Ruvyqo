import { describe, it, expect } from 'vitest';
import { CubeState } from '../src/engine/cube-state.js';
import { executeMove, executeSequence } from '../src/engine/move-executor.js';
import { parseMoveSequence, invertSequence, getSequenceString } from '../src/engine/move-parser.js';
import { generateScramble } from '../src/engine/scramble-generator.js';

describe('Cube State and Executor', () => {
  it('should initialize to a solved state', () => {
    const cube = new CubeState();
    expect(cube.isSolved()).toBe(true);
  });

  it('should not be solved after a single move', () => {
    const cube = new CubeState();
    executeSequence(cube, 'R');
    expect(cube.isSolved()).toBe(false);
  });

  it('should return to solved after applying Sexy Move (R U R\' U\') six times', () => {
    const cube = new CubeState();
    for (let i = 0; i < 6; i++) {
      executeSequence(cube, "R U R' U'");
    }
    expect(cube.isSolved()).toBe(true);
  });

  it('should return to solved after applying a scramble and its inverse', () => {
    const cube = new CubeState();
    const scramble = generateScramble(20);
    const parsedScramble = parseMoveSequence(scramble);
    const inverse = invertSequence(parsedScramble);
    
    executeSequence(cube, scramble);
    expect(cube.isSolved()).toBe(false);
    
    executeSequence(cube, getSequenceString(inverse));
    expect(cube.isSolved()).toBe(true);
  });

  it('should track and simplify move history', () => {
    const cube = new CubeState();

    executeSequence(cube, "R U U' R'");

    expect(cube.isSolved()).toBe(true);
    expect(cube.moveHistory).toEqual([]);
  });

  it('should handle slice moves and wide moves correctly', () => {
    const cube = new CubeState();
    // M2 U2 M2 U2 should solve or be solved by another M2 U2 M2 U2
    executeSequence(cube, 'M2 U2 M2 U2');
    expect(cube.isSolved()).toBe(false);
    executeSequence(cube, 'M2 U2 M2 U2');
    expect(cube.isSolved()).toBe(true);

    // Wide r and wide l
    executeSequence(cube, "r U R' U' r' U R U'");
    expect(cube.isSolved()).toBe(false);
  });
});
