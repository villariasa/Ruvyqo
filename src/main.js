// Main Orchestration Controller for Roux Method Cyber Solver & Trainer
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
  isPieceSolved,
  getRouxStage
} from './recognition/stage-recognizer.js';
import { solvePattern } from './solver/pattern-solver.js';
import { storage } from './persistence/storage.js';

// Import UI subpanels
import { CurriculumPanel } from './ui/curriculum-panel.js';
import { LessonsPanel, getNextLesson } from './ui/lessons-panel.js';
import { CMLLPanel } from './ui/cmll-panel.js';
import { CompeteMode } from './ui/compete-mode.js';
import { StatsPanel } from './ui/stats-panel.js';
import { initOnboardingModal } from './ui/onboarding-modal.js';
import { LESSONS } from './data/lessons.js';
import cmllAlgorithms from './data/cmll-algorithms.json';

// Global variables & state elements
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

const selectPlaybackSpeed = document.getElementById('select-playback-speed');
const chkStageFb = document.getElementById('chk-stage-fb');
const chkStageSb = document.getElementById('chk-stage-sb');
const chkStageCmll = document.getElementById('chk-stage-cmll');
const chkStageLse = document.getElementById('chk-stage-lse');
const customScrambleInput = document.getElementById('custom-scramble-input');
const btnApplyScramble = document.getElementById('btn-apply-scramble');

// Tab Navigation Elements
const tabCurriculum = document.getElementById('tab-curriculum');
const tabLessons = document.getElementById('tab-lessons');
const tabStats = document.getElementById('tab-stats');
const curriculumContent = document.getElementById('curriculum-content');
const lessonsContent = document.getElementById('lessons-content');
const statsContent = document.getElementById('stats-content');

// Sub-Tab Navigation Elements
const subTabStages = document.getElementById('sub-tab-stages');
const subTabCmll = document.getElementById('sub-tab-cmll');
const subTabGlossary = document.getElementById('sub-tab-glossary');

// Intuition mode elements
const btnToggleIntuition = document.getElementById('btn-toggle-intuition');
const intuitionHud = document.getElementById('intuition-hud');
const btnIntuitionExit = document.getElementById('btn-intuition-exit');
const btnIntuitionHint = document.getElementById('btn-intuition-hint');
const intuitionHintText = document.getElementById('intuition-hint-text');

// Roux Stage Target Pieces
const STAGE_PIECES = {
  fb: [9, 3, 0, 21, 18, 12],
  sb: [11, 5, 2, 23, 20, 14],
  cmll: [24, 6, 8, 26],
  lse: [15, 17, 16, 22, 10, 25, 13, 10, 22, 4, 12, 14]
};

// Global App State Object
const app = {
  cube: new CubeState(),
  renderer: null,
  activeStage: 'fb',
  isolationActive: true,
  currentScramble: '',
  
  // Lessons state
  activeLesson: null,
  
  // Compete state
  isCompeteMode: false,
  userCube: null,
  aiCube: null,
  userRenderer: null,
  aiRenderer: null,
  competeActive: false,
  competeLockInput: false,
  userFinished: false,
  aiFinished: false,

  // Intuition state
  isIntuitionMode: false,

  // Panels
  curriculumPanel: null,
  lessonsPanel: null,
  cmllPanel: null,
  competeMode: null,
  statsPanel: null,

  // Methods
  applyStageHighlight() {
    if (this.isolationActive) {
      this.renderer.updateStageHighlight(STAGE_PIECES[this.activeStage], true);
    } else {
      this.renderer.updateStageHighlight([], false);
    }
  },

  updateHUD() {
    const stageNameMap = {
      fb: 'First Block',
      sb: 'Second Block',
      cmll: 'CMLL corners',
      lse: 'LSE edges'
    };
    hudRouxStage.innerText = stageNameMap[this.activeStage] || 'Idle';
    if (this.cube.isSolved()) {
      hudRouxStage.innerText = 'Solved!';
    }
  },

  resetPlayback() {
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
  },

  exitLesson() {
    if (!this.activeLesson) return;
    this.activeLesson = null;
    document.getElementById('lesson-hud').style.display = 'none';
    document.getElementById('lesson-success-overlay').style.display = 'none';
    document.querySelectorAll('.lesson-card').forEach(c => c.classList.remove('active'));
    this.cube.reset();
    this.renderer.setCubeState(this.cube);
    this.updateHUD();
  }
};

// Playback Variables
let currentSolve = null;
let flatSolveMoves = [];
let solvePlaybackIndex = 0;
let isPlayingPlayback = false;
let playbackTimer = null;
let playbackStartState = null;

// Free Solve Timer State
let freeSolveScrambleApplied = false;
let freeSolveStartTime = null;
let freeSolveTimerRunning = false;
let fbFinishTime = null;
let sbFinishTime = null;
let cmllFinishTime = null;

// Display Warning Toasts
export function showToast(message, type = 'warning') {
  const toast = document.createElement('div');
  toast.className = `toast-alert toast-${type}`;
  toast.innerText = message;
  
  toast.style.position = 'fixed';
  toast.style.bottom = '30px';
  toast.style.right = '30px';
  toast.style.zIndex = '1000';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.background = type === 'warning' ? 'rgba(255, 0, 127, 0.9)' : 'rgba(0, 240, 255, 0.9)';
  toast.style.border = type === 'warning' ? '1px solid var(--neon-pink)' : '1px solid var(--neon-cyan)';
  toast.style.color = '#fff';
  toast.style.fontFamily = "'Space Grotesk', sans-serif";
  toast.style.fontSize = '0.9rem';
  toast.style.fontWeight = 'bold';
  toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
  toast.style.pointerEvents = 'none';
  toast.style.transition = 'opacity 0.3s, transform 0.3s';
  toast.style.transform = 'translateY(10px)';
  toast.style.opacity = '0';
  
  document.body.appendChild(toast);
  
  toast.offsetHeight; // Reflow
  
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';
  
  setTimeout(() => {
    toast.style.transform = 'translateY(-10px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initializing Context and sub panels
app.renderer = new Cube3DRenderer(container);
app.renderer.setCubeState(app.cube);

app.curriculumPanel = new CurriculumPanel(app);
app.lessonsPanel = new LessonsPanel(app);
app.cmllPanel = new CMLLPanel(app);
app.competeMode = new CompeteMode(app);
app.statsPanel = new StatsPanel(app);

// Mount default views
app.curriculumPanel.renderStages();
app.lessonsPanel.render();
app.statsPanel.mount(statsContent);
app.updateHUD();

// Start onboarding
initOnboardingModal(app);

// Navigation tab clicks
tabCurriculum.addEventListener('click', () => {
  setTabActive(tabCurriculum, curriculumContent, 'var(--neon-cyan)');
  setTabInactive(tabLessons, lessonsContent);
  setTabInactive(tabStats, statsContent);
  app.exitLesson();
  exitIntuitionMode();
  app.curriculumPanel.renderStages();
  subTabStages.click();
});

tabLessons.addEventListener('click', () => {
  setTabActive(tabLessons, lessonsContent, 'var(--neon-green)');
  setTabInactive(tabCurriculum, curriculumContent);
  setTabInactive(tabStats, statsContent);
  exitIntuitionMode();
  app.lessonsPanel.render();
});

tabStats.addEventListener('click', () => {
  setTabActive(tabStats, statsContent, 'var(--neon-cyan)');
  setTabInactive(tabCurriculum, curriculumContent);
  setTabInactive(tabLessons, lessonsContent);
  app.exitLesson();
  exitIntuitionMode();
  app.statsPanel.render();
});

function setTabActive(btn, contentEl, activeColor) {
  btn.classList.add('active');
  btn.style.background = `rgba(${activeColor === 'var(--neon-cyan)' ? '0,240,255' : '57,255,20'}, 0.1)`;
  btn.style.borderColor = activeColor;
  btn.style.color = activeColor;
  contentEl.style.display = 'flex';
}

function setTabInactive(btn, contentEl) {
  btn.classList.remove('active');
  btn.style.background = 'rgba(255,255,255,0.02)';
  btn.style.borderColor = 'rgba(255,255,255,0.1)';
  btn.style.color = 'var(--text-secondary)';
  contentEl.style.display = 'none';
}

// Sub-Tab Navigation inside Curriculum content
subTabStages.addEventListener('click', () => {
  setSubTabActive(subTabStages);
  setSubTabInactive(subTabCmll);
  setSubTabInactive(subTabGlossary);
  app.curriculumPanel.renderStages();
});

subTabCmll.addEventListener('click', () => {
  setSubTabActive(subTabCmll);
  setSubTabInactive(subTabStages);
  setSubTabInactive(subTabGlossary);
  app.cmllPanel.renderBrowser();
});

subTabGlossary.addEventListener('click', () => {
  setSubTabActive(subTabGlossary);
  setSubTabInactive(subTabStages);
  setSubTabInactive(subTabCmll);
  app.curriculumPanel.renderGlossary();
});

function setSubTabActive(btn) {
  btn.classList.add('active');
}

function setSubTabInactive(btn) {
  btn.classList.remove('active');
}

// Playback Helper Speed
function getPlaybackSpeed() {
  return parseFloat(selectPlaybackSpeed.value) || 1.0;
}

// Scramble Event
btnScramble.addEventListener('click', async () => {
  app.resetPlayback();
  app.exitLesson();
  exitIntuitionMode();
  
  btnScramble.disabled = true;
  btnSolve.disabled = true;
  btnApplyScramble.disabled = true;

  const speed = getPlaybackSpeed();
  app.currentScramble = generateScramble(15);
  freeSolveScrambleApplied = true;
  freeSolveTimerRunning = false;

  if (app.isCompeteMode) {
    app.userCube.reset();
    app.userRenderer.setCubeState(app.userCube);
    app.aiCube.reset();
    app.aiRenderer.setCubeState(app.aiCube);

    scrambleDisplay.innerText = 'Scrambling both cubes...';
    const moves = app.currentScramble.split(' ').filter(Boolean);
    for (const mStr of moves) {
      const parsed = parseMove(mStr);
      executeMove(app.userCube, parsed);
      executeMove(app.aiCube, parsed);
      app.userRenderer.animateMove(mStr, 120 / speed);
      await app.aiRenderer.animateMove(mStr, 120 / speed);
    }
  } else {
    app.cube.reset();
    app.renderer.setCubeState(app.cube);

    scrambleDisplay.innerText = 'Scrambling...';
    const moves = app.currentScramble.split(' ').filter(Boolean);
    for (const mStr of moves) {
      const parsed = parseMove(mStr);
      executeMove(app.cube, parsed);
      await app.renderer.animateMove(mStr, 120 / speed);
    }
    app.updateHUD();
  }

  scrambleDisplay.innerText = app.currentScramble;
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

  app.resetPlayback();
  app.exitLesson();
  exitIntuitionMode();
  
  btnScramble.disabled = true;
  btnSolve.disabled = true;
  btnApplyScramble.disabled = true;

  const speed = getPlaybackSpeed();
  app.currentScramble = sequence;
  freeSolveScrambleApplied = true;
  freeSolveTimerRunning = false;

  if (app.isCompeteMode) {
    app.userCube.reset();
    app.userRenderer.setCubeState(app.userCube);
    app.aiCube.reset();
    app.aiRenderer.setCubeState(app.aiCube);

    scrambleDisplay.innerText = 'Applying custom scramble...';
    const moves = sequence.split(' ').filter(Boolean);
    try {
      for (const mStr of moves) {
        const parsed = parseMove(mStr);
        executeMove(app.userCube, parsed);
        executeMove(app.aiCube, parsed);
        app.userRenderer.animateMove(mStr, 120 / speed);
        await app.aiRenderer.animateMove(mStr, 120 / speed);
      }
    } catch (err) {
      scrambleDisplay.innerText = `Invalid move: ${err.message}`;
    }
  } else {
    app.cube.reset();
    app.renderer.setCubeState(app.cube);

    scrambleDisplay.innerText = 'Applying custom scramble...';
    const moves = sequence.split(' ').filter(Boolean);
    try {
      for (const mStr of moves) {
        const parsed = parseMove(mStr);
        executeMove(app.cube, parsed);
        await app.renderer.animateMove(mStr, 120 / speed);
      }
      app.updateHUD();
    } catch (err) {
      scrambleDisplay.innerText = `Invalid move: ${err.message}`;
    }
  }

  scrambleDisplay.innerText = sequence;
  btnScramble.disabled = false;
  btnSolve.disabled = false;
  btnApplyScramble.disabled = false;
});

// Reset Event
btnReset.addEventListener('click', () => {
  app.resetPlayback();
  app.exitLesson();
  exitIntuitionMode();
  freeSolveScrambleApplied = false;
  freeSolveTimerRunning = false;

  if (app.isCompeteMode) {
    app.userCube.reset();
    app.userRenderer.setCubeState(app.userCube);
    app.aiCube.reset();
    app.aiRenderer.setCubeState(app.aiCube);
    scrambleDisplay.innerText = 'Cubes reset to solved state';
  } else {
    app.cube.reset();
    app.renderer.setCubeState(app.cube);
    scrambleDisplay.innerText = 'Cube reset to solved state';
    app.updateHUD();
  }
});

// Solver Solve Event
btnSolve.addEventListener('click', () => {
  if (app.isCompeteMode) {
    scrambleDisplay.innerText = 'Solve control is disabled in Compete Mode.';
    return;
  }
  if (app.cube.isSolved()) {
    scrambleDisplay.innerText = 'Cube is already solved!';
    return;
  }

  app.resetPlayback();
  app.exitLesson();
  exitIntuitionMode();
  btnSolve.innerText = 'Solving...';
  btnSolve.disabled = true;

  const options = {
    fb: chkStageFb.checked,
    sb: chkStageSb.checked,
    cmll: chkStageCmll.checked,
    lse: chkStageLse.checked
  };

  setTimeout(() => {
    try {
      const solveStartState = app.cube.clone();
      const solveResult = solveCube(solveStartState, options);

      playbackStartState = solveStartState.clone();
      currentSolve = solveResult.steps;
      flatSolveMoves = [];

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
      scrambleDisplay.innerText = `Solution: ${solveResult.totalMoves || 'Already solved!'}`;
      btnSolve.innerText = 'Solve Cube';
      btnSolve.disabled = false;

      setupPlayback();
    } catch (err) {
      console.error(err);
      scrambleDisplay.innerText = `Solver error: ${err.message}`;
      btnSolve.innerText = 'Solve Cube';
      btnSolve.disabled = false;
    }
  }, 50);
});

// Playback slider settings
function setupPlayback() {
  solvePlaybackIndex = 0;
  isPlayingPlayback = false;
  btnPlayToggle.innerText = '▶️';
  
  scrubberSlider.disabled = false;
  scrubberSlider.max = flatSolveMoves.length;
  scrubberSlider.value = 0;
  updatePlaybackHUD();

  stepLog.innerHTML = '';
  currentSolve.forEach((step, idx) => {
    const item = document.createElement('div');
    item.className = 'step-item';
    item.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span class="step-label">${step.name}</span>
          <span class="step-moves">${step.moves || 'Solved'}</span>
        </div>
        ${step.explanation ? `<p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3; text-align: left; margin: 0; margin-top: 2px;">${step.explanation}</p>` : ''}
      </div>
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

function updatePlaybackHUD() {
  scrubberText.innerText = `${solvePlaybackIndex} / ${flatSolveMoves.length}`;
  scrubberSlider.value = solvePlaybackIndex;

  if (solvePlaybackIndex < flatSolveMoves.length) {
    const nextMove = flatSolveMoves[solvePlaybackIndex];
    solveOverlay.classList.add('visible');
    overlayStepName.innerText = nextMove.stepName;
    overlayStepMoves.innerText = `Next Move: ${nextMove.raw}`;
    overlaySolveBadge.innerText = `Move ${solvePlaybackIndex + 1} / ${flatSolveMoves.length}`;

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
  const move = flatSolveMoves[solvePlaybackIndex++];
  executeMove(app.cube, parseMove(move.raw));
  updatePlaybackHUD();
  await app.renderer.animateMove(move.raw, 180 / speed);
}

function playPrevStep() {
  if (solvePlaybackIndex <= 0) return;
  const speed = getPlaybackSpeed();
  const move = flatSolveMoves[--solvePlaybackIndex];
  const parsed = parseMove(move.raw);
  const inv = { ...parsed, prime: !parsed.double && !parsed.prime };
  executeMove(app.cube, inv);
  updatePlaybackHUD();
  app.renderer.animateMove(parsed.face + (inv.prime ? "'" : (parsed.double ? '2' : '')), 180 / speed);
}

function seekPlaybackTo(targetIndex) {
  const currentCube = playbackStartState ? playbackStartState.clone() : new CubeState();
  if (!playbackStartState && app.currentScramble) {
    executeSequence(currentCube, app.currentScramble);
  }
  for (let i = 0; i < targetIndex; i++) {
    executeMove(currentCube, parseMove(flatSolveMoves[i].raw));
  }
  app.cube.cubies = currentCube.cubies.map(c => ({
    id: c.id, x: c.x, y: c.y, z: c.z, colors: { ...c.colors }
  }));
  app.cube.moveHistory = [...currentCube.moveHistory];
  app.renderer.setCubeState(app.cube);
  solvePlaybackIndex = targetIndex;
  updatePlaybackHUD();
}

scrubberSlider.addEventListener('input', (e) => {
  seekPlaybackTo(parseInt(e.target.value, 10));
});

function togglePlayPlayback() {
  if (isPlayingPlayback) pausePlayback();
  else startPlayback();
}

function startPlayback() {
  if (solvePlaybackIndex >= flatSolveMoves.length) {
    seekPlaybackTo(0);
  }
  const speed = getPlaybackSpeed();
  isPlayingPlayback = true;
  btnPlayToggle.innerText = '⏸️';
  playbackTimer = setInterval(async () => {
    if (app.renderer.isAnimating) return;
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
btnPlayNext.addEventListener('click', () => { pausePlayback(); playNextStep(); });
btnPlayPrev.addEventListener('click', () => { pausePlayback(); playPrevStep(); });

btnResetCam.addEventListener('click', () => {
  if (app.isCompeteMode) {
    app.userRenderer.camera.position.set(4, 4, 6);
    app.userRenderer.controls.target.set(0, 0, 0);
    app.userRenderer.controls.update();
    app.aiRenderer.camera.position.set(4, 4, 6);
    app.aiRenderer.controls.target.set(0, 0, 0);
    app.aiRenderer.controls.update();
  } else {
    app.renderer.camera.position.set(4, 4, 6);
    app.renderer.controls.target.set(0, 0, 0);
    app.renderer.controls.update();
  }
});

btnIsolation.addEventListener('click', () => {
  app.isolationActive = !app.isolationActive;
  btnIsolation.classList.toggle('active', app.isolationActive);
  app.applyStageHighlight();
});

// Compete Mode Toggle Binding
document.getElementById('btn-toggle-compete').addEventListener('click', () => {
  app.competeMode.toggle();
});
document.getElementById('btn-start-compete').addEventListener('click', () => {
  app.competeMode.startRace();
});

// --- INTUITION MODE INTERACTION LOGIC ---
btnToggleIntuition.addEventListener('click', () => {
  app.resetPlayback();
  app.exitLesson();
  
  app.isIntuitionMode = !app.isIntuitionMode;
  btnToggleIntuition.classList.toggle('active', app.isIntuitionMode);

  if (app.isIntuitionMode) {
    // Start intuition trainer
    intuitionHud.style.display = 'flex';
    app.cube.reset();
    
    // Auto scramble if no scramble exists
    app.currentScramble = generateScramble(15);
    scrambleDisplay.innerText = app.currentScramble;
    executeSequence(app.cube, app.currentScramble);
    
    app.renderer.setCubeState(app.cube);
    app.activeStage = 'fb';
    app.isolationActive = true;
    app.applyStageHighlight();

    updateIntuitionTracker();
  } else {
    exitIntuitionMode();
  }
});

btnIntuitionExit.addEventListener('click', exitIntuitionMode);

function exitIntuitionMode() {
  if (!app.isIntuitionMode) return;
  app.isIntuitionMode = false;
  btnToggleIntuition.classList.remove('active');
  intuitionHud.style.display = 'none';
  app.cube.reset();
  app.renderer.setCubeState(app.cube);
  app.updateHUD();
}

function updateIntuitionTracker() {
  if (!app.isIntuitionMode) return;

  const currentStage = getRouxStage(app.cube);
  const isFB = !isFirstBlockSolved(app.cube);
  
  const title = document.getElementById('intuition-hud-title');
  title.innerText = isFB ? "Building First Block (FB)" : "Building Second Block (SB)";
  
  const pieces = isFB ? STAGE_PIECES.fb : STAGE_PIECES.sb;
  const names = isFB ? 
    ["DL edge", "BL edge", "DBL corner", "FL edge", "DFL corner", "L center"] :
    ["DR edge", "BR edge", "DBR corner", "FR edge", "DFR corner", "R center"];

  let solvedCount = 0;
  const grid = document.getElementById('intuition-pieces-grid');
  grid.innerHTML = '';

  pieces.forEach((pid, idx) => {
    const solved = isPieceSolved(app.cube, pid);
    if (solved) solvedCount++;

    const chip = document.createElement('div');
    chip.className = `piece-chip ${solved ? 'solved' : ''}`;
    chip.innerText = `${names[idx]} ${solved ? '✓' : '✗'}`;
    grid.appendChild(chip);
  });

  document.getElementById('intuition-hud-progress').innerText = `${solvedCount} of 6 pieces placed`;

  // Auto transition stage highlight
  app.activeStage = isFB ? 'fb' : 'sb';
  app.applyStageHighlight();

  if (isFirstBlockSolved(app.cube) && isSecondBlockSolved(app.cube)) {
    showToast("🎉 Blocks completed! Excellent intuition!", "info");
    exitIntuitionMode();
  }
}

// Single-move assist hint algorithm
btnIntuitionHint.addEventListener('click', () => {
  if (!app.isIntuitionMode) return;

  const isFB = !isFirstBlockSolved(app.cube);
  let nextMove = null;

  try {
    if (isFB) {
      if (!isPieceSolved(app.cube, 9)) {
        nextMove = solvePattern(app.cube.clone(), [9], ['R', 'L', 'U', 'D', 'F', 'B'], 7)[0];
      } else if (!isPieceSolved(app.cube, 3)) {
        nextMove = solvePattern(app.cube.clone(), [9, 3], ['R', 'U', 'F', 'B', 'M'], 9)[0];
      } else if (!isPieceSolved(app.cube, 0)) {
        nextMove = solvePattern(app.cube.clone(), [9, 3, 0], ['R', 'U', 'F', 'B', 'M'], 10)[0];
      } else if (!isPieceSolved(app.cube, 21)) {
        nextMove = solvePattern(app.cube.clone(), [9, 3, 0, 21], ['R', 'U', 'F', 'M'], 10)[0];
      } else if (!isPieceSolved(app.cube, 18)) {
        nextMove = solvePattern(app.cube.clone(), [9, 3, 0, 21, 18], ['R', 'U', 'F', 'M'], 11)[0];
      }
    } else {
      if (!isPieceSolved(app.cube, 11)) {
        nextMove = solvePattern(app.cube.clone(), [11], ['R', 'U', 'M'], 8)[0];
      } else if (!isPieceSolved(app.cube, 5)) {
        nextMove = solvePattern(app.cube.clone(), [11, 5], ['R', 'U', 'M'], 9)[0];
      } else if (!isPieceSolved(app.cube, 2)) {
        nextMove = solvePattern(app.cube.clone(), [11, 5, 2], ['R', 'U', 'M'], 11)[0];
      } else if (!isPieceSolved(app.cube, 23)) {
        nextMove = solvePattern(app.cube.clone(), [11, 5, 2, 23], ['R', 'U', 'M'], 14)[0];
      } else if (!isPieceSolved(app.cube, 20)) {
        nextMove = solvePattern(app.cube.clone(), [11, 5, 2, 23, 20], ['R', 'U', 'M'], 15)[0];
      }
    }
  } catch (e) {
    console.error('Hint solver failed:', e);
  }

  if (nextMove) {
    intuitionHintText.innerText = `Hint: Try ${nextMove.raw}`;
    intuitionHintText.style.display = 'block';
    
    // Auto hide hint text after 3 seconds
    setTimeout(() => {
      intuitionHintText.style.display = 'none';
    }, 3000);
  } else {
    intuitionHintText.innerText = `No hint found. Check blocks.`;
    intuitionHintText.style.display = 'block';
  }
});

// Dynamic Stage Warnings Helper
const PIECE_NAMES = {
  9: "DL edge", 3: "BL edge", 0: "DBL corner", 21: "FL edge", 18: "DFL corner", 12: "L center",
  11: "DR edge", 5: "BR edge", 2: "DBR corner", 23: "FR edge", 20: "DFR corner", 14: "R center"
};

// Check if solved blocks are broken
function checkBlockDisturbances(cubeBefore) {
  const fbBefore = isFirstBlockSolved(cubeBefore);
  const sbBefore = isSecondBlockSolved(cubeBefore);
  const fbAfter = isFirstBlockSolved(app.cube);
  const sbAfter = isSecondBlockSolved(app.cube);

  // 1. FB disturbance check
  if (fbBefore && !fbAfter) {
    const broken = STAGE_PIECES.fb.find(pid => !isPieceSolved(app.cube, pid));
    if (broken !== undefined) {
      showToast(`⚠️ FB disturbed: ${PIECE_NAMES[broken] || 'piece'} is now unsolved!`, 'warning');
    }
  }

  // 2. SB disturbance check
  if (sbBefore && !sbAfter) {
    const broken = STAGE_PIECES.sb.find(pid => !isPieceSolved(app.cube, pid));
    if (broken !== undefined) {
      showToast(`⚠️ SB disturbed: ${PIECE_NAMES[broken] || 'piece'} is now unsolved!`, 'warning');
    }
  }
}

// --- MANUAL TURNS HANDLER ---
function handleManualTurn(moveStr) {
  if (app.isCompeteMode) {
    if (!app.competeActive || app.competeLockInput || app.userFinished) return;
    
    const parsed = parseMove(moveStr);
    executeMove(app.userCube, parsed);
    app.userRenderer.animateMove(moveStr, 160);

    if (app.userCube.isSolved()) {
      app.userFinished = true;
      app.statusBanner.innerText = 'You Solved It!';
    }
  } else {
    // Clone state before move for disturbance checklist checks
    const cubeBefore = app.cube.clone();

    app.resetPlayback();
    const parsed = parseMove(moveStr);
    executeMove(app.cube, parsed);
    app.renderer.animateMove(moveStr, 200);
    app.updateHUD();

    // Check block disturbances
    checkBlockDisturbances(cubeBefore);

    // Active lesson verification
    if (app.activeLesson) {
      app.lessonsPanel.handleLessonTurn();
    }

    // Active CMLL drill check
    if (app.cmllPanel.activeDrillCase) {
      app.cmllPanel.handleDrillTurn();
    }

    // Active Intuition checklist update
    if (app.isIntuitionMode) {
      updateIntuitionTracker();
    }

    // Free Solving splits timer
    if (!app.activeLesson && !app.cmllPanel.activeDrillCase && !app.isIntuitionMode) {
      handleFreeSolveTimer();
    }
  }
}

function handleFreeSolveTimer() {
  if (freeSolveScrambleApplied && !app.cube.isSolved() && !freeSolveTimerRunning) {
    // Start solve stopwatch!
    freeSolveStartTime = Date.now();
    freeSolveTimerRunning = true;
    fbFinishTime = null;
    sbFinishTime = null;
    cmllFinishTime = null;
    showToast("⏱️ Solve timer started on first move!", "info");
  }

  if (freeSolveTimerRunning) {
    const stage = getRouxStage(app.cube);
    const elapsed = Date.now() - freeSolveStartTime;

    // Track stages transition split markers
    if (stage === 'SB' && fbFinishTime === null) {
      fbFinishTime = elapsed;
      showToast(`⏱️ FB split: ${(fbFinishTime/1000).toFixed(2)}s`, 'info');
    }
    if (stage === 'CMLL' && sbFinishTime === null) {
      sbFinishTime = elapsed;
      showToast(`⏱️ SB split: ${((sbFinishTime - fbFinishTime)/1000).toFixed(2)}s`, 'info');
    }
    if (stage === 'LSE' && cmllFinishTime === null) {
      cmllFinishTime = elapsed;
      showToast(`⏱️ CMLL split: ${((cmllFinishTime - sbFinishTime)/1000).toFixed(2)}s`, 'info');
    }

    if (app.cube.isSolved()) {
      freeSolveTimerRunning = false;
      freeSolveScrambleApplied = false;
      const lseFinishTime = elapsed;
      
      const fb = fbFinishTime || 0;
      const sb = sbFinishTime ? sbFinishTime - fb : 0;
      const cmll = cmllFinishTime ? cmllFinishTime - (sbFinishTime || 0) : 0;
      const lse = lseFinishTime - (cmllFinishTime || sbFinishTime || fb || 0);

      // Record solved splits stats
      const record = {
        timestamp: Date.now(),
        scramble: app.currentScramble || 'Manual Moves Solve',
        totalTimeMs: lseFinishTime,
        splitTimes: { fb, sb, cmll, lse },
        moveCount: app.cube.moveHistory.length
      };

      storage.addSolveRecord(record);
      showToast(`🎉 Cube solved in ${(lseFinishTime/1000).toFixed(2)}s! Splits saved.`, 'info');
      
      // Update stats panel if active
      if (tabStats.classList.contains('active')) {
        app.statsPanel.render();
      }
    }
  }
}

// Global Key bindings
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

// Onscreen control keys
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

// Success Modal Lesson Next Hook
document.getElementById('btn-lesson-next').addEventListener('click', () => {
  document.getElementById('lesson-success-overlay').style.display = 'none';
  const next = getNextLesson(app.activeLesson);
  if (next) {
    app.lessonsPanel.startLesson(next);
  } else {
    app.exitLesson();
    scrambleDisplay.innerText = '🎉 All Roux curriculum lessons completed! Excellent job!';
  }
});

// --- PRACTICE RECOMMENDER SYSTEM ---
function getPracticeRecommendation() {
  const completedLessons = storage.getCompletedLessons();
  const incompleteLesson = LESSONS.find(l => !completedLessons.includes(l.id));

  // 1. Earliest incomplete lesson
  if (incompleteLesson) {
    return {
      type: 'lesson',
      id: incompleteLesson.id,
      text: `Practice Suggestion: Try lesson "${incompleteLesson.title}" to continue learning the curriculum.`,
      target: incompleteLesson
    };
  }

  // 2. Worst accuracy CMLL case
  const stats = storage.getCMLLStats();
  const cases = Object.keys(cmllAlgorithms);
  let worstCaseId = null;
  let worstAcc = 1.1;

  cases.forEach(cId => {
    const s = stats[cId];
    if (s && s.attempts > 0) {
      const acc = s.correct / s.attempts;
      if (acc < worstAcc) {
        worstAcc = acc;
        worstCaseId = cId;
      }
    }
  });

  if (worstCaseId) {
    const value = cmllAlgorithms[worstCaseId];
    return {
      type: 'cmll',
      id: worstCaseId,
      text: `Practice Suggestion: Drill case "${value.name}" (${Math.round(worstAcc * 100)}% accuracy) to improve your weak spots.`,
      target: worstCaseId
    };
  }

  // 3. Fallback: Full solve
  return {
    type: 'solve',
    text: "Practice Suggestion: You've completed all lessons and mastered your CMLL cases! We recommend running a timed full solve."
  };
}

document.getElementById('btn-recommend-practice').addEventListener('click', () => {
  const rec = getPracticeRecommendation();
  showToast(rec.text, 'info');

  if (rec.type === 'lesson') {
    tabLessons.click();
    setTimeout(() => {
      app.lessonsPanel.startLesson(rec.target);
    }, 50);
  } else if (rec.type === 'cmll') {
    tabCurriculum.click();
    setTimeout(() => {
      subTabCmll.click();
      setTimeout(() => {
        app.cmllPanel.startCMLLDrill(rec.target);
      }, 50);
    }, 50);
  } else if (rec.type === 'solve') {
    tabCurriculum.click();
    setTimeout(() => {
      subTabStages.click();
      btnScramble.click();
    }, 50);
  }
});

// --- SOLVE RECONSTRUCTION IMPORT ---
const reconModal = document.getElementById('reconstruction-modal');
const btnImportRecon = document.getElementById('btn-import-reconstruction');
const btnReconCancel = document.getElementById('btn-reconstruct-cancel');
const btnReconSubmit = document.getElementById('btn-reconstruct-submit');
const reconInput = document.getElementById('reconstruction-input');

function importReconstruction(text) {
  let scramble = '';
  let solution = '';

  const scrambleMatch = text.match(/scramble:\s*(.+)/i);
  const solutionMatch = text.match(/(?:solution|moves):\s*(.+)/i);

  if (scrambleMatch) {
    scramble = scrambleMatch[1].trim();
  }
  if (solutionMatch) {
    solution = solutionMatch[1].trim();
  }

  // Fallback by slash '/'
  if (!scramble || !solution) {
    const parts = text.split('/');
    if (parts.length >= 2) {
      scramble = parts[0].replace(/scramble:/i, '').trim();
      solution = parts[1].replace(/solution:|moves:/i, '').trim();
    }
  }

  // Fallback by newlines
  if (!scramble || !solution) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
      scramble = lines[0];
      solution = lines[1];
    }
  }

  if (!scramble || !solution) {
    throw new Error('Reconstruction format invalid. Please specify a Scramble and a Solution.');
  }

  // Segment moves into Roux stages by replaying
  const tempCube = new CubeState();
  executeSequence(tempCube, scramble);
  
  const moves = solution.split(/\s+/).filter(Boolean);
  const steps = [
    { name: 'First Block (FB)', stage: 'FB', moves: [], explanation: 'Solve the First Block on the Left side.' },
    { name: 'Second Block (SB)', stage: 'SB', moves: [], explanation: 'Solve the Second Block on the Right side.' },
    { name: 'CMLL', stage: 'CMLL', moves: [], explanation: 'Solve U-layer corners.' },
    { name: 'Last Six Edges (LSE)', stage: 'LSE', moves: [], explanation: 'Solve remaining six edges and centers.' }
  ];

  for (const mStr of moves) {
    const stage = getRouxStage(tempCube);
    executeMove(tempCube, parseMove(mStr));

    if (stage === 'FB') {
      steps[0].moves.push(mStr);
    } else if (stage === 'SB') {
      steps[1].moves.push(mStr);
    } else if (stage === 'CMLL') {
      steps[2].moves.push(mStr);
    } else {
      steps[3].moves.push(mStr);
    }
  }

  const finalSteps = steps.map(s => ({
    ...s,
    moves: s.moves.join(' ')
  })).filter(s => s.moves.length > 0);

  if (finalSteps.length === 0) {
    throw new Error('No moves found in solution.');
  }

  // Load state
  app.resetPlayback();
  app.exitLesson();
  exitIntuitionMode();
  exitTracingMode();

  app.currentScramble = scramble;
  scrambleDisplay.innerText = scramble;

  app.cube.reset();
  executeSequence(app.cube, scramble);
  app.renderer.setCubeState(app.cube);

  playbackStartState = app.cube.clone();
  currentSolve = finalSteps;
  flatSolveMoves = [];

  currentSolve.forEach((step, stepIdx) => {
    const stepMoves = step.moves ? step.moves.split(' ').filter(Boolean) : [];
    stepMoves.forEach(mStr => {
      flatSolveMoves.push({
        raw: mStr,
        stepName: step.name,
        stepIndex: stepIdx + 1,
        totalSteps: currentSolve.length
      });
    });
  });

  hudSolveLen.innerText = `${flatSolveMoves.length} moves`;
  setupPlayback();
}

btnImportRecon.addEventListener('click', () => {
  reconInput.value = '';
  reconModal.style.display = 'flex';
  setTimeout(() => reconModal.style.opacity = '1', 10);
});

const closeReconModal = () => {
  reconModal.style.opacity = '0';
  setTimeout(() => reconModal.style.display = 'none', 300);
};

btnReconCancel.addEventListener('click', closeReconModal);

btnReconSubmit.addEventListener('click', () => {
  const text = reconInput.value.trim();
  if (!text) {
    showToast('Please paste a solve reconstruction!', 'warning');
    return;
  }
  try {
    importReconstruction(text);
    closeReconModal();
    showToast('Reconstruction imported successfully!', 'info');
  } catch (err) {
    showToast(err.message, 'warning');
  }
});


// --- STICKER NET SCRAMBLE INTERFACE ---
const stickersModal = document.getElementById('stickers-modal');
const btnImportStickers = document.getElementById('btn-import-stickers');
const btnStickersCancel = document.getElementById('btn-stickers-cancel');
const btnStickersSubmit = document.getElementById('btn-stickers-submit');
const btnStickersReset = document.getElementById('btn-stickers-reset');
const stickerNetGrid = document.getElementById('sticker-net-grid');

let activePaletteColor = 'yellow';

// Setup palette selector
document.querySelectorAll('.palette-color').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.palette-color').forEach(b => {
      b.classList.remove('selected');
      b.style.border = '1px solid rgba(255,255,255,0.2)';
    });
    
    btn.classList.add('selected');
    btn.style.border = '2px solid white';
    activePaletteColor = btn.dataset.color;
  });
});

const FACE_COLOR_MAP = {
  yellow: '#ffd200',
  white: '#ffffff',
  green: '#00e676',
  blue: '#2979ff',
  orange: '#ff9100',
  red: '#ff1744'
};

function renderStickerNet() {
  const faceLayout = [
    [null, 'u', null, null],
    ['l', 'f', 'r', 'b'],
    [null, 'd', null, null]
  ];

  let html = `<div style="display: grid; grid-template-columns: repeat(4, 85px); grid-template-rows: repeat(3, 85px); gap: 10px;">`;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const face = faceLayout[r][c];
      if (face) {
        // Render 3x3 face
        html += `
          <div class="net-face" data-face="${face}" style="display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); gap: 3px; width: 85px; height: 85px; border: 1px solid rgba(255,255,255,0.15); padding: 4px; background: rgba(8,10,18,0.6); border-radius: 6px;">
            ${Array(9).fill(0).map((_, idx) => {
              const isCenter = idx === 4;
              const defaultColor = getFaceDefaultColor(face);
              return `
                <div class="net-sticker" data-face="${face}" data-index="${idx}" style="background: ${FACE_COLOR_MAP[defaultColor]}; border-radius: 3px; cursor: ${isCenter ? 'not-allowed' : 'pointer'};" data-color="${defaultColor}"></div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        html += `<div></div>`;
      }
    }
  }
  html += `</div>`;
  stickerNetGrid.innerHTML = html;

  // Bind sticker click events
  stickerNetGrid.querySelectorAll('.net-sticker').forEach(sticker => {
    sticker.addEventListener('click', () => {
      const index = parseInt(sticker.dataset.index, 10);
      if (index === 4) return; // centers are locked
      
      sticker.style.background = FACE_COLOR_MAP[activePaletteColor];
      sticker.dataset.color = activePaletteColor;
    });
  });
}

function getFaceDefaultColor(face) {
  const map = { u: 'yellow', d: 'white', f: 'green', b: 'blue', l: 'orange', r: 'red' };
  return map[face];
}

btnImportStickers.addEventListener('click', () => {
  renderStickerNet();
  stickersModal.style.display = 'flex';
  setTimeout(() => stickersModal.style.opacity = '1', 10);
});

const closeStickersModal = () => {
  stickersModal.style.opacity = '0';
  setTimeout(() => stickersModal.style.display = 'none', 300);
};

btnStickersCancel.addEventListener('click', closeStickersModal);

btnStickersReset.addEventListener('click', () => {
  renderStickerNet();
});

btnStickersSubmit.addEventListener('click', () => {
  // Collect state
  const stickerColors = { u: [], d: [], f: [], b: [], l: [], r: [] };
  stickerNetGrid.querySelectorAll('.net-sticker').forEach(sticker => {
    const face = sticker.dataset.face;
    const color = sticker.dataset.color;
    stickerColors[face].push(color);
  });

  try {
    app.exitLesson();
    exitIntuitionMode();
    exitTracingMode();
    app.resetPlayback();
    
    app.cube.setStickersState(stickerColors);
    app.renderer.setCubeState(app.cube);
    app.currentScramble = 'Sticker Net Scramble';
    scrambleDisplay.innerText = 'Sticker Net Scramble Loaded';
    
    closeStickersModal();
    showToast('Sticker Net scramble loaded successfully!', 'info');
  } catch (err) {
    showToast(err.message, 'warning');
  }
});


// --- SPATIAL TRACING MODE ---
let isTracingMode = false;
let tracingTargetPiece = 'DL';
const tracingTargetList = ['DL', 'UR', 'UFL', 'UL', 'FL', 'UBR'];

const tracingHud = document.getElementById('tracing-hud');
const btnTracingExit = document.getElementById('btn-tracing-exit');
const tracingTargetSpan = document.getElementById('tracing-target-piece');

document.getElementById('btn-toggle-tracing').addEventListener('click', () => {
  if (isTracingMode) {
    exitTracingMode();
  } else {
    startTracingMode();
  }
});

btnTracingExit.addEventListener('click', () => {
  exitTracingMode();
});

function startTracingMode() {
  app.exitLesson();
  exitIntuitionMode();
  app.resetPlayback();

  isTracingMode = true;
  const btnToggleTracing = document.getElementById('btn-toggle-tracing');
  btnToggleTracing.innerText = '👁️ Tracing Mode: ON';
  btnToggleTracing.style.borderColor = 'var(--neon-green)';
  btnToggleTracing.style.boxShadow = '0 0 10px rgba(57, 255, 20, 0.4)';
  
  // Select random target piece
  tracingTargetPiece = tracingTargetList[Math.floor(Math.random() * tracingTargetList.length)];
  tracingTargetSpan.innerText = getPieceDisplayName(tracingTargetPiece);
  
  // Blur 3D view
  container.style.filter = 'blur(15px)';
  tracingHud.style.display = 'flex';
}

function exitTracingMode() {
  isTracingMode = false;
  const btnToggleTracing = document.getElementById('btn-toggle-tracing');
  btnToggleTracing.innerText = '👁️ Tracing Mode: OFF';
  btnToggleTracing.style.borderColor = '';
  btnToggleTracing.style.boxShadow = '';
  container.style.filter = '';
  tracingHud.style.display = 'none';
}

function getPieceDisplayName(pieceCode) {
  const map = {
    'DL': 'DL edge (orange/white)',
    'UR': 'UR edge (red/yellow)',
    'UL': 'UL edge (orange/yellow)',
    'FL': 'FL edge (orange/green)',
    'UFL': 'UFL corner (yellow/green/orange)',
    'UBR': 'UBR corner (yellow/blue/red)'
  };
  return map[pieceCode] || pieceCode;
}

function getTargetActualCoord(targetName) {
  let targetPiece = null;
  if (targetName === 'DL') {
    targetPiece = app.cube.cubies.find(c => Object.values(c.colors).filter(Boolean).length === 2 && Object.values(c.colors).includes('white') && Object.values(c.colors).includes('orange'));
  } else if (targetName === 'UR') {
    targetPiece = app.cube.cubies.find(c => Object.values(c.colors).filter(Boolean).length === 2 && Object.values(c.colors).includes('yellow') && Object.values(c.colors).includes('red'));
  } else if (targetName === 'UL') {
    targetPiece = app.cube.cubies.find(c => Object.values(c.colors).filter(Boolean).length === 2 && Object.values(c.colors).includes('yellow') && Object.values(c.colors).includes('orange'));
  } else if (targetName === 'FL') {
    targetPiece = app.cube.cubies.find(c => Object.values(c.colors).filter(Boolean).length === 2 && Object.values(c.colors).includes('green') && Object.values(c.colors).includes('orange'));
  } else if (targetName === 'UFL') {
    targetPiece = app.cube.cubies.find(c => Object.values(c.colors).filter(Boolean).length === 3 && Object.values(c.colors).includes('yellow') && Object.values(c.colors).includes('green') && Object.values(c.colors).includes('orange'));
  } else if (targetName === 'UBR') {
    targetPiece = app.cube.cubies.find(c => Object.values(c.colors).filter(Boolean).length === 3 && Object.values(c.colors).includes('yellow') && Object.values(c.colors).includes('blue') && Object.values(c.colors).includes('red'));
  }
  
  if (!targetPiece) return '';
  return getCubieCoord(targetPiece.x, targetPiece.y, targetPiece.z);
}

function getCubieCoord(x, y, z) {
  if (Math.abs(x) + Math.abs(y) + Math.abs(z) === 3) {
    let fStr = y === 1 ? 'U' : 'D';
    fStr += z === 1 ? 'F' : 'B';
    fStr += x === -1 ? 'L' : 'R';
    return fStr;
  } else if (Math.abs(x) + Math.abs(y) + Math.abs(z) === 2) {
    if (y !== 0) {
      let res = y === 1 ? 'U' : 'D';
      if (z !== 0) res += z === 1 ? 'F' : 'B';
      if (x !== 0) res += x === -1 ? 'L' : 'R';
      return res;
    } else {
      let res = z === 1 ? 'F' : 'B';
      res += x === -1 ? 'L' : 'R';
      return res;
    }
  }
  return '';
}

// Bind coordinates guess buttons
tracingHud.querySelectorAll('.btn-coord').forEach(btn => {
  btn.addEventListener('click', () => {
    const guessedCoord = btn.dataset.coord;
    const actualCoord = getTargetActualCoord(tracingTargetPiece);
    
    if (guessedCoord === actualCoord) {
      showToast(`🎉 Correct! You successfully traced the ${tracingTargetPiece} to ${actualCoord}!`, 'info');
      container.style.filter = '';
      setTimeout(() => {
        exitTracingMode();
      }, 2500);
    } else {
      showToast(`❌ Incorrect. The ${tracingTargetPiece} is at ${actualCoord}, not ${guessedCoord}.`, 'warning');
    }
  });
});

