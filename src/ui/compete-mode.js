import { CubeState } from '../engine/cube-state.js';
import { executeMove, executeSequence } from '../engine/move-executor.js';
import { parseMove } from '../engine/move-parser.js';
import { generateScramble } from '../engine/scramble-generator.js';
import { solveCube } from '../solver/roux-solver.js';
import { Cube3DRenderer } from '../renderer/cube-renderer.js';

export class CompeteMode {
  constructor(appContext) {
    this.app = appContext;
    
    // Mount compete mode elements
    this.btnToggle = document.getElementById('btn-toggle-compete');
    this.viewportNormal = document.getElementById('viewport-normal');
    this.viewportCompete = document.getElementById('viewport-compete');
    this.timerUserEl = document.getElementById('timer-user');
    this.timerAiEl = document.getElementById('timer-ai');
    this.statusBanner = document.getElementById('compete-status-banner');
    this.countdownOverlay = document.getElementById('compete-countdown-overlay');
    this.countdownText = document.getElementById('countdown-text');
    this.inputAiTargetTime = document.getElementById('input-ai-target-time');
    this.btnStart = document.getElementById('btn-start-compete');

    this.timerInterval = null;
  }

  toggle() {
    this.app.resetPlayback();
    this.app.exitLesson();
    this.app.isCompeteMode = !this.app.isCompeteMode;

    if (this.app.isCompeteMode) {
      this.btnToggle.innerText = '👤 Normal Training Mode';
      this.btnToggle.classList.add('active');
      this.viewportNormal.style.display = 'none';
      this.viewportCompete.style.display = 'flex';

      // Initialize Compete viewports if not done
      if (!this.app.userCube) {
        this.app.userCube = new CubeState();
        this.app.userRenderer = new Cube3DRenderer(document.getElementById('three-container-user'));
        this.app.userRenderer.setCubeState(this.app.userCube);

        this.app.aiCube = new CubeState();
        this.app.aiRenderer = new Cube3DRenderer(document.getElementById('three-container-ai'));
        this.app.aiRenderer.setCubeState(this.app.aiCube);
      } else {
        this.app.userCube.reset();
        this.app.userRenderer.setCubeState(this.app.userCube);
        this.app.aiCube.reset();
        this.app.aiRenderer.setCubeState(this.app.aiCube);
      }
      
      this.timerUserEl.innerHTML = `Human: <span style="color: var(--neon-cyan); font-weight: bold; font-family: monospace;">0.00s</span>`;
      this.timerAiEl.innerHTML = `Roux AI: <span style="color: var(--neon-green); font-weight: bold; font-family: monospace;">0.00s</span>`;
      this.statusBanner.innerText = 'Ready!';
      this.app.competeActive = false;
      this.app.competeLockInput = false;
    } else {
      this.btnToggle.innerText = '🤖 Compete with AI Mode';
      this.btnToggle.classList.remove('active');
      this.viewportNormal.style.display = 'flex';
      this.viewportCompete.style.display = 'none';
      
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }

    // Force resize update
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  async startRace() {
    if (this.app.competeActive) return;

    this.btnStart.disabled = true;
    const btnScramble = document.getElementById('btn-scramble');
    const btnApplyScramble = document.getElementById('btn-apply-scramble');
    if (btnScramble) btnScramble.disabled = true;
    if (btnApplyScramble) btnApplyScramble.disabled = true;

    if (!this.app.currentScramble) {
      this.app.currentScramble = generateScramble(15);
      const display = document.getElementById('scramble-display');
      if (display) display.innerText = this.app.currentScramble;
    }

    this.app.userCube.reset();
    executeSequence(this.app.userCube, this.app.currentScramble);
    this.app.userRenderer.setCubeState(this.app.userCube);

    this.app.aiCube.reset();
    executeSequence(this.app.aiCube, this.app.currentScramble);
    this.app.aiRenderer.setCubeState(this.app.aiCube);

    this.app.userFinished = false;
    this.app.aiFinished = false;
    this.app.competeActive = true;
    this.app.competeLockInput = true;

    this.timerUserEl.innerHTML = `Human: <span style="color: var(--neon-cyan); font-weight: bold; font-family: monospace;">0.00s</span>`;
    this.timerAiEl.innerHTML = `Roux AI: <span style="color: var(--neon-green); font-weight: bold; font-family: monospace;">0.00s</span>`;
    this.statusBanner.innerText = 'Ready...';

    // Countdown
    this.countdownOverlay.style.display = 'flex';
    const labels = ['3', '2', '1', 'GO!'];
    for (const text of labels) {
      this.countdownText.innerText = text;
      if (text === 'GO!') {
        this.countdownText.style.color = 'var(--neon-green)';
        this.countdownText.style.textShadow = '0 0 30px var(--neon-green)';
      } else {
        this.countdownText.style.color = 'var(--neon-cyan)';
        this.countdownText.style.textShadow = '0 0 30px var(--neon-cyan)';
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    this.countdownOverlay.style.display = 'none';

    this.app.competeLockInput = false;
    this.statusBanner.innerText = 'SOLVE!';

    const startTime = performance.now();
    let userTime = 0;
    let aiTime = 0;

    let aiMoves = [];
    try {
      const aiSolveResult = solveCube(this.app.aiCube.clone());
      aiSolveResult.steps.forEach(step => {
        const moves = step.moves ? step.moves.split(' ').filter(Boolean) : [];
        aiMoves = [...aiMoves, ...moves];
      });
    } catch (err) {
      console.error('AI Solver failed:', err);
    }

    // Clocks loop
    this.timerInterval = setInterval(() => {
      const now = performance.now();
      
      if (!this.app.userFinished) {
        userTime = (now - startTime) / 1000;
        this.timerUserEl.innerHTML = `Human: <span style="color: var(--neon-cyan); font-weight: bold; font-family: monospace;">${userTime.toFixed(2)}s</span>`;
      }
      if (!this.app.aiFinished) {
        aiTime = (now - startTime) / 1000;
        this.timerAiEl.innerHTML = `Roux AI: <span style="color: var(--neon-green); font-weight: bold; font-family: monospace;">${aiTime.toFixed(2)}s</span>`;
      }

      if (this.app.userFinished && this.app.aiFinished) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.app.competeActive = false;
        this.btnStart.disabled = false;
        if (btnScramble) btnScramble.disabled = false;
        if (btnApplyScramble) btnApplyScramble.disabled = false;

        const humanFinal = parseFloat(this.timerUserEl.querySelector('span').innerText);
        const aiFinal = parseFloat(this.timerAiEl.querySelector('span').innerText);
        
        if (humanFinal < aiFinal) {
          this.statusBanner.innerText = '🏆 HUMAN WINS!';
          this.statusBanner.style.color = 'var(--neon-cyan)';
          this.statusBanner.style.textShadow = '0 0 10px rgba(0, 240, 255, 0.5)';
        } else {
          this.statusBanner.innerText = '🤖 AI WINS!';
          this.statusBanner.style.color = 'var(--neon-pink)';
          this.statusBanner.style.textShadow = '0 0 10px rgba(255, 0, 127, 0.5)';
        }
      }
    }, 10);

    // AI Solve playback execution
    (async () => {
      const targetSec = parseFloat(this.inputAiTargetTime.value) || 10;
      const totalMoves = aiMoves.length;
      const intervalMs = totalMoves > 0 ? (targetSec / totalMoves) * 1000 : 100;
      const animMs = Math.max(50, intervalMs * 0.8);

      for (let i = 0; i < totalMoves; i++) {
        if (!this.app.competeActive) break;
        const move = aiMoves[i];
        executeMove(this.app.aiCube, parseMove(move));
        await this.app.aiRenderer.animateMove(move, animMs);
        
        const delay = Math.max(10, intervalMs - animMs);
        await new Promise(r => setTimeout(r, delay));
      }
      
      this.app.aiFinished = true;
      if (totalMoves === 0) {
        this.timerAiEl.innerHTML = `Roux AI: <span style="color: var(--neon-green); font-weight: bold; font-family: monospace;">0.00s</span>`;
      }
    })();
  }
}
