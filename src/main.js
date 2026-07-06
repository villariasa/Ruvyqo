// Main Controller for Roux Method Cyber Solver & Trainer

import './style.css';
import { CubeState } from './engine/cube-state.js';
import { generateScramble } from './engine/scramble-generator.js';
import { executeMove, executeSequence } from './engine/move-executor.js';
import { parseMove } from './engine/move-parser.js';
import { solveCube } from './solver/roux-solver.js';
import { Cube3DRenderer } from './renderer/cube-renderer.js';
import {
  isFirstBlockSolved,
  isSecondBlockSolved,
  isCMLLSolved,
  isPieceSolved
} from './recognition/stage-recognizer.js';

// Elements
const container = document.getElementById('three-container');
const btnSolve = document.getElementById('btn-solve');
const btnScramble = document.getElementById('btn-scramble');
const btnReset = document.getElementById('btn-reset');
const scrambleDisplay = document.getElementById('scramble-display');

const btnPlayPrev = document.getElementById('btn-play-prev');
const btnPlayToggle = document.getElementById('btn-play-toggle');
const btnPlayNext = document.getElementById('btn-play-next');
const scrubberSlider = document.getElementById('scrubber-slider');
const scrubberText = document.getElementById('scrubber-text');
const stepLog = document.getElementById('step-log');

const hudSolveLen = document.getElementById('hud-solve-len');
const hudRouxStage = document.getElementById('hud-roux-stage');
const solveOverlay = document.getElementById('solve-overlay');
const overlayStepName = document.getElementById('overlay-step-name');
const overlayStepMoves = document.getElementById('overlay-step-moves');
const overlaySolveBadge = document.getElementById('overlay-solve-badge');

const btnResetCam = document.getElementById('hud-btn-reset-cam');
const btnIsolation = document.getElementById('hud-btn-isolation');
const stageInfoBox = document.getElementById('stage-info-box');

// Custom controls elements
const selectPlaybackSpeed = document.getElementById('select-playback-speed');
const chkStageFb = document.getElementById('chk-stage-fb');
const chkStageSb = document.getElementById('chk-stage-sb');
const chkStageCmll = document.getElementById('chk-stage-cmll');
const chkStageLse = document.getElementById('chk-stage-lse');
const customScrambleInput = document.getElementById('custom-scramble-input');
const btnApplyScramble = document.getElementById('btn-apply-scramble');

// Compete Mode elements
const btnToggleCompete = document.getElementById('btn-toggle-compete');
const viewportNormal = document.getElementById('viewport-normal');
const viewportCompete = document.getElementById('viewport-compete');
const timerUserEl = document.getElementById('timer-user');
const timerAiEl = document.getElementById('timer-ai');
const competeStatusBanner = document.getElementById('compete-status-banner');
const competeCountdownOverlay = document.getElementById('compete-countdown-overlay');
const countdownText = document.getElementById('countdown-text');
const inputAiTargetTime = document.getElementById('input-ai-target-time');
const btnStartCompete = document.getElementById('btn-start-compete');

// Tutorial Mode Elements
const tabCurriculum = document.getElementById('tab-curriculum');
const tabLessons = document.getElementById('tab-lessons');
const curriculumContent = document.getElementById('curriculum-content');
const lessonsContent = document.getElementById('lessons-content');
const lessonsList = document.getElementById('lessons-list');

const lessonHud = document.getElementById('lesson-hud');
const lessonHudTitle = document.getElementById('lesson-hud-title');
const lessonHudDesc = document.getElementById('lesson-hud-desc');
const lessonHudHint = document.getElementById('lesson-hud-hint');
const btnLessonExit = document.getElementById('btn-lesson-exit');

const lessonSuccessOverlay = document.getElementById('lesson-success-overlay');
const lessonSuccessMessage = document.getElementById('lesson-success-message');
const btnLessonNext = document.getElementById('btn-lesson-next');

// Lessons Database
const LESSONS = [
  {
    id: 'fb_dl',
    title: 'Lesson 1: DL Edge',
    step: 'First Block',
    setupScramble: "U' L2 U L2 U' L2",
    objective: "Solve the DL edge (Orange/White) to its position at bottom-left.",
    hint: "Bring the DL edge down to its slot. Try: U L2",
    verify: (cubeState) => isPieceSolved(cubeState, 9)
  },
  {
    id: 'fb_bl',
    title: 'Lesson 2: BL Edge',
    step: 'First Block',
    setupScramble: "U M2 U' M2",
    objective: "Solve the BL edge (Orange/Blue) while keeping the DL edge solved.",
    hint: "Use M slice turns. Try: U M2 U'",
    verify: (cubeState) => isPieceSolved(cubeState, 9) && isPieceSolved(cubeState, 3)
  },
  {
    id: 'fb_complete',
    title: 'Lesson 3: DBL Corner',
    step: 'First Block',
    setupScramble: "U R U' R' U' L2",
    objective: "Solve the DBL corner (Orange/Blue/White) to complete the back-left square.",
    hint: "Pair the corner and insert. Try: U R U' R'",
    verify: (cubeState) => isPieceSolved(cubeState, 9) && isPieceSolved(cubeState, 3) && isPieceSolved(cubeState, 0)
  },
  {
    id: 'sb_dr',
    title: 'Lesson 4: DR Edge',
    step: 'Second Block',
    setupScramble: "U R2 U' R2",
    objective: "Solve the DR edge (Red/White) on the right side.",
    hint: "Try: U R2 U'",
    verify: (cubeState) => isFirstBlockSolved(cubeState) && isPieceSolved(cubeState, 11)
  },
  {
    id: 'lse_eo',
    title: 'Lesson 5: Edge Orientation',
    step: 'LSE Stage',
    setupScramble: "M' U M U' M' U M",
    objective: "Orient the remaining six edges using M/U moves.",
    hint: "Try: M' U M",
    verify: (cubeState) => {
      const LSE_IDS = [15, 17, 25, 7, 19, 1];
      return LSE_IDS.every(id => {
        const cubie = cubeState.cubies.find(c => c.id === id);
        if (!cubie) return false;
        const faceColors = {
          u: cubeState.cubies.find(c => c.x === 0 && c.y === 1 && c.z === 0)?.colors.u,
          d: cubeState.cubies.find(c => c.x === 0 && c.y === -1 && c.z === 0)?.colors.d
        };
        const udFace = Object.keys(cubie.colors).find(
          face => cubie.colors[face] === faceColors.u || cubie.colors[face] === faceColors.d
        );
        return udFace === 'u' || udFace === 'd';
      });
    }
  }
];

// Roux Stage Target Pieces
const STAGE_PIECES = {
  fb: [9, 3, 0, 21, 18, 12], // DL, BL, DBL, FL, DFL, L-center
  sb: [11, 5, 2, 23, 20, 14], // DR, BR, DBR, FR, DFR, R-center
  cmll: [24, 6, 8, 26], // UFL, UFR, UBL, UBR corners
  lse: [15, 17, 16, 22, 10, 25, 13, 10, 22, 4, 12, 14] // UL, UR, UB, UF, DB, DF, centers
};

const STAGE_INFO = {
  fb: {
    title: 'First Block (FB) Solver Target',
    text: 'Solve DL edge, then BL edge + DBL corner (Back-Left pair), and FL edge + DFL corner (Front-Left pair). All on Left face.'
  },
  sb: {
    title: 'Second Block (SB) Solver Target',
    text: 'Solve DR edge, then BR edge + DBR corner (Back-Right pair), and FR edge + DFR corner (Front-Right pair). Built on Right face.'
  },
  cmll: {
    title: 'CMLL Corner Alignment Target',
    text: 'Solve the orientations and permutations of the 4 top corners. Leaves the bottom blocks intact.'
  },
  lse: {
    title: 'Last Six Edges (LSE) Solver Target',
    text: 'Solve edge orientation (EO), UL/UR edge placements, and permute the remaining middle slice edges to complete the solve.'
  }
};

// Global State
const cube = new CubeState();
const renderer = new Cube3DRenderer(container);

let activeStage = 'fb';
let isolationActive = true;
let currentScramble = '';
let currentSolve = null; // List of steps
let flatSolveMoves = []; // Flat list of move objects
let solvePlaybackIndex = 0; // Index of the next move to apply
let isPlayingPlayback = false;
let playbackTimer = null;
let playbackStartState = null;

// AI Compete State
let isCompeteMode = false;
let userCube = null;
let userRenderer = null;
let aiCube = null;
let aiRenderer = null;
let competeTimerInterval = null;
let userFinished = false;
let aiFinished = false;
let competeActive = false;
let competeLockInput = false;

// Lesson Active State
let activeLesson = null;

// Initialize
renderer.setCubeState(cube);
updateHUD();
populateLessons();

// Tab switching handlers
tabCurriculum.addEventListener('click', () => {
  tabCurriculum.classList.add('active');
  tabLessons.classList.remove('active');
  curriculumContent.style.display = 'block';
  lessonsContent.style.display = 'none';
  exitLesson();

  tabCurriculum.style.background = 'rgba(0,240,255,0.1)';
  tabCurriculum.style.borderColor = 'var(--neon-cyan)';
  tabCurriculum.style.color = 'var(--neon-cyan)';
  tabLessons.style.background = 'rgba(255,255,255,0.02)';
  tabLessons.style.borderColor = 'rgba(255,255,255,0.1)';
  tabLessons.style.color = 'var(--text-secondary)';
});

tabLessons.addEventListener('click', () => {
  tabLessons.classList.add('active');
  tabCurriculum.classList.remove('active');
  curriculumContent.style.display = 'none';
  lessonsContent.style.display = 'flex';

  tabLessons.style.background = 'rgba(57,255,20,0.1)';
  tabLessons.style.borderColor = 'var(--neon-green)';
  tabLessons.style.color = 'var(--neon-green)';
  tabCurriculum.style.background = 'rgba(255,255,255,0.02)';
  tabCurriculum.style.borderColor = 'rgba(255,255,255,0.1)';
  tabCurriculum.style.color = 'var(--text-secondary)';
});

// Populating Lessons
function populateLessons() {
  lessonsList.innerHTML = '';
  LESSONS.forEach(lesson => {
    const card = document.createElement('div');
    card.className = 'lesson-card';
    card.dataset.lessonId = lesson.id;
    card.innerHTML = `
      <div class="lesson-card-header">
        <span class="lesson-card-step">${lesson.step}</span>
      </div>
      <h3 class="lesson-card-title">${lesson.title}</h3>
      <p class="lesson-card-desc">${lesson.objective}</p>
      <button class="lesson-btn-start">Start Lesson</button>
    `;
    
    // Bind click to Start Lesson button
    card.querySelector('.lesson-btn-start').addEventListener('click', (e) => {
      e.stopPropagation();
      startLesson(lesson);
    });

    lessonsList.appendChild(card);
  });
}

function startLesson(lesson) {
  resetPlayback();
  activeLesson = lesson;

  // Add active styling
  document.querySelectorAll('.lesson-card').forEach(c => c.classList.remove('active'));
  const card = document.querySelector(`.lesson-card[data-lesson-id="${lesson.id}"]`);
  if (card) card.classList.add('active');

  // Load scramble setup onto the cube
  cube.reset();
  executeSequence(cube, lesson.setupScramble);
  renderer.setCubeState(cube);

  // Update HUD elements
  lessonHudTitle.innerText = lesson.title;
  lessonHudDesc.innerText = lesson.objective;
  lessonHudHint.innerText = lesson.hint;
  lessonHud.style.display = 'flex';
  lessonSuccessOverlay.style.display = 'none';

  // Highlight specific stages if appropriate
  if (lesson.id.startsWith('fb')) {
    activeStage = 'fb';
  } else if (lesson.id.startsWith('sb')) {
    activeStage = 'sb';
  } else if (lesson.id.startsWith('lse')) {
    activeStage = 'lse';
  }
  applyStageHighlight();
}

function exitLesson() {
  if (!activeLesson) return;
  activeLesson = null;
  lessonHud.style.display = 'none';
  lessonSuccessOverlay.style.display = 'none';
  document.querySelectorAll('.lesson-card').forEach(c => c.classList.remove('active'));
  
  cube.reset();
  renderer.setCubeState(cube);
  updateHUD();
}

btnLessonExit.addEventListener('click', exitLesson);

btnLessonNext.addEventListener('click', () => {
  lessonSuccessOverlay.style.display = 'none';
  const currentIdx = LESSONS.findIndex(l => l.id === activeLesson.id);
  const nextLesson = LESSONS[currentIdx + 1];
  if (nextLesson) {
    startLesson(nextLesson);
  } else {
    // End of lessons
    exitLesson();
    scrambleDisplay.innerText = '🎉 All lessons complete! Excellent job!';
  }
});

// Helper for playback speed
function getPlaybackSpeed() {
  return parseFloat(selectPlaybackSpeed.value) || 1.0;
}

// Helper to update active stage highlighting
function applyStageHighlight() {
  if (isolationActive) {
    renderer.updateStageHighlight(STAGE_PIECES[activeStage], true);
  } else {
    renderer.updateStageHighlight([], false);
  }
  
  stageInfoBox.innerHTML = `
    <div class="info-title">${STAGE_INFO[activeStage].title}</div>
    <div>${STAGE_INFO[activeStage].text}</div>
  `;
}
applyStageHighlight();

// Toggle Compete Mode
btnToggleCompete.addEventListener('click', () => {
  resetPlayback();
  exitLesson();
  isCompeteMode = !isCompeteMode;

  if (isCompeteMode) {
    btnToggleCompete.innerText = '👤 Normal Training Mode';
    btnToggleCompete.classList.add('active');
    viewportNormal.style.display = 'none';
    viewportCompete.style.display = 'flex';

    // Initialize Compete viewports if not done
    if (!userCube) {
      userCube = new CubeState();
      userRenderer = new Cube3DRenderer(document.getElementById('three-container-user'));
      userRenderer.setCubeState(userCube);

      aiCube = new CubeState();
      aiRenderer = new Cube3DRenderer(document.getElementById('three-container-ai'));
      aiRenderer.setCubeState(aiCube);
    } else {
      userCube.reset();
      userRenderer.setCubeState(userCube);
      aiCube.reset();
      aiRenderer.setCubeState(aiCube);
    }
    
    // Reset Compete timers
    timerUserEl.innerHTML = `Human: <span style="color: var(--neon-cyan); font-weight: bold; font-family: monospace;">0.00s</span>`;
    timerAiEl.innerHTML = `Roux AI: <span style="color: var(--neon-green); font-weight: bold; font-family: monospace;">0.00s</span>`;
    competeStatusBanner.innerText = 'Ready!';
    competeActive = false;
    competeLockInput = false;
  } else {
    btnToggleCompete.innerText = '🤖 Compete with AI Mode';
    btnToggleCompete.classList.remove('active');
    viewportNormal.style.display = 'flex';
    viewportCompete.style.display = 'none';
    
    if (competeTimerInterval) {
      clearInterval(competeTimerInterval);
      competeTimerInterval = null;
    }
  }

  // Force resizing update in Three.js
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 100);
});

// Scramble (Animated)
btnScramble.addEventListener('click', async () => {
  resetPlayback();
  exitLesson();
  btnScramble.disabled = true;
  btnSolve.disabled = true;
  btnApplyScramble.disabled = true;

  const speed = getPlaybackSpeed();

  if (isCompeteMode) {
    userCube.reset();
    userRenderer.setCubeState(userCube);
    aiCube.reset();
    aiRenderer.setCubeState(aiCube);

    currentScramble = generateScramble(15);
    scrambleDisplay.innerText = 'Scrambling both cubes...';

    const moves = currentScramble.split(' ').filter(Boolean);
    for (const mStr of moves) {
      const parsed = parseMove(mStr);
      executeMove(userCube, parsed);
      executeMove(aiCube, parsed);
      userRenderer.animateMove(mStr, 120 / speed);
      await aiRenderer.animateMove(mStr, 120 / speed);
    }
    scrambleDisplay.innerText = currentScramble;
  } else {
    cube.reset();
    renderer.setCubeState(cube);

    currentScramble = generateScramble(15);
    scrambleDisplay.innerText = 'Scrambling...';

    const moves = currentScramble.split(' ').filter(Boolean);
    for (const mStr of moves) {
      const parsed = parseMove(mStr);
      executeMove(cube, parsed);
      await renderer.animateMove(mStr, 120 / speed);
    }
    scrambleDisplay.innerText = currentScramble;
    updateHUD();
  }

  btnScramble.disabled = false;
  btnSolve.disabled = false;
  btnApplyScramble.disabled = false;
});

// Apply Custom Scramble
btnApplyScramble.addEventListener('click', async () => {
  const sequence = customScrambleInput.value.trim();
  if (!sequence) {
    scrambleDisplay.innerText = 'Please enter a valid scramble sequence!';
    return;
  }

  resetPlayback();
  exitLesson();
  btnScramble.disabled = true;
  btnSolve.disabled = true;
  btnApplyScramble.disabled = true;

  const speed = getPlaybackSpeed();
  currentScramble = sequence;

  if (isCompeteMode) {
    userCube.reset();
    userRenderer.setCubeState(userCube);
    aiCube.reset();
    aiRenderer.setCubeState(aiCube);

    scrambleDisplay.innerText = 'Applying custom scramble...';

    const moves = sequence.split(' ').filter(Boolean);
    try {
      for (const mStr of moves) {
        const parsed = parseMove(mStr);
        executeMove(userCube, parsed);
        executeMove(aiCube, parsed);
        userRenderer.animateMove(mStr, 120 / speed);
        await aiRenderer.animateMove(mStr, 120 / speed);
      }
      scrambleDisplay.innerText = sequence;
    } catch (err) {
      scrambleDisplay.innerText = `Invalid move in sequence: ${err.message}`;
    }
  } else {
    cube.reset();
    renderer.setCubeState(cube);

    scrambleDisplay.innerText = 'Applying custom scramble...';

    const moves = sequence.split(' ').filter(Boolean);
    try {
      for (const mStr of moves) {
        const parsed = parseMove(mStr);
        executeMove(cube, parsed);
        await renderer.animateMove(mStr, 120 / speed);
      }
      scrambleDisplay.innerText = sequence;
      updateHUD();
    } catch (err) {
      scrambleDisplay.innerText = `Invalid move in sequence: ${err.message}`;
    }
  }

  btnScramble.disabled = false;
  btnSolve.disabled = false;
  btnApplyScramble.disabled = false;
});

// Reset
btnReset.addEventListener('click', () => {
  resetPlayback();
  exitLesson();
  if (isCompeteMode) {
    userCube.reset();
    userRenderer.setCubeState(userCube);
    aiCube.reset();
    aiRenderer.setCubeState(aiCube);
    scrambleDisplay.innerText = 'Cubes reset to solved state';
  } else {
    cube.reset();
    renderer.setCubeState(cube);
    scrambleDisplay.innerText = 'Cube reset to solved state';
    updateHUD();
  }
});

// Solve
btnSolve.addEventListener('click', () => {
  if (isCompeteMode) {
    scrambleDisplay.innerText = 'Solve control is disabled in Compete Mode.';
    return;
  }
  if (cube.isSolved()) {
    scrambleDisplay.innerText = 'Cube is already solved!';
    return;
  }

  resetPlayback();
  exitLesson();
  btnSolve.innerText = 'Solving...';
  btnSolve.disabled = true;

  // Selective Stages Configuration
  const solveOptions = {
    fb: chkStageFb.checked,
    sb: chkStageSb.checked,
    cmll: chkStageCmll.checked,
    lse: chkStageLse.checked
  };

  setTimeout(() => {
    try {
      const solveStartState = cube.clone();
      const aiStartTime = performance.now();
      const solveResult = solveCube(solveStartState, solveOptions);
      const searchDurationMs = Math.round(performance.now() - aiStartTime);

      playbackStartState = solveStartState.clone();
      currentSolve = solveResult.steps;
      flatSolveMoves = [];

      // Flatten steps
      currentSolve.forEach((step, stepIdx) => {
        const moves = step.moves ? step.moves.split(' ').filter(Boolean) : [];
        moves.forEach(mStr => {
          flatSolveMoves.push({
            raw: mStr,
            stepName: step.name,
            stepIndex: stepIdx + 1,
            totalSteps: currentSolve.length
          });
        });
      });

      hudSolveLen.innerText = `${flatSolveMoves.length} moves`;
      scrambleDisplay.innerText = `Solution found in ${searchDurationMs}ms: ${solveResult.totalMoves || 'Already complete!'}`;
      btnSolve.innerText = 'Solve Cube';
      btnSolve.disabled = false;

      setupPlayback();
    } catch (err) {
      console.error(err);
      scrambleDisplay.innerText = `Solver Error: ${err.message}. Check your scramble!`;
      btnSolve.innerText = 'Solve Cube';
      btnSolve.disabled = false;
    }
  }, 50);
});

// Playback engine
function setupPlayback() {
  solvePlaybackIndex = 0;
  isPlayingPlayback = false;
  btnPlayToggle.innerText = '▶️';
  
  scrubberSlider.disabled = false;
  scrubberSlider.max = flatSolveMoves.length;
  scrubberSlider.value = 0;
  updatePlaybackHUD();

  // Populate step log list
  stepLog.innerHTML = '';
  currentSolve.forEach((step, idx) => {
    const item = document.createElement('div');
    item.className = 'step-item';
    item.innerHTML = `
      <span class="step-label">${step.name}</span>
      <span class="step-moves">${step.moves || 'Solved'}</span>
    `;
    item.addEventListener('click', () => {
      let targetIdx = 0;
      for (let i = 0; i < flatSolveMoves.length; i++) {
        if (flatSolveMoves[i].stepIndex === idx + 1) {
          targetIdx = i;
          break;
        }
      }
      seekPlaybackTo(targetIdx);
    });
    stepLog.appendChild(item);
  });
}

function resetPlayback() {
  currentSolve = null;
  flatSolveMoves = [];
  solvePlaybackIndex = 0;
  isPlayingPlayback = false;
  playbackStartState = null;
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
  btnPlayToggle.innerText = '▶️';
  scrubberSlider.disabled = true;
  scrubberSlider.max = 0;
  scrubberSlider.value = 0;
  scrubberText.innerText = '0 / 0';
  hudSolveLen.innerText = '--';
  solveOverlay.classList.remove('visible');
  stepLog.innerHTML = '';
}

function updatePlaybackHUD() {
  scrubberText.innerText = `${solvePlaybackIndex} / ${flatSolveMoves.length}`;
  scrubberSlider.value = solvePlaybackIndex;

  if (solvePlaybackIndex < flatSolveMoves.length) {
    const nextMove = flatSolveMoves[solvePlaybackIndex];
    solveOverlay.classList.add('visible');
    overlayStepName.innerText = nextMove.stepName;
    overlayStepMoves.innerText = `Next Move: ${nextMove.raw}`;
    overlaySolveBadge.innerText = `Move ${solvePlaybackIndex + 1} / ${flatSolveMoves.length}`;

    // Highlight active step
    const items = stepLog.children;
    for (let i = 0; i < items.length; i++) {
      if (i === nextMove.stepIndex - 1) {
        items[i].classList.add('active');
        items[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        items[i].classList.remove('active');
      }
    }
  } else {
    solveOverlay.classList.add('visible');
    overlayStepName.innerText = 'Cube Solved!';
    overlayStepMoves.innerText = 'Solution completed successfully';
    overlaySolveBadge.innerText = 'Complete';
  }
}

async function playNextStep() {
  if (solvePlaybackIndex >= flatSolveMoves.length) {
    pausePlayback();
    return;
  }

  const speed = getPlaybackSpeed();
  const move = flatSolveMoves[solvePlaybackIndex];
  solvePlaybackIndex++;
  
  const parsed = parseMove(move.raw);
  executeMove(cube, parsed);

  updatePlaybackHUD();
  await renderer.animateMove(move.raw, 180 / speed);
}

function playPrevStep() {
  if (solvePlaybackIndex <= 0) return;

  const speed = getPlaybackSpeed();
  solvePlaybackIndex--;
  const move = flatSolveMoves[solvePlaybackIndex];
  
  const parsed = parseMove(move.raw);
  const inv = { ...parsed, prime: !parsed.prime };
  if (parsed.double) inv.prime = false;

  executeMove(cube, inv);

  updatePlaybackHUD();
  renderer.animateMove(inv.face + (inv.prime ? "'" : (inv.double ? "2" : "")), 180 / speed);
}

function seekPlaybackTo(targetIndex) {
  const currentCube = playbackStartState ? playbackStartState.clone() : new CubeState();
  if (!playbackStartState && currentScramble) {
    executeSequence(currentCube, currentScramble);
  }

  for (let i = 0; i < targetIndex; i++) {
    const move = flatSolveMoves[i];
    executeMove(currentCube, parseMove(move.raw));
  }

  cube.cubies = currentCube.cubies.map(c => ({
    id: c.id,
    x: c.x,
    y: c.y,
    z: c.z,
    colors: { ...c.colors }
  }));
  cube.moveHistory = [...currentCube.moveHistory];
  renderer.setCubeState(cube);
  solvePlaybackIndex = targetIndex;
  updatePlaybackHUD();
}

scrubberSlider.addEventListener('input', (e) => {
  seekPlaybackTo(parseInt(e.target.value, 10));
});

function togglePlayPlayback() {
  if (isPlayingPlayback) {
    pausePlayback();
  } else {
    startPlayback();
  }
}

function startPlayback() {
  if (solvePlaybackIndex >= flatSolveMoves.length) {
    seekPlaybackTo(0);
  }
  const speed = getPlaybackSpeed();
  isPlayingPlayback = true;
  btnPlayToggle.innerText = '⏸️';
  playbackTimer = setInterval(async () => {
    if (renderer.isAnimating) return;
    await playNextStep();
  }, 100 / speed);
}

function pausePlayback() {
  isPlayingPlayback = false;
  btnPlayToggle.innerText = '▶️';
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
}

btnPlayToggle.addEventListener('click', togglePlayPlayback);
btnPlayNext.addEventListener('click', () => {
  pausePlayback();
  playNextStep();
});
btnPlayPrev.addEventListener('click', () => {
  pausePlayback();
  playPrevStep();
});

btnResetCam.addEventListener('click', () => {
  if (isCompeteMode) {
    userRenderer.camera.position.set(4, 4, 6);
    userRenderer.controls.target.set(0, 0, 0);
    userRenderer.controls.update();

    aiRenderer.camera.position.set(4, 4, 6);
    aiRenderer.controls.target.set(0, 0, 0);
    aiRenderer.controls.update();
  } else {
    renderer.camera.position.set(4, 4, 6);
    renderer.controls.target.set(0, 0, 0);
    renderer.controls.update();
  }
});

btnIsolation.addEventListener('click', () => {
  isolationActive = !isolationActive;
  btnIsolation.classList.toggle('active', isolationActive);
  applyStageHighlight();
});

document.querySelectorAll('.curriculum-card').forEach(card => {
  card.addEventListener('click', (e) => {
    if (e.target.classList.contains('isolate-btn')) return;
    
    document.querySelectorAll('.curriculum-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    
    activeStage = card.dataset.stage;
    hudRouxStage.innerText = card.querySelector('.card-title').innerText;
    applyStageHighlight();
  });
});

document.querySelectorAll('.isolate-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    const stage = btn.dataset.stage;
    const isCurrentlyActive = btn.classList.contains('active');
    
    document.querySelectorAll('.isolate-btn').forEach(b => b.classList.remove('active'));
    
    if (!isCurrentlyActive) {
      btn.classList.add('active');
      activeStage = stage;
      isolationActive = true;
      btnIsolation.classList.add('active');
      
      document.querySelectorAll('.curriculum-card').forEach(c => c.classList.remove('active'));
      document.querySelector(`.curriculum-card[data-stage="${stage}"]`).classList.add('active');
    } else {
      isolationActive = false;
      btnIsolation.classList.remove('active');
    }
    applyStageHighlight();
  });
});

// Manual turns helper
function handleManualTurn(moveStr) {
  if (isCompeteMode) {
    if (!competeActive || competeLockInput || userFinished) return;
    
    const parsed = parseMove(moveStr);
    executeMove(userCube, parsed);
    userRenderer.animateMove(moveStr, 160);

    if (userCube.isSolved()) {
      userFinished = true;
      competeStatusBanner.innerText = 'You Solved It!';
    }
  } else {
    resetPlayback();
    const parsed = parseMove(moveStr);
    executeMove(cube, parsed);
    renderer.animateMove(moveStr, 200);
    updateHUD();

    // Verification check for active lesson
    if (activeLesson) {
      if (activeLesson.verify(cube)) {
        lessonSuccessMessage.innerText = `Excellent job completing: ${activeLesson.title}!`;
        lessonSuccessOverlay.style.display = 'flex';
      }
    }
  }
}

// Keyboard binding
let shiftPressed = false;
window.addEventListener('keydown', (e) => {
  if (e.key === 'Shift') {
    shiftPressed = true;
    return;
  }

  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const key = e.key.toLowerCase();
  const moveMap = {
    'r': 'R', 'l': 'L', 'u': 'U', 'd': 'D', 'f': 'F', 'b': 'B', 'm': 'M'
  };

  if (moveMap[key]) {
    e.preventDefault();
    const face = moveMap[key];
    const moveStr = face + (shiftPressed ? "'" : "");
    handleManualTurn(moveStr);
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') shiftPressed = false;
});

// On-screen manual keys
document.querySelectorAll('.key-btn').forEach(btn => {
  let clickCount = 0;
  let clickTimeout = null;

  btn.addEventListener('click', () => {
    clickCount++;
    if (clickTimeout) clearTimeout(clickTimeout);

    clickTimeout = setTimeout(() => {
      let face = btn.dataset.move;
      let mod = '';
      if (shiftPressed) {
        mod = "'";
      } else if (clickCount >= 2) {
        mod = '2';
      }
      
      const moveStr = face + mod;
      handleManualTurn(moveStr);
      clickCount = 0;
    }, 180);
  });
});

function updateHUD() {
  hudRouxStage.innerText = document.querySelector('.curriculum-card.active .card-title').innerText;
  if (cube.isSolved()) {
    hudRouxStage.innerText = 'Solved!';
  }
}

// Compete with AI Orchestration
btnStartCompete.addEventListener('click', async () => {
  if (competeActive) return;

  btnStartCompete.disabled = true;
  btnScramble.disabled = true;
  btnApplyScramble.disabled = true;

  // 1. Setup cubes with scramble (either current or generated)
  if (!currentScramble) {
    currentScramble = generateScramble(15);
    scrambleDisplay.innerText = currentScramble;
  }

  userCube.reset();
  executeSequence(userCube, currentScramble);
  userRenderer.setCubeState(userCube);

  aiCube.reset();
  executeSequence(aiCube, currentScramble);
  aiRenderer.setCubeState(aiCube);

  userFinished = false;
  aiFinished = false;
  competeActive = true;
  competeLockInput = true;

  // Reset display timers
  timerUserEl.innerHTML = `Human: <span style="color: var(--neon-cyan); font-weight: bold; font-family: monospace;">0.00s</span>`;
  timerAiEl.innerHTML = `Roux AI: <span style="color: var(--neon-green); font-weight: bold; font-family: monospace;">0.00s</span>`;
  competeStatusBanner.innerText = 'Ready...';

  // 2. Countdown sequence
  competeCountdownOverlay.style.display = 'flex';
  const cTexts = ['3', '2', '1', 'GO!'];
  for (const label of cTexts) {
    countdownText.innerText = label;
    if (label === 'GO!') {
      countdownText.style.color = 'var(--neon-green)';
      countdownText.style.textShadow = '0 0 30px var(--neon-green)';
    } else {
      countdownText.style.color = 'var(--neon-cyan)';
      countdownText.style.textShadow = '0 0 30px var(--neon-cyan)';
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  competeCountdownOverlay.style.display = 'none';

  // 3. Unlock input and start timers
  competeLockInput = false;
  competeStatusBanner.innerText = 'SOLVE!';

  const compStartTime = performance.now();
  let userTime = 0;
  let aiTime = 0;

  // Solve the AI cube in the background first to get the steps
  let aiMoves = [];
  try {
    const aiSolveResult = solveCube(aiCube.clone());
    aiSolveResult.steps.forEach(step => {
      const moves = step.moves ? step.moves.split(' ').filter(Boolean) : [];
      aiMoves = [...aiMoves, ...moves];
    });
  } catch (err) {
    console.error('AI Solver failed:', err);
  }

  // Timer loop
  competeTimerInterval = setInterval(() => {
    const now = performance.now();
    
    if (!userFinished) {
      userTime = (now - compStartTime) / 1000;
      timerUserEl.innerHTML = `Human: <span style="color: var(--neon-cyan); font-weight: bold; font-family: monospace;">${userTime.toFixed(2)}s</span>`;
    }
    if (!aiFinished) {
      aiTime = (now - compStartTime) / 1000;
      timerAiEl.innerHTML = `Roux AI: <span style="color: var(--neon-green); font-weight: bold; font-family: monospace;">${aiTime.toFixed(2)}s</span>`;
    }

    if (userFinished && aiFinished) {
      clearInterval(competeTimerInterval);
      competeTimerInterval = null;
      competeActive = false;
      btnStartCompete.disabled = false;
      btnScramble.disabled = false;
      btnApplyScramble.disabled = false;

      // Declare winner
      const humanFinal = parseFloat(timerUserEl.querySelector('span').innerText);
      const aiFinal = parseFloat(timerAiEl.querySelector('span').innerText);
      if (humanFinal < aiFinal) {
        competeStatusBanner.innerText = '🏆 HUMAN WINS!';
        competeStatusBanner.style.color = 'var(--neon-cyan)';
        competeStatusBanner.style.textShadow = '0 0 10px rgba(0, 240, 255, 0.5)';
      } else {
        competeStatusBanner.innerText = '🤖 AI WINS!';
        competeStatusBanner.style.color = 'var(--neon-pink)';
        competeStatusBanner.style.textShadow = '0 0 10px rgba(255, 0, 127, 0.5)';
      }
    }
  }, 10);

  // AI Playback loop
  (async () => {
    const targetSec = parseFloat(inputAiTargetTime.value) || 10;
    const totalMoves = aiMoves.length;
    
    // Each move interval is calculated to solve exactly in target seconds
    const intervalMs = totalMoves > 0 ? (targetSec / totalMoves) * 1000 : 100;
    const animMs = Math.max(50, intervalMs * 0.8); // 80% animation, 20% delay

    for (let i = 0; i < totalMoves; i++) {
      if (!competeActive) break; // mode exited
      const move = aiMoves[i];
      executeMove(aiCube, parseMove(move));
      await aiRenderer.animateMove(move, animMs);
      
      const restDelay = Math.max(10, intervalMs - animMs);
      await new Promise(r => setTimeout(r, restDelay));
    }
    
    aiFinished = true;
    if (totalMoves === 0) {
      timerAiEl.innerHTML = `Roux AI: <span style="color: var(--neon-green); font-weight: bold; font-family: monospace;">0.00s</span>`;
    }
  })();
});
