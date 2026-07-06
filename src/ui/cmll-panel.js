import cmllAlgorithms from '../data/cmll-algorithms.json';
import { CubeState } from '../engine/cube-state.js';
import { executeSequence } from '../engine/move-executor.js';
import { invertSequence } from '../engine/move-parser.js';
import { isCMLLSolved } from '../recognition/stage-recognizer.js';
import { storage } from '../persistence/storage.js';

const COLOR_MAP = {
  yellow: '#ffd200',
  white: '#ffffff',
  green: '#00e676',
  blue: '#2979ff',
  orange: '#ff9100',
  red: '#ff1744'
};

// Generates the U-corner sticker colors for a CMLL algorithm by simulating it on a clean cube.
export function generateCMLLStickerColors(alg) {
  const cube = new CubeState();
  const inv = invertSequence(alg);
  executeSequence(cube, inv, { recordHistory: false });

  const ubl = cube.getCubieAt(-1, 1, -1);
  const ubr = cube.getCubieAt(1, 1, -1);
  const ufl = cube.getCubieAt(-1, 1, 1);
  const ufr = cube.getCubieAt(1, 1, 1);

  return {
    ubl: { u: ubl.colors.u, b: ubl.colors.b, l: ubl.colors.l },
    ubr: { u: ubr.colors.u, b: ubr.colors.b, r: ubr.colors.r },
    ufl: { u: ufl.colors.u, f: ufl.colors.f, l: ufl.colors.l },
    ufr: { u: ufr.colors.u, f: ufr.colors.f, r: ufr.colors.r }
  };
}

// Renders the 2D top-down SVG based on sticker colors
export function renderCMLLSVG(colors) {
  const getFill = (c) => COLOR_MAP[c] || '#1f2330';

  return `
    <svg viewBox="0 0 80 80" width="80" height="80" style="display: block; margin: 0 auto;">
      <rect x="0" y="0" width="80" height="80" fill="transparent" />

      <!-- Center grid elements -->
      <!-- UBL --> <rect x="20" y="20" width="12" height="12" rx="2" fill="${getFill(colors.ubl.u)}" stroke="#05070f" stroke-width="1.5" />
      <!-- UB -->  <rect x="34" y="20" width="12" height="12" rx="2" fill="#1f2330" stroke="#05070f" stroke-width="1.5" />
      <!-- UBR --> <rect x="48" y="20" width="12" height="12" rx="2" fill="${getFill(colors.ubr.u)}" stroke="#05070f" stroke-width="1.5" />
      
      <!-- UL -->  <rect x="20" y="34" width="12" height="12" rx="2" fill="#1f2330" stroke="#05070f" stroke-width="1.5" />
      <!-- Uctr --> <rect x="34" y="34" width="12" height="12" rx="2" fill="#1f2330" stroke="#05070f" stroke-width="1.5" />
      <!-- UR -->  <rect x="48" y="34" width="12" height="12" rx="2" fill="#1f2330" stroke="#05070f" stroke-width="1.5" />
      
      <!-- UFL --> <rect x="20" y="48" width="12" height="12" rx="2" fill="${getFill(colors.ufl.u)}" stroke="#05070f" stroke-width="1.5" />
      <!-- UF -->  <rect x="34" y="48" width="12" height="12" rx="2" fill="#1f2330" stroke="#05070f" stroke-width="1.5" />
      <!-- UFR --> <rect x="48" y="48" width="12" height="12" rx="2" fill="${getFill(colors.ufr.u)}" stroke="#05070f" stroke-width="1.5" />

      <!-- Side sticker indicators -->
      <!-- UBL Left -->   <rect x="13" y="20" width="5" height="12" rx="1.5" fill="${getFill(colors.ubl.l)}" stroke="#05070f" stroke-width="1" />
      <!-- UBL Back -->   <rect x="20" y="13" width="12" height="5" rx="1.5" fill="${getFill(colors.ubl.b)}" stroke="#05070f" stroke-width="1" />
      
      <!-- UBR Right -->  <rect x="62" y="20" width="5" height="12" rx="1.5" fill="${getFill(colors.ubr.r)}" stroke="#05070f" stroke-width="1" />
      <!-- UBR Back -->   <rect x="48" y="13" width="12" height="5" rx="1.5" fill="${getFill(colors.ubr.b)}" stroke="#05070f" stroke-width="1" />
      
      <!-- UFL Left -->   <rect x="13" y="48" width="5" height="12" rx="1.5" fill="${getFill(colors.ufl.l)}" stroke="#05070f" stroke-width="1" />
      <!-- UFL Front -->  <rect x="20" y="62" width="12" height="5" rx="1.5" fill="${getFill(colors.ufl.f)}" stroke="#05070f" stroke-width="1" />
      
      <!-- UFR Right -->  <rect x="62" y="48" width="5" height="12" rx="1.5" fill="${getFill(colors.ufr.r)}" stroke="#05070f" stroke-width="1" />
      <!-- UFR Front -->  <rect x="48" y="62" width="12" height="5" rx="1.5" fill="${getFill(colors.ufr.f)}" stroke="#05070f" stroke-width="1" />
    </svg>
  `;
}

export class CMLLPanel {
  constructor(appContext) {
    this.app = appContext;
    this.container = document.getElementById('curriculum-content');
    
    this.activeDrillCase = null;
    this.drillStartTime = null;
    this.drillTimerInterval = null;
    this.currentQuizCase = null;
    this.quizStartTime = null;
    
    // Stretch features: 2-Look CMLL & Custom Algs
    this.isTwoLookMode = false;
    this.selectedAlgs = {}; // caseId -> idx (or 'primary')

    this.diagramCache = {};
    this.precomputeDiagrams();
  }

  precomputeDiagrams() {
    for (const caseId of Object.keys(cmllAlgorithms)) {
      const colors = generateCMLLStickerColors(cmllAlgorithms[caseId].alg);
      this.diagramCache[caseId] = renderCMLLSVG(colors);
    }
  }

  // Renders the case browser dashboard view
  renderBrowser() {
    // Check mastery progress if 2-Look mode is active
    let masteryHTML = '';
    if (this.isTwoLookMode) {
      const stats = storage.getCMLLStats();
      const tier1Cases = Object.keys(cmllAlgorithms).filter(cId => cmllAlgorithms[cId].tier === 1);
      let masteredCount = 0;
      tier1Cases.forEach(cId => {
        const s = stats[cId];
        // 90% accuracy with at least 3 attempts counts as mastered
        if (s && s.attempts >= 3 && (s.correct / s.attempts) >= 0.90) {
          masteredCount++;
        }
      });
      masteryHTML = `
        <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--panel-border); border-radius: 8px; padding: 10px; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>2-Look CMLL Mastery Progress:</span>
            <span style="font-weight: bold; color: var(--neon-green);">${masteredCount} / ${tier1Cases.length} Mastered</span>
          </div>
          <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
            <div style="width: ${(masteredCount / tier1Cases.length) * 100}%; height: 100%; background: var(--neon-green); box-shadow: 0 0 6px var(--neon-green); transition: width 0.3s;"></div>
          </div>
          ${masteredCount === tier1Cases.length ? `
            <p style="color: var(--neon-cyan); font-weight: bold; margin-top: 6px; text-shadow: 0 0 5px rgba(0,240,255,0.3); font-size: 0.7rem; text-align: left;">🎉 Mastered 2-Look! We recommend switching to full CMLL.</p>
          ` : ''}
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="cmll-browser-wrapper" style="display: flex; flex-direction: column; gap: 15px;">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
            <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 1rem; color: var(--neon-cyan);">CMLL Case Browser</h3>
            <button class="btn-secondary" id="btn-start-quiz" style="padding: 6px 12px; font-size: 0.75rem; border-color: var(--neon-pink); color: var(--neon-pink);">Start Quiz Mode</button>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; cursor: pointer; color: var(--text-secondary);">
              <input type="checkbox" id="chk-two-look-mode" ${this.isTwoLookMode ? 'checked' : ''} style="cursor: pointer;" /> 2-Look CMLL Only (Tier 1)
            </label>
          </div>
        </div>

        ${masteryHTML}
        
        <div class="cmll-family-sections" style="display: flex; flex-direction: column; gap: 20px; max-height: 480px; overflow-y: auto; padding-right: 5px;">
          ${this.renderFamilyGroups()}
        </div>
      </div>
    `;

    this.bindBrowserEvents();
  }

  renderFamilyGroups() {
    const families = {};
    for (const [id, value] of Object.entries(cmllAlgorithms)) {
      // Filter by tier 1 if in 2-Look mode
      if (this.isTwoLookMode && value.tier !== 1) continue;

      if (!families[value.family]) {
        families[value.family] = [];
      }
      families[value.family].push({ id, ...value });
    }

    const sections = Object.entries(families).filter(([fam, cases]) => cases.length > 0);
    if (sections.length === 0) {
      return `<div style="color: var(--text-secondary); text-align: center; font-size: 0.8rem; padding: 20px;">No cases found in this mode.</div>`;
    }

    return sections.map(([family, cases]) => `
      <div class="cmll-family-group" style="display: flex; flex-direction: column; gap: 10px; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 12px; background: rgba(0,0,0,0.15);">
        <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-secondary); border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; font-weight: bold;">
          Family ${family} (${cases.length} cases)
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          ${cases.map(c => {
            const selectedIdx = this.selectedAlgs[c.id];
            const currentAlg = (selectedIdx !== undefined && selectedIdx !== 'primary') ? c.altAlgs[selectedIdx].alg : c.alg;

            return `
              <div class="cmll-case-card" data-case-id="${c.id}" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; align-items: center; text-align: center; position: relative;">
                <div class="cmll-svg-container" style="width: 60px; height: 60px;">
                  ${this.diagramCache[c.id]}
                </div>
                <span style="font-size: 0.8rem; font-weight: 600; color: white;">${c.name}</span>
                
                <code style="font-size: 0.65rem; color: var(--neon-cyan); word-break: break-all; background: rgba(0,0,0,0.2); padding: 2px 4px; border-radius: 4px; font-family: monospace;">${currentAlg}</code>
                
                <!-- Alt Algorithms Selector -->
                ${c.altAlgs && c.altAlgs.length > 0 ? `
                  <select class="select-alt-alg" data-case-id="${c.id}" style="width: 100%; font-size: 0.65rem; padding: 3px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); background: rgba(8,10,18,0.8); color: var(--neon-cyan); margin-top: 2px; cursor: pointer; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                    <option value="primary" ${selectedIdx === 'primary' || selectedIdx === undefined ? 'selected' : ''}>Default Alg</option>
                    ${c.altAlgs.map((alt, aIdx) => `
                      <option value="${aIdx}" ${selectedIdx == aIdx ? 'selected' : ''}>Alt: ${alt.note || `Option ${aIdx+1}`}</option>
                    `).join('')}
                  </select>
                ` : ''}

                <!-- Finger-trick tip display -->
                ${c.fingerTricks ? `
                  <span style="font-size: 0.65rem; color: var(--text-secondary); font-style: italic; line-height: 1.2; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="Finger Tricks: ${c.fingerTricks}">
                    💡 ${c.fingerTricks}
                  </span>
                ` : ''}

                <div style="display: flex; gap: 6px; width: 100%; margin-top: 4px;">
                  <button class="btn-preview-case" data-case-id="${c.id}" style="flex: 1; padding: 4px; font-size: 0.65rem; border-radius: 4px; border: 1px solid rgba(0, 240, 255, 0.3); background: transparent; color: var(--neon-cyan); cursor: pointer;">Preview</button>
                  <button class="btn-drill-case" data-case-id="${c.id}" style="flex: 1; padding: 4px; font-size: 0.65rem; border-radius: 4px; border: 1px solid rgba(57, 255, 20, 0.3); background: transparent; color: var(--neon-green); cursor: pointer;">Drill</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  }

  bindBrowserEvents() {
    document.getElementById('btn-start-quiz').addEventListener('click', () => {
      this.renderQuiz();
    });

    const twoLookChk = document.getElementById('chk-two-look-mode');
    if (twoLookChk) {
      twoLookChk.addEventListener('change', (e) => {
        this.isTwoLookMode = e.target.checked;
        this.renderBrowser();
      });
    }

    this.container.querySelectorAll('.select-alt-alg').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const caseId = sel.dataset.caseId;
        this.selectedAlgs[caseId] = e.target.value;
        this.renderBrowser();
      });
    });

    this.container.querySelectorAll('.btn-preview-case').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const caseId = btn.dataset.caseId;
        this.previewCMLLCase(caseId);
      });
    });

    this.container.querySelectorAll('.btn-drill-case').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const caseId = btn.dataset.caseId;
        this.startCMLLDrill(caseId);
      });
    });
  }

  // Previews CMLL algorithm on the 3D viewport (corner isolation scoped)
  async previewCMLLCase(caseId) {
    if (this.app.renderer.isAnimating) return;
    this.app.exitLesson();

    const value = cmllAlgorithms[caseId];
    const selectedIdx = this.selectedAlgs[caseId];
    const alg = (selectedIdx !== undefined && selectedIdx !== 'primary') ? value.altAlgs[selectedIdx].alg : value.alg;

    this.app.scrambleDisplay.innerText = `Previewing: ${value.name}`;

    // Reset, isolate corners
    this.app.cube.reset();
    const invMoves = invertSequence(alg);
    executeSequence(this.app.cube, invMoves, { recordHistory: false });
    this.app.renderer.setCubeState(this.app.cube);
    this.app.activeStage = 'cmll';
    this.app.isolationActive = true;
    this.app.applyStageHighlight();

    // Small delay, then play algorithm to solve it
    setTimeout(async () => {
      const moves = alg.split(' ').filter(Boolean);
      for (const move of moves) {
        if (this.app.activeStage !== 'cmll') break;
        executeSequence(this.app.cube, move);
        await this.app.renderer.animateMove(move, 220);
      }
      this.app.scrambleDisplay.innerText = `Case solved! Alg: ${alg}`;
    }, 1200);
  }

  // Starts Drill Mode stopwatch
  startCMLLDrill(caseId) {
    this.app.exitLesson();
    this.activeDrillCase = caseId;
    
    // Set up state
    const value = cmllAlgorithms[caseId];
    const selectedIdx = this.selectedAlgs[caseId];
    const alg = (selectedIdx !== undefined && selectedIdx !== 'primary') ? value.altAlgs[selectedIdx].alg : value.alg;

    this.app.cube.reset();
    const invMoves = invertSequence(alg);
    executeSequence(this.app.cube, invMoves, { recordHistory: false });
    
    this.app.renderer.setCubeState(this.app.cube);
    this.app.activeStage = 'cmll';
    this.app.isolationActive = true;
    this.app.applyStageHighlight();

    this.drillStartTime = performance.now();
    this.app.scrambleDisplay.innerText = `Drilling: ${value.name}. Solve corners!`;

    // Start UI hud display overlay
    const overlay = document.getElementById('solve-overlay');
    const title = document.getElementById('overlay-step-name');
    const desc = document.getElementById('overlay-step-moves');
    const badge = document.getElementById('overlay-solve-badge');
    
    overlay.classList.add('visible');
    title.innerText = `Drilling: ${value.name}`;
    desc.innerText = `Timer Running. Solve top corners.`;
    badge.innerText = `0.00s`;

    if (this.drillTimerInterval) clearInterval(this.drillTimerInterval);
    this.drillTimerInterval = setInterval(() => {
      const duration = (performance.now() - this.drillStartTime) / 1000;
      badge.innerText = `${duration.toFixed(2)}s`;
    }, 30);
  }

  handleDrillTurn() {
    if (!this.activeDrillCase) return;

    if (isCMLLSolved(this.app.cube)) {
      clearInterval(this.drillTimerInterval);
      this.drillTimerInterval = null;

      const durationMs = Math.round(performance.now() - this.drillStartTime);
      const seconds = (durationMs / 1000).toFixed(2);
      
      const value = cmllAlgorithms[this.activeDrillCase];
      
      // Save stats
      storage.recordCMLLAttempt(this.activeDrillCase, true, durationMs);

      // UI update
      this.app.scrambleDisplay.innerText = `🎉 Case ${value.name} Solved in ${seconds}s!`;
      
      const title = document.getElementById('overlay-step-name');
      const desc = document.getElementById('overlay-step-moves');
      const badge = document.getElementById('overlay-solve-badge');
      title.innerText = `Completed!`;
      desc.innerText = `Solved in ${seconds}s`;
      badge.innerText = `SUCCESS`;

      setTimeout(() => {
        document.getElementById('solve-overlay').classList.remove('visible');
      }, 3500);

      this.activeDrillCase = null;
    }
  }

  // --- CMLL FLASHCARD QUIZ MODE ---
  selectNextQuizCase() {
    const stats = storage.getCMLLStats();
    let cases = Object.keys(cmllAlgorithms);
    
    // Filter by tier 1 if in 2-Look mode
    if (this.isTwoLookMode) {
      cases = cases.filter(cId => cmllAlgorithms[cId].tier === 1);
    }
    if (cases.length === 0) return Object.keys(cmllAlgorithms)[0];

    // Spaced repetition weighting
    const weights = cases.map(cId => {
      const cStat = stats[cId];
      if (!cStat) return 15; // Unseen gets highest weight
      
      const accuracy = cStat.attempts > 0 ? cStat.correct / cStat.attempts : 0;
      const lastSeenDays = (Date.now() - cStat.lastSeen) / (1000 * 60 * 60 * 24);
      
      return 15 * (1 - accuracy) + lastSeenDays + 0.1;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < cases.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        return cases[i];
      }
    }
    return cases[0];
  }

  renderQuiz() {
    this.currentQuizCase = this.selectNextQuizCase();
    const currentCase = cmllAlgorithms[this.currentQuizCase];
    
    // Choose distractors
    const distractors = this.getDistractors(this.currentQuizCase);
    const options = [this.currentQuizCase, ...distractors].sort(() => Math.random() - 0.5);

    this.container.innerHTML = `
      <div class="cmll-quiz-wrapper" style="display: flex; flex-direction: column; gap: 15px; text-align: center;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 1rem; color: var(--neon-pink);">CMLL Recognition Quiz</h3>
          <button class="btn-secondary" id="btn-exit-quiz" style="padding: 6px 12px; font-size: 0.75rem;">Exit Quiz</button>
        </div>

        <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--panel-border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px; align-items: center;">
          <span style="font-size: 0.8rem; color: var(--text-secondary);">Identify this corner layout:</span>
          <div class="quiz-svg-container" style="width: 140px; height: 140px; border-radius: 10px; background: rgba(5,7,15,0.6); display: flex; align-items: center; justify-content: center;">
            ${this.diagramCache[this.currentQuizCase]}
          </div>
          <div id="quiz-feedback" style="min-height: 24px; font-size: 0.85rem; font-weight: bold; color: var(--text-secondary); margin-top: 5px;"></div>
        </div>

        <div class="quiz-options-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
          ${options.map(cId => `
            <button class="btn-quiz-option" data-case-id="${cId}" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px; font-size: 0.85rem; color: white; cursor: pointer; transition: all 0.2s;">
              ${cmllAlgorithms[cId].name}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    this.quizStartTime = performance.now();
    this.bindQuizEvents();
  }

  getDistractors(correctId) {
    const family = cmllAlgorithms[correctId].family;
    
    // Distractors pool filtered by tier 1 if in 2-Look mode
    let pool = Object.keys(cmllAlgorithms);
    if (this.isTwoLookMode) {
      pool = pool.filter(cId => cmllAlgorithms[cId].tier === 1);
    }

    const sameFamily = pool.filter(cId => cId !== correctId && cmllAlgorithms[cId].family === family);
    const otherFamily = pool.filter(cId => cmllAlgorithms[cId].family !== family);

    const dist = [];
    
    // Try to get from same family first
    const shuffledSame = sameFamily.sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(2, shuffledSame.length); i++) {
      dist.push(shuffledSame[i]);
    }

    // Fill the rest from other families
    const shuffledOther = otherFamily.sort(() => Math.random() - 0.5);
    while (dist.length < 3 && shuffledOther.length > 0) {
      const next = shuffledOther.pop();
      if (!dist.includes(next)) dist.push(next);
    }

    // fallback if not enough distractors (in two-look mode if pools are tiny)
    if (dist.length < 3) {
      const fallbackPool = Object.keys(cmllAlgorithms).filter(cId => cId !== correctId && !dist.includes(cId));
      while (dist.length < 3 && fallbackPool.length > 0) {
        dist.push(fallbackPool.sort(() => Math.random() - 0.5).pop());
      }
    }

    return dist;
  }

  bindQuizEvents() {
    document.getElementById('btn-exit-quiz').addEventListener('click', () => {
      this.renderBrowser();
    });

    this.container.querySelectorAll('.btn-quiz-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleQuizAnswer(btn.dataset.caseId, btn);
      });
    });
  }

  handleQuizAnswer(selectedId, btnEl) {
    const isCorrect = selectedId === this.currentQuizCase;
    const timeMs = Math.round(performance.now() - this.quizStartTime);
    
    // Save quiz result
    storage.recordCMLLAttempt(this.currentQuizCase, isCorrect, isCorrect ? timeMs : null);

    // Disable all options
    this.container.querySelectorAll('.btn-quiz-option').forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.caseId === this.currentQuizCase) {
        btn.style.borderColor = 'var(--neon-green)';
        btn.style.color = 'var(--neon-green)';
        btn.style.background = 'rgba(57, 255, 20, 0.08)';
      }
    });

    const feedbackEl = document.getElementById('quiz-feedback');
    if (isCorrect) {
      btnEl.style.boxShadow = '0 0 10px var(--neon-green)';
      feedbackEl.innerText = `CORRECT! recognized in ${(timeMs / 1000).toFixed(2)}s`;
      feedbackEl.style.color = 'var(--neon-green)';
    } else {
      btnEl.style.borderColor = 'var(--neon-pink)';
      btnEl.style.color = 'var(--neon-pink)';
      btnEl.style.background = 'rgba(255, 0, 127, 0.08)';
      feedbackEl.innerText = `WRONG! That was: ${cmllAlgorithms[this.currentQuizCase].name}`;
      feedbackEl.style.color = 'var(--neon-pink)';
    }

    // Auto load next card in 2 seconds
    setTimeout(() => {
      if (this.currentQuizCase) { // ensure still in quiz mode
        this.renderQuiz();
      }
    }, 2000);
  }
}
