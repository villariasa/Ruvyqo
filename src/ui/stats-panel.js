import { storage } from '../persistence/storage.js';
import cmllAlgorithms from '../data/cmll-algorithms.json';

export class StatsPanel {
  constructor(appContext) {
    this.app = appContext;
    this.container = null; // Will be set during orchestration mounting
  }

  mount(containerEl) {
    this.container = containerEl;
    this.render();
  }

  render() {
    if (!this.container) return;

    const history = storage.getSolveHistory();
    const stats = storage.getCMLLStats();

    this.container.innerHTML = `
      <div class="stats-wrapper" style="display: flex; flex-direction: column; gap: 15px; overflow-y: auto; height: 100%; padding-right: 5px;">
        <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 1rem; color: var(--neon-cyan); border-bottom: 1px solid var(--panel-border); padding-bottom: 8px;">
          Trainer Stats & Progress
        </h3>
        
        <!-- Summary Cards -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; justify-content: center;">
            <span style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Total Solves</span>
            <span style="font-size: 1.5rem; font-weight: bold; color: white; font-family: monospace;">${history.length}</span>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; justify-content: center;">
            <span style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Personal Best</span>
            <span style="font-size: 1.5rem; font-weight: bold; color: var(--neon-green); font-family: monospace;">${this.getPB(history)}</span>
          </div>
        </div>

        <!-- Averages -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 10px;">
            <span style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Ao5</span>
            <span style="font-size: 1.1rem; font-weight: bold; display: block; font-family: monospace; color: white;">${this.getAoN(history, 5)}</span>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 10px;">
            <span style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Ao12</span>
            <span style="font-size: 1.1rem; font-weight: bold; display: block; font-family: monospace; color: white;">${this.getAoN(history, 12)}</span>
          </div>
        </div>

        <!-- Average Split Times -->
        <div style="background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 12px;">
          <h4 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px; font-weight: bold;">Average Stage Splits</h4>
          <div style="display: flex; flex-direction: column; gap: 6px; font-family: monospace; font-size: 0.8rem;">
            ${this.renderAverageSplits(history)}
          </div>
        </div>

        <!-- Trend Chart -->
        ${this.renderTrendChart(history)}

        <!-- Weakest CMLL Cases -->
        <div style="background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 12px;">
          <h4 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px; font-weight: bold;">Weakest CMLL Cases</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${this.renderWeakestCases(stats)}
          </div>
        </div>

        <!-- Solve History Log -->
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 5px;">
          <h4 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); font-weight: bold;">Recent Solves</h4>
          <div style="display: flex; flex-direction: column; gap: 6px; max-height: 250px; overflow-y: auto;">
            ${this.renderHistoryList(history)}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  getPB(history) {
    if (history.length === 0) return '--';
    const min = Math.min(...history.map(s => s.totalTimeMs));
    return `${(min / 1000).toFixed(2)}s`;
  }

  // Calculate Average of N (standard cubing average: trims best and worst, averages remainder)
  getAoN(history, n) {
    if (history.length < n) return '--';
    const lastN = history.slice(-n).map(s => s.totalTimeMs);
    lastN.sort((a, b) => a - b);
    // Remove best and worst
    lastN.pop();
    lastN.shift();
    const sum = lastN.reduce((a, b) => a + b, 0);
    return `${((sum / (n - 2)) / 1000).toFixed(2)}s`;
  }

  renderAverageSplits(history) {
    if (history.length === 0) {
      return `<div style="color: var(--text-secondary); font-style: italic;">No solves recorded yet</div>`;
    }

    const stages = ['fb', 'sb', 'cmll', 'lse'];
    const sums = { fb: 0, sb: 0, cmll: 0, lse: 0 };
    const counts = { fb: 0, sb: 0, cmll: 0, lse: 0 };

    history.forEach(s => {
      if (s.splitTimes) {
        stages.forEach(stage => {
          if (s.splitTimes[stage] !== undefined && s.splitTimes[stage] !== null) {
            sums[stage] += s.splitTimes[stage];
            counts[stage]++;
          }
        });
      }
    });

    const getAvgText = (stage) => {
      if (counts[stage] === 0) return '--';
      return `${((sums[stage] / counts[stage]) / 1000).toFixed(2)}s`;
    };

    return `
      <div style="display: flex; justify-content: space-between;">
        <span style="color: var(--neon-cyan);">FB (First Block):</span>
        <span style="color: white; font-weight: bold;">${getAvgText('fb')}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: var(--neon-cyan);">SB (Second Block):</span>
        <span style="color: white; font-weight: bold;">${getAvgText('sb')}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: var(--neon-pink);">CMLL (Corners):</span>
        <span style="color: white; font-weight: bold;">${getAvgText('cmll')}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: var(--neon-green);">LSE (Last Edges):</span>
        <span style="color: white; font-weight: bold;">${getAvgText('lse')}</span>
      </div>
    `;
  }

  renderTrendChart(history) {
    if (history.length < 2) {
      return `
        <div style="height: 100px; border: 1px dashed rgba(255,255,255,0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 0.75rem; font-style: italic;">
          Chart will populate after 2 solves
        </div>
      `;
    }

    const last20 = history.slice(-20).map(s => s.totalTimeMs / 1000);
    const maxVal = Math.max(...last20);
    const minVal = Math.min(...last20);
    const range = maxVal - minVal || 1;

    // SVG coordinates: width 300, height 120
    const w = 280;
    const h = 100;
    const padding = 15;

    const points = last20.map((time, idx) => {
      const x = padding + (idx * (w - 2 * padding)) / (last20.length - 1);
      // Invert Y coordinate (high times at top, low times at bottom)
      const y = h - padding - ((time - minVal) * (h - 2 * padding)) / range;
      return { x, y };
    });

    const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return `
      <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
        <h4 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); font-weight: bold;">Solve Time Trend (Last ${last20.length})</h4>
        <svg viewBox="0 0 280 100" width="100%" height="100" style="overflow: visible;">
          <!-- Grid lines -->
          <line x1="${padding}" y1="${padding}" x2="${w - padding}" y2="${padding}" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
          <line x1="${padding}" y1="${h / 2}" x2="${w - padding}" y2="${h / 2}" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
          <line x1="${padding}" y1="${h - padding}" x2="${w - padding}" y2="${h - padding}" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
          
          <!-- Path line -->
          <path d="${pathData}" fill="none" stroke="var(--neon-cyan)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px rgba(0,240,255,0.4));" />
          
          <!-- Data points -->
          ${points.map((p, idx) => `
            <circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--neon-pink)" stroke="#05070f" stroke-width="1" />
          `).join('')}

          <!-- Axis Labels -->
          <text x="${padding}" y="${padding - 3}" fill="var(--text-secondary)" font-size="6" font-family="monospace">${maxVal.toFixed(1)}s</text>
          <text x="${padding}" y="${h - padding + 8}" fill="var(--text-secondary)" font-size="6" font-family="monospace">${minVal.toFixed(1)}s</text>
        </svg>
      </div>
    `;
  }

  renderWeakestCases(stats) {
    const list = Object.entries(stats)
      .map(([id, s]) => {
        const accuracy = s.attempts > 0 ? s.correct / s.attempts : 0;
        const avgTime = s.times.length > 0 ? s.times.reduce((a, b) => a + b, 0) / s.times.length : null;
        return { id, attempts: s.attempts, accuracy, avgTime };
      })
      // Filter cases with at least 1 attempt
      .filter(x => x.attempts > 0)
      // Sort by lowest accuracy first, then longest time
      .sort((a, b) => a.accuracy - b.accuracy || (b.avgTime || 0) - (a.avgTime || 0))
      .slice(0, 5);

    if (list.length === 0) {
      return `<div style="color: var(--text-secondary); font-size: 0.75rem; font-style: italic;">No CMLL case data yet</div>`;
    }

    return list.map(x => {
      const name = cmllAlgorithms[x.id]?.name || x.id;
      const accPct = Math.round(x.accuracy * 100);
      const timeStr = x.avgTime ? `${(x.avgTime / 1000).toFixed(2)}s` : '--';
      return `
        <div class="weak-case-item" data-case-id="${x.id}" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); border-radius: 6px; padding: 6px 10px; font-size: 0.75rem; cursor: pointer; transition: all 0.2s;">
          <span style="color: white; font-weight: 600;">${name}</span>
          <div style="font-family: monospace; display: flex; gap: 8px;">
            <span style="color: ${accPct < 50 ? 'var(--neon-pink)' : 'var(--neon-green)'};">${accPct}% acc</span>
            <span style="color: var(--text-secondary);">${timeStr}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  renderHistoryList(history) {
    if (history.length === 0) {
      return `<div style="color: var(--text-secondary); font-size: 0.75rem; font-style: italic; text-align: center; padding: 10px;">No history recorded</div>`;
    }

    return [...history].reverse().slice(0, 15).map(s => {
      const date = new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const splitsText = s.splitTimes ? 
        `FB: ${((s.splitTimes.fb || 0)/1000).toFixed(1)}s | SB: ${((s.splitTimes.sb || 0)/1000).toFixed(1)}s | CMLL: ${((s.splitTimes.cmll || 0)/1000).toFixed(1)}s | LSE: ${((s.splitTimes.lse || 0)/1000).toFixed(1)}s`
        : '';
      return `
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; font-family: monospace; font-size: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: var(--neon-cyan); font-weight: bold;">${(s.totalTimeMs / 1000).toFixed(2)}s</span>
            <span style="color: var(--text-secondary); font-size: 0.65rem;">${date} (${s.moveCount} moves)</span>
          </div>
          ${splitsText ? `<div style="color: var(--text-secondary); font-size: 0.65rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${splitsText}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  bindEvents() {
    if (!this.container) return;

    // Make weak cases items clickable to trigger Drill mode
    this.container.querySelectorAll('.weak-case-item').forEach(el => {
      el.addEventListener('click', () => {
        const caseId = el.dataset.caseId;
        // Search for CMLL cases browser tab and click it, then start drill
        const tabCmll = document.getElementById('sub-tab-cmll-cases');
        if (tabCmll) {
          tabCmll.click();
          setTimeout(() => {
            if (this.app.cmllPanel) {
              this.app.cmllPanel.startCMLLDrill(caseId);
            }
          }, 50);
        }
      });
    });
  }
}
