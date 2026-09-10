/**
 * CollegeOS - Calculation Engines
 * Mathematical models for Bunk/Attendance prediction, SGPA/CGPA projection, and deadline analytics.
 */

window.CollegeCalc = {
  /**
   * Calculates comprehensive attendance & bunk metrics for a subject.
   * @param {number} present - Classes attended
   * @param {number} total - Total classes conducted
   * @param {number} target - Target percentage (e.g., 75)
   */
  calculateBunkMetrics(present, total, target = 75) {
    target = Number(target) || 75;
    present = Number(present) || 0;
    total = Number(total) || 0;

    if (total === 0) {
      return {
        percentage: 100,
        status: 'safe',
        statusLabel: 'No Classes Yet',
        safeBunks: 0,
        neededClasses: 0,
        message: 'No classes have been recorded yet.',
        nextIfPresent: 100,
        nextIfAbsent: 0,
        canBunk: false
      };
    }

    const currentPercent = (present / total) * 100;
    const roundedPercent = Math.round(currentPercent * 10) / 10;

    let safeBunks = 0;
    let neededClasses = 0;
    let status = 'safe';
    let statusLabel = 'On Track';
    let message = '';

    const targetDecimal = target / 100;

    if (currentPercent >= target) {
      // Safe to bunk calculation:
      // present / (total + x) >= targetDecimal
      // present >= targetDecimal * total + targetDecimal * x
      // x <= (present - targetDecimal * total) / targetDecimal
      // x = Math.floor((present * 100 / target) - total)
      safeBunks = Math.floor((present * 100) / target - total);
      if (safeBunks < 0) safeBunks = 0;

      if (currentPercent >= target + 5) {
        status = 'safe';
        statusLabel = 'Safe Zone';
      } else {
        status = 'warning';
        statusLabel = 'Near Threshold';
      }

      if (safeBunks === 0) {
        message = `You are right at the threshold! Don't miss the next class.`;
      } else if (safeBunks === 1) {
        message = `You can safely miss 1 class and remain at or above ${target}%.`;
      } else {
        message = `You can safely bunk ${safeBunks} classes and still maintain ${target}%.`;
      }
    } else {
      // Shortage / Need classes to recover:
      // (present + y) / (total + y) >= targetDecimal
      // present + y >= targetDecimal * total + targetDecimal * y
      // y * (1 - targetDecimal) >= targetDecimal * total - present
      // y = Math.ceil((target * total - 100 * present) / (100 - target))
      const numerator = target * total - 100 * present;
      const denominator = 100 - target;
      neededClasses = denominator > 0 ? Math.ceil(numerator / denominator) : 999;
      if (neededClasses < 0) neededClasses = 0;

      status = 'critical';
      statusLabel = 'Attendance Shortage';

      if (neededClasses === 1) {
        message = `Attend the next class to get back to ${target}%.`;
      } else {
        message = `You must attend next ${neededClasses} consecutive classes to reach ${target}%.`;
      }
    }

    // Projections
    const nextIfPresent = Math.round(((present + 1) / (total + 1)) * 1000) / 10;
    const nextIfAbsent = Math.round((present / (total + 1)) * 1000) / 10;

    return {
      percentage: roundedPercent,
      status,
      statusLabel,
      safeBunks,
      neededClasses,
      message,
      nextIfPresent,
      nextIfAbsent,
      canBunk: safeBunks > 0,
      target
    };
  },

  /**
   * Calculates overall aggregated attendance statistics across all subjects.
   */
  calculateOverallAttendance(subjects = []) {
    if (!subjects.length) {
      return { totalPresent: 0, totalClasses: 0, overallPercentage: 100, criticalCount: 0, safeCount: 0 };
    }

    let totalPresent = 0;
    let totalClasses = 0;
    let criticalCount = 0;
    let safeCount = 0;

    subjects.forEach(sub => {
      const p = sub.attendance?.present || 0;
      const t = sub.attendance?.total || 0;
      totalPresent += p;
      totalClasses += t;

      const target = sub.targetAttendance || 75;
      const pct = t > 0 ? (p / t) * 100 : 100;
      if (pct < target) criticalCount++;
      else safeCount++;
    });

    const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 1000) / 10 : 100;

    return {
      totalPresent,
      totalClasses,
      overallPercentage,
      criticalCount,
      safeCount
    };
  },

  /**
   * SGPA & CGPA Calculation and Goal Simulator
   */
  gradeToPoints(grade) {
    if (typeof grade === 'number') return grade;
    const map = {
      'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0,
      'S': 10, 'EX': 10
    };
    return map[String(grade).toUpperCase()] !== undefined ? map[String(grade).toUpperCase()] : 0;
  },

  calculateSemesterSGPA(courses = []) {
    let totalCredits = 0;
    let weightedPoints = 0;

    courses.forEach(c => {
      if (c.grade && c.points !== null && c.points !== undefined) {
        const credits = Number(c.credits) || 0;
        const pts = Number(c.points);
        totalCredits += credits;
        weightedPoints += credits * pts;
      }
    });

    if (totalCredits === 0) return null;
    return Math.round((weightedPoints / totalCredits) * 100) / 100;
  },

  calculateCumulativeCGPA(semesters = []) {
    let totalCredits = 0;
    let weightedSGPA = 0;
    let completedSems = 0;

    semesters.forEach(s => {
      if (s.sgpa !== null && s.sgpa !== undefined) {
        const creds = Number(s.totalCredits) || 20;
        totalCredits += creds;
        weightedSGPA += s.sgpa * creds;
        completedSems++;
      }
    });

    if (totalCredits === 0) return { cgpa: 0, completedCredits: 0, completedSems: 0 };
    const cgpa = Math.round((weightedSGPA / totalCredits) * 100) / 100;
    return {
      cgpa,
      completedCredits: totalCredits,
      completedSems
    };
  },

  /**
   * Goal Simulator: Calculates required SGPA for remaining semesters to achieve target CGPA.
   */
  simulateTargetCGPA(currentCGPA, completedCredits, targetCGPA, totalDegreeCredits = 160) {
    const remainingCredits = Math.max(0, totalDegreeCredits - completedCredits);
    if (remainingCredits === 0) return null;

    // targetCGPA * totalDegreeCredits = (currentCGPA * completedCredits) + (reqSGPA * remainingCredits)
    const totalRequiredPoints = targetCGPA * totalDegreeCredits;
    const currentPoints = currentCGPA * completedCredits;
    const neededRemainingPoints = totalRequiredPoints - currentPoints;
    const requiredSGPA = Math.round((neededRemainingPoints / remainingCredits) * 100) / 100;

    return {
      requiredSGPA,
      isFeasible: requiredSGPA <= 10.0,
      remainingCredits,
      difference: Math.round((targetCGPA - currentCGPA) * 100) / 100
    };
  },

  /**
   * Relative time formatting for deadlines, exams, and classes.
   */
  getRelativeTime(dateString) {
    if (!dateString) return 'No date';
    const targetDate = new Date(dateString);
    const now = new Date();
    const diffMs = targetDate - now;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      const pastDays = Math.abs(diffDays);
      if (pastDays === 0) return 'Passed today';
      if (pastDays === 1) return 'Yesterday';
      return `${pastDays} days ago`;
    }

    if (diffHours <= 1) {
      const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return `in ${diffMins} mins`;
    }
    if (diffHours < 24) {
      return `in ${diffHours} hours`;
    }
    if (diffDays === 1) {
      return 'Tomorrow';
    }
    if (diffDays <= 7) {
      return `in ${diffDays} days`;
    }
    return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  /**
   * Formats ISO or standard date to clean readable string.
   */
  formatDate(dateStr, withTime = false) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    if (withTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return d.toLocaleDateString('en-US', options);
  }
};
