import { storage } from '../persistence/storage.js';

export class OnboardingModal {
  constructor(appContext) {
    this.app = appContext;
    this.modalEl = null;
    this.currentSlide = 0;
    this.slides = [
      {
        title: "Welcome to Roux Cyber Trainer!",
        content: `
          <p style="margin-bottom: 12px; line-height: 1.4;">Roux is a modern Rubik's Cube solving method optimized for speed, logic, and efficiency. Unlike standard CFOP which is rigid and algorithm-heavy, Roux is intuitive and M-slice heavy.</p>
          <div style="display: flex; justify-content: space-around; gap: 10px; margin-top: 15px;">
            <div style="background: rgba(0,240,255,0.05); border: 1px solid var(--neon-cyan); border-radius: 8px; padding: 10px; flex: 1; text-align: center;">
              <span style="font-weight: bold; color: var(--neon-cyan); display: block;">CFOP</span>
              <span style="font-size: 0.75rem; color: var(--text-secondary);">Cross + 4 F2L Slots + OLL + PLL<br>~55-60 Moves, rigid layers</span>
            </div>
            <div style="background: rgba(255,0,127,0.05); border: 1px solid var(--neon-pink); border-radius: 8px; padding: 10px; flex: 1; text-align: center;">
              <span style="font-weight: bold; color: var(--neon-pink); display: block;">ROUX</span>
              <span style="font-size: 0.75rem; color: var(--text-secondary);">2 Blocks + Corners + Last 6 Edges<br>~45-48 Moves, highly intuitive</span>
            </div>
          </div>
        `
      },
      {
        title: "The Four Stages of Roux",
        content: `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left; font-size: 0.8rem; line-height: 1.35;">
            <div style="background: rgba(255,255,255,0.02); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
              <strong style="color: var(--neon-cyan);">1. First Block (FB)</strong>
              <p style="color: var(--text-secondary); margin-top: 2px;">Build a 1x2x3 block on the left side of the cube around the orange center.</p>
            </div>
            <div style="background: rgba(255,255,255,0.02); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
              <strong style="color: var(--neon-cyan);">2. Second Block (SB)</strong>
              <p style="color: var(--text-secondary); margin-top: 2px;">Build a matching 1x2x3 block on the right side around the red center.</p>
            </div>
            <div style="background: rgba(255,255,255,0.02); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
              <strong style="color: var(--neon-pink);">3. CMLL</strong>
              <p style="color: var(--text-secondary); margin-top: 2px;">Solve orientation and permutation of the 4 top corners without disturbing bottom blocks.</p>
            </div>
            <div style="background: rgba(255,255,255,0.02); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
              <strong style="color: var(--neon-green);">4. Last Six Edges (LSE)</strong>
              <p style="color: var(--text-secondary); margin-top: 2px;">Orient and solve the final 6 edges (UL, UR, and M-slice) using only M and U moves.</p>
            </div>
          </div>
        `
      },
      {
        title: "Ready to Start?",
        content: `
          <p style="margin-bottom: 12px; line-height: 1.4;">The trainer is designed to guide you step-by-step. You will find:</p>
          <ul style="text-align: left; max-width: 280px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
            <li>🟢 **Interactive Lessons**: 18 guided stages checking your moves in real time.</li>
            <li>🔵 **CMLL Browser & Drill**: Interactive diagrams and stopwatch drills.</li>
            <li>🔴 **Quiz Recognition**: Build corner spatial recognition.</li>
            <li>🟣 **Compete Mode**: Race live against Roux AI solver!</li>
          </ul>
        `
      }
    ];
  }

  showIfFirstVisit() {
    const visited = storage.get('visited-onboarding', false);
    if (!visited) {
      this.show();
    }
  }

  show() {
    this.currentSlide = 0;
    this.createModalDOM();
    this.renderSlide();
  }

  createModalDOM() {
    this.modalEl = document.createElement('div');
    this.modalEl.id = 'onboarding-modal';
    this.modalEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(5,7,15,0.9); backdrop-filter: blur(10px);
      z-index: 2000; display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.3s ease;
    `;

    this.modalEl.innerHTML = `
      <div class="glass-panel" style="width: 440px; padding: 25px; border-radius: 20px; box-shadow: var(--glass-shadow); text-align: center; display: flex; flex-direction: column; gap: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--panel-border); padding-bottom: 10px;">
          <h2 id="onboarding-title" style="font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem; font-weight: 700; color: white;">Title</h2>
          <span id="onboarding-step" style="font-size: 0.75rem; color: var(--text-secondary); font-family: monospace;">1/3</span>
        </div>
        
        <div id="onboarding-body" style="min-height: 160px; display: flex; flex-direction: column; justify-content: center;">
          <!-- Slide content injected here -->
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--panel-border); padding-top: 15px;">
          <button id="onboarding-skip" class="btn-secondary" style="padding: 6px 15px; font-size: 0.8rem; margin: 0;">Skip</button>
          <button id="onboarding-next" class="btn-primary" style="padding: 6px 20px; font-size: 0.8rem; min-width: 80px; margin: 0; height: auto;">Next</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);

    // Fade in
    setTimeout(() => {
      this.modalEl.style.opacity = '1';
    }, 10);

    // Event listeners
    this.modalEl.querySelector('#onboarding-skip').addEventListener('click', () => this.close());
    this.modalEl.querySelector('#onboarding-next').addEventListener('click', () => this.next());
  }

  renderSlide() {
    if (!this.modalEl) return;
    const slide = this.slides[this.currentSlide];
    
    this.modalEl.querySelector('#onboarding-title').innerText = slide.title;
    this.modalEl.querySelector('#onboarding-step').innerText = `${this.currentSlide + 1} / ${this.slides.length}`;
    this.modalEl.querySelector('#onboarding-body').innerHTML = slide.content;

    const nextBtn = this.modalEl.querySelector('#onboarding-next');
    if (this.currentSlide === this.slides.length - 1) {
      nextBtn.innerText = "Let's Go!";
      nextBtn.style.background = 'linear-gradient(135deg, var(--neon-green), #00c853)';
      nextBtn.style.color = 'black';
      nextBtn.style.boxShadow = '0 4px 15px rgba(57,255,20,0.25)';
    } else {
      nextBtn.innerText = "Next";
      nextBtn.style.background = 'linear-gradient(135deg, var(--neon-cyan), #00a8ff)';
      nextBtn.style.color = 'black';
      nextBtn.style.boxShadow = '0 4px 15px rgba(0,240,255,0.25)';
    }
  }

  next() {
    if (this.currentSlide < this.slides.length - 1) {
      this.currentSlide++;
      this.renderSlide();
    } else {
      this.close();
    }
  }

  close() {
    if (!this.modalEl) return;
    storage.set('visited-onboarding', true);
    this.modalEl.style.opacity = '0';
    setTimeout(() => {
      this.modalEl.remove();
      this.modalEl = null;
    }, 300);
  }
}
export function initOnboardingModal(appContext) {
  const modal = new OnboardingModal(appContext);
  modal.showIfFirstVisit();
  return modal;
}
