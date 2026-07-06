import { describe, it, expect } from 'vitest';
import { CubeState } from '../src/engine/cube-state.js';
import { solveCube } from '../src/solver/roux-solver.js';
import { generateScramble } from '../src/engine/scramble-generator.js';
import { executeSequence } from '../src/engine/move-executor.js';

describe('Cube Solver Integration', () => {
  it('should successfully solve a direct solved cube in 0 moves', () => {
    const cube = new CubeState();
    const result = solveCube(cube);
    expect(result.moveCount).toBe(0);
    expect(result.totalMoves).toBe('');
    expect(result.steps).toEqual([]);
  });

  it('should successfully solve multiple tracked random scrambles', () => {
    for (let run = 1; run <= 10; run++) {
      const cube = new CubeState();
      const scramble = generateScramble(15);
      
      executeSequence(cube, scramble);
      expect(cube.isSolved()).toBe(false);
      expect(cube.moveHistory.length).toBeGreaterThan(0);

      let result;
      try {
        result = solveCube(cube);
      } catch (err) {
        console.error(`FAILING RUN ${run}:`);
        console.error(`Scramble: "${scramble}"`);
        console.error(`Error message: ${err.message}`);
        console.error(`Stack trace:\n${err.stack}`);
        throw err;
      }

      const traceCube = cube.clone();
      for (const step of result.steps) {
        executeSequence(traceCube, step.moves);
      }

      expect(traceCube.isSolved()).toBe(true);
      expect(result.moveCount).toBeGreaterThan(0);
      expect(result.source).toBe('roux');
      console.log(`Scramble ${run} solved in ${result.moveCount} moves.`);
    }
  }, 60000);
});
