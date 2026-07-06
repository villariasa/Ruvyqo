import { isFirstBlockSolved, isSecondBlockSolved, isCMLLSolved } from '../recognition/stage-recognizer.js';

export const GLOSSARY_TERMS = [
  {
    term: "First Block (FB)",
    definition: "The first step of Roux. Build a 1x2x3 block on the left side of the cube (standard orange center). Preserves top and right sides for later steps.",
    pieces: [9, 3, 0, 21, 18, 12] // DL, BL, DBL, FL, DFL, L-center
  },
  {
    term: "Second Block (SB)",
    definition: "The second step of Roux. Build a 1x2x3 block on the right side of the cube (standard red center) using R, U, r, M moves to keep the First Block safe.",
    pieces: [11, 5, 2, 23, 20, 14] // DR, BR, DBR, FR, DFR, R-center
  },
  {
    term: "CMLL",
    definition: "Corners of the Last Layer. Orient and permute the 4 U-layer corners simultaneously without disturbing the Left and Right bottom blocks.",
    pieces: [24, 6, 8, 26] // UFL, UFR, UBL, UBR corners
  },
  {
    term: "Last Six Edges (LSE)",
    definition: "The final step of Roux. Solves the remaining six edges (UR, UL, UB, UF, DB, DF) and centers using exclusively U and M turns.",
    pieces: [15, 17, 25, 7, 19, 1] // UL, UR, UF, UB, DF, DB edges
  },
  {
    term: "Edge Orientation (EO)",
    definition: "Aligning edges so they can be solved using only M and U moves. An edge is oriented if its top/bottom colors are on the U/D faces.",
    pieces: [15, 17, 25, 7, 19, 1]
  },
  {
    term: "M-slice",
    definition: "The Middle slice of the cube between the L and R layers. Roux solves centers and middle edges using M turns.",
    pieces: [25, 7, 19, 1, 10, 22] // middle edges and center nodes
  },
  {
    term: "Headlights",
    definition: "A corner pattern where two stickers of the same color point in the same direction on the side faces of adjacent corners.",
    pieces: [24, 26, 6, 8]
  },
  {
    term: "Block building",
    definition: "An intuitive method of placing a corner and edge together before inserting them into a slot, rather than solving pieces individually.",
    pieces: [9, 3, 0] // DL, BL, DBL square
  }
];

export class CurriculumPanel {
  constructor(appContext) {
    this.app = appContext;
    this.container = document.getElementById('curriculum-content');
    
    // Stages mapping
    this.stages = {
      fb: {
        step: 'Step 1',
        title: 'First Block (FB)',
        desc: 'Build a 1x2x3 block on the left side of the cube (standard orange center).',
        pieces: [9, 3, 0, 21, 18, 12],
        infoTitle: 'First Block (FB) Solver Target',
        infoText: 'Solve DL edge, then BL edge + DBL corner (Back-Left pair), and FL edge + DFL corner (Front-Left pair). All on Left face.'
      },
      sb: {
        step: 'Step 2',
        title: 'Second Block (SB)',
        desc: 'Build a 1x2x3 block on the right side of the cube (standard red center).',
        pieces: [11, 5, 2, 23, 20, 14],
        infoTitle: 'Second Block (SB) Solver Target',
        infoText: 'Solve DR edge, then BR edge + DBR corner (Back-Right pair), and FR edge + DFR corner (Front-Right pair). Built on Right face.'
      },
      cmll: {
        step: 'Step 3',
        title: 'CMLL',
        desc: 'Orient and permute the four top corners without disturbing the bottom two blocks.',
        pieces: [24, 6, 8, 26],
        infoTitle: 'CMLL Corner Alignment Target',
        infoText: 'Solve the orientations and permutations of the 4 top corners. Leaves the bottom blocks intact.'
      },
      lse: {
        step: 'Step 4',
        title: 'Last Six Edges (LSE)',
        desc: 'Solve the remaining six edges (UR, UL, UB, UF, DB, DF) using only M and U moves.',
        pieces: [15, 17, 16, 22, 10, 25, 13, 10, 22, 4, 12, 14],
        infoTitle: 'Last Six Edges (LSE) Solver Target',
        infoText: 'Solve edge orientation (EO), UL/UR edge placements, and permute the remaining middle slice edges to complete the solve.'
      }
    };
  }

  // Renders the default 4 steps stages list
  renderStages() {
    this.container.innerHTML = `
      <div class="curriculum-list">
        ${Object.entries(this.stages).map(([key, s]) => `
          <div class="curriculum-card ${this.app.activeStage === key ? 'active' : ''}" data-stage="${key}">
            <div class="card-header">
              <span class="card-step">${s.step}</span>
            </div>
            <h3 class="card-title">${s.title}</h3>
            <p class="card-desc">${s.desc}</p>
            <button class="isolate-btn ${this.app.activeStage === key && this.app.isolationActive ? 'active' : ''}" data-stage="${key}">
              Isolate Pieces
            </button>
          </div>
        `).join('')}
      </div>

      <div class="curriculum-info" id="stage-info-box">
        <div class="info-title">${this.stages[this.app.activeStage].infoTitle}</div>
        <div>${this.stages[this.app.activeStage].infoText}</div>
      </div>
    `;

    this.bindStagesEvents();
  }

  bindStagesEvents() {
    this.container.querySelectorAll('.curriculum-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('isolate-btn')) return;

        this.container.querySelectorAll('.curriculum-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        this.app.activeStage = card.dataset.stage;
        this.app.updateHUD();
        this.app.applyStageHighlight();
      });
    });

    this.container.querySelectorAll('.isolate-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();

        const stage = btn.dataset.stage;
        const isCurrentlyActive = btn.classList.contains('active');

        this.container.querySelectorAll('.isolate-btn').forEach(b => b.classList.remove('active'));

        if (!isCurrentlyActive) {
          btn.classList.add('active');
          this.app.activeStage = stage;
          this.app.isolationActive = true;
          
          this.container.querySelectorAll('.curriculum-card').forEach(c => c.classList.remove('active'));
          this.container.querySelector(`.curriculum-card[data-stage="${stage}"]`).classList.add('active');
        } else {
          this.app.isolationActive = false;
        }

        this.app.applyStageHighlight();
      });
    });
  }

  // Renders searchable Interactive Glossary view
  renderGlossary(searchQuery = '') {
    const filteredTerms = GLOSSARY_TERMS.filter(item => 
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchQuery.toLowerCase())
    );

    this.container.innerHTML = `
      <div class="glossary-wrapper" style="display: flex; flex-direction: column; gap: 15px;">
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 1rem; color: var(--neon-cyan);">Interactive Glossary</h3>
          <input type="text" id="glossary-search" placeholder="Search terms (e.g. CMLL, M-slice)..." value="${searchQuery}" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--panel-border); background: rgba(0,0,0,0.3); color: white; font-size: 0.85rem;" />
        </div>
        
        <div class="glossary-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 480px; overflow-y: auto; padding-right: 5px;">
          ${filteredTerms.length > 0 ? filteredTerms.map(item => `
            <div class="glossary-card" data-term-name="${item.term}" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 10px; cursor: pointer; transition: all 0.2s;">
              <span style="font-size: 0.85rem; font-weight: bold; color: var(--neon-pink); display: block; margin-bottom: 4px;">
                ${item.term}
              </span>
              <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.35;">
                ${item.definition}
              </p>
              <span style="font-size: 0.65rem; color: var(--neon-cyan); margin-top: 6px; display: block; text-transform: uppercase; font-weight: bold;">
                👉 Click to highlight affected pieces
              </span>
            </div>
          `).join('') : `
            <div style="color: var(--text-secondary); text-align: center; font-size: 0.8rem; padding: 20px; font-style: italic;">
              No terms found matching search.
            </div>
          `}
        </div>
      </div>
    `;

    this.bindGlossaryEvents();
  }

  bindGlossaryEvents() {
    const searchInput = document.getElementById('glossary-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.renderGlossary(e.target.value);
        document.getElementById('glossary-search').focus(); // Keep focus after re-render
      });
    }

    this.container.querySelectorAll('.glossary-card').forEach(card => {
      card.addEventListener('click', () => {
        const termName = card.dataset.termName;
        const termItem = GLOSSARY_TERMS.find(t => t.term === termName);
        if (termItem) {
          // Highlight pieces in renderer
          this.app.renderer.updateStageHighlight(termItem.pieces, true);
          
          // Style active card
          this.container.querySelectorAll('.glossary-card').forEach(c => {
            c.style.borderColor = 'rgba(255,255,255,0.05)';
            c.style.background = 'rgba(255,255,255,0.02)';
          });
          card.style.borderColor = 'var(--neon-pink)';
          card.style.background = 'rgba(255, 0, 127, 0.03)';
          
          this.app.scrambleDisplay.innerText = `Glossary highlight: ${termItem.term}`;
        }
      });
    });
  }
}
