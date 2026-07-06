// Generates random, WCA-valid move scrambles.
// Ensures no face is turned twice in a row, and opposite faces do not sandwich.

const FACES = ['R', 'L', 'U', 'D', 'F', 'B'];
const MODIFIERS = ['', "'", '2'];

const OPPOSITES = {
  R: 'L', L: 'R',
  U: 'D', D: 'U',
  F: 'B', B: 'F'
};

export function generateScramble(length = 20) {
  const scramble = [];
  let lastFace = null;
  let secondLastFace = null;

  for (let i = 0; i < length; i++) {
    let face;
    do {
      face = FACES[Math.floor(Math.random() * FACES.length)];
    } while (
      face === lastFace ||
      (secondLastFace && face === secondLastFace && OPPOSITES[face] === lastFace)
    );

    const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
    scramble.push(face + modifier);

    secondLastFace = lastFace;
    lastFace = face;
  }

  return scramble.join(' ');
}
