import { describe, it, expect } from 'vitest';
import { CubeState } from '../src/engine/cube-state.js';

describe('Sticker Net Scramble Validation', () => {
  it('should successfully load a solved sticker configuration', () => {
    const cube = new CubeState();
    
    // Create standard solved sticker map
    const map = {
      u: Array(9).fill('yellow'),
      d: Array(9).fill('white'),
      f: Array(9).fill('green'),
      b: Array(9).fill('blue'),
      l: Array(9).fill('orange'),
      r: Array(9).fill('red')
    };

    expect(() => cube.setStickersState(map)).not.toThrow();
    expect(cube.isSolved()).toBe(true);
  });

  it('should fail validation if color counts are wrong', () => {
    const cube = new CubeState();
    const map = {
      u: Array(9).fill('yellow'),
      d: Array(9).fill('white'),
      f: Array(9).fill('green'),
      b: Array(9).fill('blue'),
      l: Array(9).fill('orange'),
      r: Array(9).fill('red')
    };
    // Break count
    map.u[0] = 'white';

    expect(() => cube.setStickersState(map)).toThrow(/Invalid color count/);
  });

  it('should fail validation on single corner twist orientation parity error', () => {
    const cube = new CubeState();
    const map = {
      u: Array(9).fill('yellow'),
      d: Array(9).fill('white'),
      f: Array(9).fill('green'),
      b: Array(9).fill('blue'),
      l: Array(9).fill('orange'),
      r: Array(9).fill('red')
    };

    // Twist UFL corner (U: yellow, F: green, L: orange)
    // Solved UFL corner U-face cell is index 6. L-face is index 2. F-face is index 0.
    // Let's twist: set UFL corner yellow to L, orange to F, green to U.
    map.u[6] = 'green';
    map.l[2] = 'yellow';
    map.f[0] = 'orange';

    expect(() => cube.setStickersState(map)).toThrow(/Corner Twist Parity Error/);
  });

  it('should fail validation on single edge flip orientation parity error', () => {
    const cube = new CubeState();
    const map = {
      u: Array(9).fill('yellow'),
      d: Array(9).fill('white'),
      f: Array(9).fill('green'),
      b: Array(9).fill('blue'),
      l: Array(9).fill('orange'),
      r: Array(9).fill('red')
    };

    // Flip UF edge (U: yellow, F: green)
    // Solved UF edge U-face cell is index 7. F-face is index 1.
    map.u[7] = 'green';
    map.f[1] = 'yellow';

    expect(() => cube.setStickersState(map)).toThrow(/Edge Flip Parity Error/);
  });
});
