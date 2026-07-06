import { LESSONS } from '../data/lessons.js';
import { storage } from '../persistence/storage.js';
import { executeSequence } from '../engine/move-executor.js';

export class LessonsPanel {
  constructor(appContext) {
    this.app = appContext;
    this.container = document.getElementById('lessons-list');
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = '';
    const completedList = storage.getCompletedLessons();

    // Group lessons by Roux stage for curriculum hierarchy
    const groups = {};
    LESSONS.forEach(lesson => {
      if (!groups[lesson.step]) groups[lesson.step] = [];
      groups[lesson.step].push(lesson);
    });

    Object.entries(groups).forEach(([stepName, lessons]) => {
      const stepHeader = document.createElement('div');
      stepHeader.style.cssText = `
        font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary);
        font-weight: bold; margin-top: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;
      `;
      stepHeader.innerText = stepName;
      this.container.appendChild(stepHeader);

      lessons.forEach(lesson => {
        const isCompleted = completedList.includes(lesson.id);
        const card = document.createElement('div');
        card.className = `lesson-card ${this.app.activeLesson?.id === lesson.id ? 'active' : ''}`;
        card.dataset.lessonId = lesson.id;
        
        card.innerHTML = `
          <div class="lesson-card-header">
            <span class="lesson-card-step" style="color: ${isCompleted ? 'var(--neon-green)' : 'var(--text-secondary)'};">
              ${isCompleted ? '✅ COMPLETED' : '📚 LESSON'}
            </span>
          </div>
          <h3 class="lesson-card-title">${lesson.title}</h3>
          <p class="lesson-card-desc">${lesson.objective}</p>
          <button class="lesson-btn-start" style="${isCompleted ? 'border-color: var(--neon-cyan); color: var(--neon-cyan); background: rgba(0, 240, 255, 0.05);' : ''}">
            ${isCompleted ? 'Review Lesson' : 'Start Lesson'}
          </button>
        `;

        card.querySelector('.lesson-btn-start').addEventListener('click', (e) => {
          e.stopPropagation();
          this.startLesson(lesson);
        });

        this.container.appendChild(card);
      });
    });
  }

  startLesson(lesson) {
    this.app.resetPlayback();
    this.app.activeLesson = lesson;

    // Style updates
    document.querySelectorAll('.lesson-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`.lesson-card[data-lesson-id="${lesson.id}"]`);
    if (card) card.classList.add('active');

    // Conceptual vs Interactive lessons
    if (lesson.type === 'conceptual') {
      this.app.cube.reset();
      this.app.renderer.setCubeState(this.app.cube);
      
      // Open modal or HUD for conceptual walkthrough
      const hud = document.getElementById('lesson-hud');
      hud.style.display = 'flex';
      document.getElementById('lesson-hud-title').innerText = lesson.title;
      document.getElementById('lesson-hud-desc').innerHTML = lesson.explanation;
      document.getElementById('lesson-hud-hint').parentElement.style.display = 'none'; // Hide hint row

      // Set CMLL corners highlights or stages isolation for visual aids
      if (lesson.id.includes('fb')) {
        this.app.activeStage = 'fb';
      } else if (lesson.id.includes('sb')) {
        this.app.activeStage = 'sb';
      } else if (lesson.id.includes('cmll')) {
        this.app.activeStage = 'cmll';
      } else if (lesson.id.includes('lse')) {
        this.app.activeStage = 'lse';
      }
      this.app.isolationActive = true;
      this.app.applyStageHighlight();

      // Show conceptual verification: "Read and complete" button
      const exitBtn = document.getElementById('btn-lesson-exit');
      exitBtn.innerText = "Complete Conceptual Guide";
      exitBtn.style.borderColor = 'var(--neon-green)';
      exitBtn.style.color = 'var(--neon-green)';
      
      // Hook conceptual complete
      const completeGuide = () => {
        storage.completeLesson(lesson.id);
        this.render(); // update checks
        
        const overlay = document.getElementById('lesson-success-overlay');
        document.getElementById('lesson-success-message').innerText = `Completed conceptual guide: ${lesson.title}`;
        overlay.style.display = 'flex';
        
        exitBtn.removeEventListener('click', completeGuide);
        exitBtn.addEventListener('click', () => this.app.exitLesson());
      };
      
      exitBtn.replaceWith(exitBtn.cloneNode(true)); // remove previous listeners
      const newExitBtn = document.getElementById('btn-lesson-exit');
      newExitBtn.addEventListener('click', completeGuide);
      
    } else {
      // Interactive solve check
      this.app.cube.reset();
      executeSequence(this.app.cube, lesson.setupScramble);
      this.app.renderer.setCubeState(this.app.cube);

      // Reset HUD labels
      const hud = document.getElementById('lesson-hud');
      hud.style.display = 'flex';
      document.getElementById('lesson-hud-title').innerText = lesson.title;
      document.getElementById('lesson-hud-desc').innerText = lesson.objective;
      document.getElementById('lesson-hud-hint').parentElement.style.display = 'block';
      document.getElementById('lesson-hud-hint').innerText = lesson.hint;

      const exitBtn = document.getElementById('btn-lesson-exit');
      exitBtn.innerText = "Exit Lesson";
      exitBtn.style.borderColor = 'var(--neon-pink)';
      exitBtn.style.color = 'var(--neon-pink)';
      exitBtn.replaceWith(exitBtn.cloneNode(true));
      document.getElementById('btn-lesson-exit').addEventListener('click', () => this.app.exitLesson());

      if (lesson.id.includes('fb')) {
        this.app.activeStage = 'fb';
      } else if (lesson.id.includes('sb')) {
        this.app.activeStage = 'sb';
      } else if (lesson.id.includes('lse')) {
        this.app.activeStage = 'lse';
      }
      this.app.isolationActive = true;
      this.app.applyStageHighlight();
    }
  }

  handleLessonTurn() {
    if (!this.app.activeLesson || this.app.activeLesson.type === 'conceptual') return;

    if (this.app.activeLesson.verify(this.app.cube)) {
      storage.completeLesson(this.app.activeLesson.id);
      this.render();

      const overlay = document.getElementById('lesson-success-overlay');
      document.getElementById('lesson-success-message').innerText = `Excellent job completing: ${this.app.activeLesson.title}!`;
      overlay.style.display = 'flex';
    }
  }
}
export function getNextLesson(activeLesson) {
  const currentIdx = LESSONS.findIndex(l => l.id === activeLesson.id);
  return LESSONS[currentIdx + 1] || null;
}
