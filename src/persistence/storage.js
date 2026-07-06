// LocalStorage Persistence Wrapper for Roux Trainer
const NAMESPACE = 'roux-trainer:v1:';

export const storage = {
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(NAMESPACE + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading from localStorage key: ${key}`, e);
      return defaultValue;
    }
  },
  
  set(key, val) {
    try {
      localStorage.setItem(NAMESPACE + key, JSON.stringify(val));
    } catch (e) {
      console.error(`Error writing to localStorage key: ${key}`, e);
    }
  },

  // Lessons Checklist
  getCompletedLessons() {
    return this.get('completed-lessons', []);
  },
  completeLesson(lessonId) {
    const list = this.getCompletedLessons();
    if (!list.includes(lessonId)) {
      list.push(lessonId);
      this.set('completed-lessons', list);
    }
  },

  // Solve History
  getSolveHistory() {
    return this.get('solve-history', []);
  },
  addSolveRecord(record) {
    // Record: { timestamp, scramble, totalTimeMs, splitTimes: { fb, sb, cmll, lse }, moveCount }
    const history = this.getSolveHistory();
    history.push(record);
    this.set('solve-history', history);
  },

  // CMLL statistics
  getCMLLStats() {
    return this.get('cmll-stats', {});
  },
  recordCMLLAttempt(caseId, isCorrect, timeMs = null) {
    const stats = this.getCMLLStats();
    if (!stats[caseId]) {
      stats[caseId] = { attempts: 0, correct: 0, times: [], lastSeen: 0 };
    }
    stats[caseId].attempts++;
    if (isCorrect) stats[caseId].correct++;
    if (timeMs !== null) stats[caseId].times.push(timeMs);
    stats[caseId].lastSeen = Date.now();
    this.set('cmll-stats', stats);
  }
};
