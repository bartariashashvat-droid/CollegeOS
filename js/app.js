/**
 * CollegeOS - Main Application Controller
 * High-performance, modular single-page SaaS dashboard for university students.
 */

document.addEventListener('DOMContentLoaded', () => {
  window.collegeApp = new CollegeOSApp();
});

class CollegeOSApp {
  constructor() {
    this.store = window.collegeStore;
    this.calc = window.CollegeCalc;
    this.audio = window.soundSynth;
    this.icons = window.Icons;

    this.currentView = 'dashboard';
    this.selectedTimetableDay = new Date().getDay() || 1; // Default to current day or Mon
    if (this.selectedTimetableDay > 6) this.selectedTimetableDay = 1;

    this.assignmentViewMode = 'kanban'; // 'kanban' or 'list'
    this.dsaFilter = 'all';

    // Pomodoro State
    this.pomodoro = {
      mode: 'work', // 'work' (25m), 'shortBreak' (5m), 'longBreak' (15m)
      durationMap: { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 },
      timeLeft: 25 * 60,
      isRunning: false,
      intervalId: null
    };

    this.init();
  }

  init() {
    this.applyTheme(this.store.get().settings.theme || 'dark');
    this.setupNavigation();
    this.setupGlobalKeyboardShortcuts();
    this.setupCommandPalette();
    this.setupModals();
    this.setupPomodoro();
    this.setupScratchpad();

    // Subscribe to store updates to auto-refresh current active view
    this.store.subscribe((data) => {
      this.renderCurrentView();
      this.updateHeaderPill();
      this.updateSidebarUser();
    });

    // Initial render
    this.renderCurrentView();
    this.updateHeaderPill();
    this.updateSidebarUser();

    // Start 1-minute ticker for class and exam countdowns
    setInterval(() => {
      if (this.currentView === 'dashboard') {
        this.renderNextClassWidget();
      }
    }, 60000);
  }

  // --- Theme Management ---
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'light' ? this.icons.get('moon') : this.icons.get('sun');
    }
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    this.store.updateSettings({ theme: nextTheme });
    this.showToast(`Switched to ${nextTheme} theme`);
  }

  // --- View Routing & Navigation ---
  setupNavigation() {
    // Desktop & Drawer Nav items
    document.querySelectorAll('[data-view-target]').forEach(el => {
      el.addEventListener('click', (e) => {
        const view = el.getAttribute('data-view-target');
        this.navigateTo(view);
      });
    });

    // Mobile Sidebar Drawer Toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });

      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
          sidebar.classList.remove('mobile-open');
        }
      });
    }

    // Theme toggle button
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Header Quick Pomodoro Pill
    const headerPomo = document.getElementById('header-pomodoro-pill');
    if (headerPomo) {
      headerPomo.addEventListener('click', () => this.navigateTo('focus'));
    }
  }

  navigateTo(viewName) {
    this.currentView = viewName;

    // Update nav active classes
    document.querySelectorAll('[data-view-target]').forEach(el => {
      const target = el.getAttribute('data-view-target');
      if (target === viewName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Switch visible view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const activeSec = document.getElementById(`view-${viewName}`);
    if (activeSec) {
      activeSec.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Close mobile drawer if open
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');

    this.renderCurrentView();
  }

  renderCurrentView() {
    switch (this.currentView) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'timetable':
        this.renderTimetable();
        break;
      case 'attendance':
        this.renderAttendance();
        break;
      case 'academics':
        this.renderAcademics();
        break;
      case 'assignments':
        this.renderAssignments();
        break;
      case 'exams':
        this.renderExams();
        break;
      case 'placements':
        this.renderPlacements();
        break;
      case 'focus':
        this.renderFocus();
        break;
      case 'settings':
        this.renderSettings();
        break;
    }
  }

  updateSidebarUser() {
    const data = this.store.get();
    const nameEl = document.getElementById('sidebar-user-name');
    const subEl = document.getElementById('sidebar-user-sub');
    const avatarEl = document.getElementById('sidebar-user-avatar');

    if (nameEl) nameEl.textContent = data.profile.name || 'Student';
    if (subEl) subEl.textContent = `${data.profile.degree || 'Degree'} • Sem ${data.profile.semester || 1}`;
    if (avatarEl) {
      const initials = (data.profile.name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      avatarEl.textContent = initials;
    }
  }

  // --- View: Dashboard ---
  renderDashboard() {
    const data = this.store.get();

    // Greeting & Date
    const greetingEl = document.getElementById('dashboard-greeting');
    const subtitleEl = document.getElementById('dashboard-subtitle');
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = (data.profile.name || 'Student').split(' ')[0];

    if (greetingEl) {
      greetingEl.innerHTML = `${timeOfDay}, <span>${firstName}</span> 👋`;
    }
    if (subtitleEl) {
      const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
      subtitleEl.textContent = `${todayStr} • ${data.profile.college}`;
    }

    // Next Up Class Live Card
    this.renderNextClassWidget();

    // Overall Attendance Stat Card
    const attStats = this.calc.calculateOverallAttendance(data.subjects);
    const attCardVal = document.getElementById('dash-stat-attendance-val');
    const attCardMeta = document.getElementById('dash-stat-attendance-meta');
    if (attCardVal) {
      attCardVal.textContent = `${attStats.overallPercentage}%`;
      attCardVal.style.color = attStats.overallPercentage >= 75 ? 'var(--success)' : 'var(--danger)';
    }
    if (attCardMeta) {
      if (attStats.criticalCount > 0) {
        attCardMeta.innerHTML = `<span class="badge badge-danger">${attStats.criticalCount} subjects below target</span>`;
      } else {
        attCardMeta.innerHTML = `<span class="badge badge-success">All ${data.subjects.length} subjects safe</span>`;
      }
    }

    // CGPA Stat Card
    const cgpaStats = this.calc.calculateCumulativeCGPA(data.academics.semesters);
    const cgpaVal = document.getElementById('dash-stat-cgpa-val');
    const cgpaMeta = document.getElementById('dash-stat-cgpa-meta');
    if (cgpaVal) cgpaVal.textContent = cgpaStats.cgpa.toFixed(2);
    if (cgpaMeta) {
      const diff = Math.round((cgpaStats.cgpa - data.profile.targetCgpa) * 100) / 100;
      const targetStr = `Target: ${data.profile.targetCgpa}`;
      cgpaMeta.textContent = `${targetStr} (${diff >= 0 ? '+' : ''}${diff})`;
    }

    // Pending Assignments Stat Card
    const pendingAsgs = data.assignments.filter(a => a.status === 'todo' || a.status === 'in_progress');
    const urgentCount = pendingAsgs.filter(a => a.priority === 'urgent' || a.priority === 'high').length;
    const asgVal = document.getElementById('dash-stat-asg-val');
    const asgMeta = document.getElementById('dash-stat-asg-meta');
    if (asgVal) asgVal.textContent = pendingAsgs.length;
    if (asgMeta) {
      asgMeta.innerHTML = urgentCount > 0 ? `<span class="badge badge-danger">${urgentCount} high priority</span>` : `<span class="badge badge-subtle">No urgent tasks</span>`;
    }

    // Placement Pipeline Stat Card
    const activeApps = data.placements.applications.filter(a => a.status !== 'rejected');
    const offersCount = data.placements.applications.filter(a => a.status === 'offer').length;
    const placeVal = document.getElementById('dash-stat-place-val');
    const placeMeta = document.getElementById('dash-stat-place-meta');
    if (placeVal) placeVal.textContent = activeApps.length;
    if (placeMeta) {
      placeMeta.innerHTML = offersCount > 0 ? `<span class="badge badge-success">${offersCount} Offers In Hand!</span>` : `<span class="badge badge-info">${data.placements.dsaStats.total} DSA Solved</span>`;
    }

    // Attendance Quick Radar Widget
    this.renderDashboardAttendanceRadar(data.subjects);

    // Upcoming Deadlines Widget
    this.renderDashboardDeadlines(data.assignments, data.exams);

    // Today's Timetable Preview
    this.renderDashboardTodaySchedule(data.timetable, data.subjects);
  }

  renderNextClassWidget() {
    const data = this.store.get();
    const container = document.getElementById('dash-next-class-container');
    if (!container) return;

    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
    const currentHours = now.getHours();
    const currentMins = now.getMinutes();
    const currentTotalMins = currentHours * 60 + currentMins;

    // Filter today's timetable slots
    const todaySlots = data.timetable.filter(t => t.day === currentDay).sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (todaySlots.length === 0) {
      container.innerHTML = `
        <div class="next-class-card" style="background: var(--bg-card); border-color: var(--border-card);">
          <div class="next-class-info">
            <div class="next-class-timebox">
              <div class="next-class-time" style="color: var(--text-muted); font-size: 0.95rem;">No Classes</div>
              <div class="next-class-countdown">Today</div>
            </div>
            <div class="next-class-details">
              <h3>No classes scheduled for today!</h3>
              <div class="next-class-meta">
                <span>Enjoy your study sprint or catch up on project work.</span>
              </div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="collegeApp.navigateTo('focus')">
            ${this.icons.get('focus')} Start Focus Sprint
          </button>
        </div>
      `;
      return;
    }

    // Find next upcoming or currently active slot
    let activeSlot = null;
    let nextSlot = null;

    for (const slot of todaySlots) {
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);
      const slotStartTotal = startH * 60 + startM;
      const slotEndTotal = endH * 60 + endM;

      if (currentTotalMins >= slotStartTotal && currentTotalMins < slotEndTotal) {
        activeSlot = slot;
        break;
      } else if (slotStartTotal > currentTotalMins) {
        if (!nextSlot) nextSlot = slot;
      }
    }

    const targetSlot = activeSlot || nextSlot || todaySlots[0];
    const isOngoing = Boolean(activeSlot);
    const subject = data.subjects.find(s => s.id === targetSlot.subjectId) || { name: 'Class', code: '', instructor: 'Staff' };

    // Calculate countdown
    const [startH, startM] = targetSlot.startTime.split(':').map(Number);
    const slotStartTotal = startH * 60 + startM;
    const diffMins = slotStartTotal - currentTotalMins;

    let countdownLabel = 'Next Up';
    if (isOngoing) {
      countdownLabel = 'LIVE NOW';
    } else if (diffMins > 0) {
      countdownLabel = `In ${diffMins} min`;
    }

    container.innerHTML = `
      <div class="next-class-card">
        <div class="next-class-info">
          <div class="next-class-timebox">
            <div class="next-class-time">${targetSlot.startTime}</div>
            <div class="next-class-countdown" style="${isOngoing ? 'color: var(--success); font-weight:700;' : ''}">${countdownLabel}</div>
          </div>
          <div class="next-class-details">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
              <span class="badge badge-primary">${targetSlot.type}</span>
              <span class="course-code">${subject.code}</span>
            </div>
            <h3>${subject.name}</h3>
            <div class="next-class-meta">
              <span>📍 Room ${targetSlot.room}</span>
              <span>👤 ${subject.instructor}</span>
              <span>🕒 ${targetSlot.startTime} - ${targetSlot.endTime}</span>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="btn btn-sm btn-success" onclick="collegeApp.quickMarkAttendance('${subject.id}', 'present')">
            ${this.icons.get('check')} Present
          </button>
          <button class="btn btn-sm btn-secondary" onclick="collegeApp.quickMarkAttendance('${subject.id}', 'absent')">
            ${this.icons.get('x')} Absent
          </button>
        </div>
      </div>
    `;
  }

  renderDashboardAttendanceRadar(subjects) {
    const listEl = document.getElementById('dash-attendance-list');
    if (!listEl) return;

    if (!subjects.length) {
      listEl.innerHTML = `<p style="padding:1rem; text-align:center;">No courses registered yet.</p>`;
      return;
    }

    listEl.innerHTML = subjects.map(sub => {
      const stats = this.calc.calculateBunkMetrics(sub.attendance.present, sub.attendance.total, sub.targetAttendance);
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-subtle);">
          <div style="flex: 1; padding-right: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${sub.color || 'var(--primary)'};"></span>
              <strong style="font-size: 0.9rem;">${sub.name}</strong>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
              ${sub.attendance.present}/${sub.attendance.total} classes • Target ${sub.targetAttendance}%
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.1rem; font-weight: 700; color: ${stats.status === 'critical' ? 'var(--danger)' : stats.status === 'warning' ? 'var(--warning)' : 'var(--success)'};">
              ${stats.percentage}%
            </div>
            <div style="font-size: 0.72rem; color: var(--text-secondary);">
              ${stats.canBunk ? `Bunk safe: ${stats.safeBunks}` : `Need +${stats.neededClasses}`}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderDashboardDeadlines(assignments, exams) {
    const container = document.getElementById('dash-deadlines-list');
    if (!container) return;

    const activeAsgs = assignments
      .filter(a => a.status !== 'graded' && a.status !== 'submitted')
      .map(a => ({ ...a, itemType: 'assignment', sortDate: new Date(a.dueDate) }));

    const upcomingExams = exams
      .map(e => ({ ...e, itemType: 'exam', sortDate: new Date(e.date) }));

    const combined = [...activeAsgs, ...upcomingExams]
      .sort((a, b) => a.sortDate - b.sortDate)
      .slice(0, 5);

    if (combined.length === 0) {
      container.innerHTML = `<p style="padding:1.5rem; text-align:center; color:var(--text-muted);">No upcoming assignments or exams. Great job! 🎉</p>`;
      return;
    }

    container.innerHTML = combined.map(item => {
      const isExam = item.itemType === 'exam';
      const relTime = this.calc.getRelativeTime(item.sortDate);
      const isUrgent = relTime.includes('hours') || relTime.includes('mins') || relTime === 'Tomorrow';

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-subtle);">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: ${isExam ? 'var(--danger-light)' : 'var(--primary-light)'}; color: ${isExam ? 'var(--danger)' : 'var(--primary)'};">
              ${isExam ? this.icons.get('exams') : this.icons.get('assignments')}
            </div>
            <div>
              <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${item.title}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${isExam ? `Exam • ${item.room}` : `Assignment • ${item.marks} marks`}</div>
            </div>
          </div>
          <span class="badge ${isUrgent ? 'badge-danger' : 'badge-subtle'}">
            ${relTime}
          </span>
        </div>
      `;
    }).join('');
  }

  renderDashboardTodaySchedule(timetable, subjects) {
    const container = document.getElementById('dash-today-schedule');
    if (!container) return;

    const currentDay = new Date().getDay() || 1;
    const todaySlots = timetable.filter(t => t.day === currentDay).sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (todaySlots.length === 0) {
      container.innerHTML = `<p style="padding: 1rem; color: var(--text-muted); text-align: center;">No schedule recorded for today.</p>`;
      return;
    }

    container.innerHTML = todaySlots.map(slot => {
      const sub = subjects.find(s => s.id === slot.subjectId) || { name: 'Class', color: '#6366f1' };
      return `
        <div style="display: flex; align-items: center; gap: 1rem; padding: 0.65rem 0; border-bottom: 1px solid var(--border-subtle);">
          <div style="font-weight: 700; font-size: 0.85rem; width: 95px; font-variant-numeric: tabular-nums;">
            ${slot.startTime} - ${slot.endTime}
          </div>
          <div style="width: 4px; height: 26px; border-radius: 2px; background: ${sub.color};"></div>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 0.88rem;">${sub.name}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${slot.room} • ${slot.type}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Quick Attendance Action ---
  quickMarkAttendance(subjectId, status) {
    this.store.logAttendance(subjectId, status);
    if (this.store.get().settings.soundEnabled) {
      this.audio.playChime(status === 'present' ? 'success' : 'pop');
    }
    const sub = this.store.get().subjects.find(s => s.id === subjectId);
    this.showToast(`Logged ${status.toUpperCase()} for ${sub?.code || 'Course'}`);
  }

  // --- View: Timetable ---
  renderTimetable() {
    const data = this.store.get();
    const daySelector = document.getElementById('timetable-day-selector');
    const slotsList = document.getElementById('timetable-slots-list');

    const days = [
      { id: 1, name: 'Monday' },
      { id: 2, name: 'Tuesday' },
      { id: 3, name: 'Wednesday' },
      { id: 4, name: 'Thursday' },
      { id: 5, name: 'Friday' },
      { id: 6, name: 'Saturday' }
    ];

    if (daySelector) {
      daySelector.innerHTML = days.map(d => `
        <button class="day-tab ${this.selectedTimetableDay === d.id ? 'active' : ''}" onclick="collegeApp.selectTimetableDay(${d.id})">
          ${d.name}
        </button>
      `).join('');
    }

    if (slotsList) {
      const currentSlots = data.timetable
        .filter(t => t.day === this.selectedTimetableDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (currentSlots.length === 0) {
        slotsList.innerHTML = `
          <div class="card" style="text-align: center; padding: 3rem 1rem;">
            <p style="color: var(--text-muted); margin-bottom: 1rem;">No classes scheduled for this day.</p>
            <button class="btn btn-primary btn-sm" onclick="collegeApp.openAddTimetableSlotModal(${this.selectedTimetableDay})">
              ${this.icons.get('plus')} Add Class Slot
            </button>
          </div>
        `;
        return;
      }

      slotsList.innerHTML = currentSlots.map(slot => {
        const sub = data.subjects.find(s => s.id === slot.subjectId) || { name: 'Unknown Subject', code: 'N/A', instructor: 'Staff', color: '#6366f1' };
        return `
          <div class="timetable-slot-item">
            <div class="slot-time-block">
              <div class="slot-time-range">${slot.startTime} – ${slot.endTime}</div>
              <span class="badge ${slot.type === 'Lab' ? 'badge-info' : slot.type === 'Tutorial' ? 'badge-warning' : 'badge-primary'}">${slot.type}</span>
            </div>
            <div class="slot-subject-block">
              <div class="slot-subject-title">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: ${sub.color};"></span>
                <span>${sub.name}</span>
                <span class="course-code">(${sub.code})</span>
              </div>
              <div class="slot-meta">
                <span>📍 ${slot.room}</span>
                <span>👤 ${sub.instructor}</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <button class="btn btn-sm btn-success" title="Mark Present" onclick="collegeApp.quickMarkAttendance('${sub.id}', 'present')">
                ${this.icons.get('check')} Present
              </button>
              <button class="btn btn-sm btn-secondary" title="Mark Absent" onclick="collegeApp.quickMarkAttendance('${sub.id}', 'absent')">
                ${this.icons.get('x')} Absent
              </button>
              <button class="icon-btn" title="Delete Slot" onclick="collegeApp.deleteTimetableSlot('${slot.id}')">
                ${this.icons.get('trash', '', 14)}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  selectTimetableDay(dayId) {
    this.selectedTimetableDay = dayId;
    this.renderTimetable();
  }

  deleteTimetableSlot(slotId) {
    if (confirm('Delete this timetable slot?')) {
      this.store.deleteTimetableSlot(slotId);
      this.showToast('Class slot removed');
    }
  }

  // --- View: Attendance & Bunk Predictor ---
  renderAttendance() {
    const data = this.store.get();
    const grid = document.getElementById('attendance-cards-grid');
    if (!grid) return;

    const overall = this.calc.calculateOverallAttendance(data.subjects);
    const overallBanner = document.getElementById('attendance-overall-banner');
    if (overallBanner) {
      overallBanner.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.5rem; margin-bottom: 0.2rem;">
              Overall Attendance: <span style="color: ${overall.overallPercentage >= 75 ? 'var(--success)' : 'var(--danger)'};">${overall.overallPercentage}%</span>
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">
              Total: ${overall.totalPresent} attended out of ${overall.totalClasses} lectures conducted across ${data.subjects.length} courses.
            </p>
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <button class="btn btn-secondary btn-sm" onclick="collegeApp.openBulkThresholdModal()">
              ${this.icons.get('settings')} Adjust Target %
            </button>
            <button class="btn btn-primary btn-sm" onclick="collegeApp.openAddSubjectModal()">
              ${this.icons.get('plus')} Add Subject
            </button>
          </div>
        </div>
      `;
    }

    if (!data.subjects.length) {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
          <p style="color: var(--text-muted); margin-bottom: 1rem;">No subjects tracked yet.</p>
          <button class="btn btn-primary" onclick="collegeApp.openAddSubjectModal()">
            ${this.icons.get('plus')} Add Your First Subject
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = data.subjects.map(sub => {
      const metrics = this.calc.calculateBunkMetrics(sub.attendance.present, sub.attendance.total, sub.targetAttendance);
      return `
        <div class="attendance-card" style="border-top: 3px solid ${sub.color};">
          <div class="attendance-top">
            <div class="course-info">
              <span class="course-code">${sub.code} • ${sub.credits} Credits</span>
              <h3>${sub.name}</h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.1rem;">👤 ${sub.instructor}</p>
            </div>
            <button class="icon-btn" title="Edit course attendance numbers" onclick="collegeApp.openEditAttendanceModal('${sub.id}')">
              ${this.icons.get('edit', '', 14)}
            </button>
          </div>

          <div class="attendance-stats-row">
            <div class="att-ratio">
              <span class="att-count">${sub.attendance.present} / ${sub.attendance.total}</span>
              <span class="att-total-label">Attended / Total</span>
            </div>
            <div class="att-percent-display">
              <span class="att-percent-num" style="color: ${metrics.status === 'critical' ? 'var(--danger)' : metrics.status === 'warning' ? 'var(--warning)' : 'var(--success)'};">
                ${metrics.percentage}%
              </span>
              <span class="att-target-label">Target: ${sub.targetAttendance}%</span>
            </div>
          </div>

          <!-- Smart Bunk Status Banner -->
          <div class="bunk-status-box ${metrics.status}">
            <div>${metrics.status === 'critical' ? this.icons.get('alert', '', 18) : this.icons.get('zap', '', 18)}</div>
            <div>
              <strong>${metrics.statusLabel}:</strong> ${metrics.message}
            </div>
          </div>

          <!-- Quick Log Controls -->
          <div class="attendance-actions">
            <button class="btn-att btn-att-present" onclick="collegeApp.logAttendanceAction('${sub.id}', 'present')">
              + Present
            </button>
            <button class="btn-att btn-att-absent" onclick="collegeApp.logAttendanceAction('${sub.id}', 'absent')">
              + Absent
            </button>
            <button class="btn-att btn-att-cancel" title="Class Cancelled" onclick="collegeApp.logAttendanceAction('${sub.id}', 'cancelled')">
              Cancelled
            </button>
            <button class="btn-att" title="Undo Last Log" onclick="collegeApp.undoAttendanceAction('${sub.id}')">
              ${this.icons.get('rotateCcw', '', 14)}
            </button>
          </div>

          <div style="display:flex; justify-content:space-between; font-size: 0.72rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 0.5rem;">
            <span>If present next: <strong>${metrics.nextIfPresent}%</strong></span>
            <span>If bunked next: <strong>${metrics.nextIfAbsent}%</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }

  logAttendanceAction(subjectId, status) {
    this.store.logAttendance(subjectId, status);
    if (this.store.get().settings.soundEnabled) {
      this.audio.playChime(status === 'present' ? 'success' : 'pop');
    }
    this.showToast(`Logged ${status}`);
  }

  undoAttendanceAction(subjectId) {
    this.store.undoLastAttendance(subjectId);
    this.showToast('Undid last entry');
  }

  // --- View: Academics & CGPA ---
  renderAcademics() {
    const data = this.store.get();
    const cgpaStats = this.calc.calculateCumulativeCGPA(data.academics.semesters);

    // Cumulative CGPA Summary Hero
    const cgpaHero = document.getElementById('academics-cgpa-hero');
    if (cgpaHero) {
      cgpaHero.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem;">
          <div>
            <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600;">
              Cumulative Grade Point Average
            </div>
            <div style="display: flex; align-items: baseline; gap: 0.75rem; margin-top: 0.25rem;">
              <span style="font-size: 3rem; font-weight: 800; letter-spacing: -0.04em; color: var(--primary);">${cgpaStats.cgpa.toFixed(2)}</span>
              <span style="color: var(--text-muted); font-size: 1.1rem;">/ 10.0</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Across ${cgpaStats.completedCredits} credits completed in ${cgpaStats.completedSems} semesters.
            </p>
          </div>
          <div style="background: var(--bg-surface); border: 1px solid var(--border-card); border-radius: var(--radius-md); padding: 1rem 1.5rem; text-align: right;">
            <div style="font-size: 0.8rem; color: var(--text-muted);">Target CGPA</div>
            <div style="font-size: 1.6rem; font-weight: 700; color: var(--text-primary);">${data.profile.targetCgpa}</div>
            <span class="badge ${cgpaStats.cgpa >= data.profile.targetCgpa ? 'badge-success' : 'badge-warning'}">
              ${cgpaStats.cgpa >= data.profile.targetCgpa ? 'Target Met 🎉' : 'Needs Push'}
            </span>
          </div>
        </div>
      `;
    }

    // Target Simulator
    const simBox = document.getElementById('academics-simulator-box');
    if (simBox) {
      const targetVal = data.profile.targetCgpa;
      const simResult = this.calc.simulateTargetCGPA(cgpaStats.cgpa, cgpaStats.completedCredits, targetVal);

      simBox.innerHTML = `
        <div class="simulator-box">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h3 style="display: flex; align-items: center; gap: 0.5rem;">
              ${this.icons.get('zap')} Target CGPA Simulator
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Degree: 160 Credits</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.35rem;">
            Simulate what average SGPA you must score in remaining semesters to achieve your dream CGPA.
          </p>

          <div class="simulator-controls">
            <div class="slider-group">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.35rem;">
                <span>Target CGPA: <strong id="sim-target-label">${targetVal}</strong></span>
                <span>Max: 10.0</span>
              </div>
              <input type="range" class="range-slider" id="sim-target-slider" min="7.0" max="9.9" step="0.05" value="${targetVal}" oninput="collegeApp.handleSimSlider(this.value)">
            </div>
          </div>

          <div class="simulator-result-box" id="sim-result-box">
            ${this.renderSimResultMarkup(simResult, targetVal)}
          </div>
        </div>
      `;
    }

    // Semesters List Breakdown
    const semsContainer = document.getElementById('academics-semesters-list');
    if (semsContainer) {
      semsContainer.innerHTML = data.academics.semesters.map(sem => `
        <div class="card" style="margin-bottom: 1rem;">
          <div class="card-header">
            <div>
              <strong style="font-size: 1.05rem;">Semester ${sem.sem}</strong>
              <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;">(${sem.totalCredits} Total Credits)</span>
            </div>
            <div>
              ${sem.sgpa !== null ? `<span class="badge badge-primary" style="font-size: 0.9rem;">SGPA: ${sem.sgpa.toFixed(2)}</span>` : `<span class="badge badge-warning">Ongoing Semester</span>`}
            </div>
          </div>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
              <thead>
                <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); text-align: left;">
                  <th style="padding: 0.5rem 0.75rem;">Course</th>
                  <th style="padding: 0.5rem 0.75rem;">Credits</th>
                  <th style="padding: 0.5rem 0.75rem;">Grade</th>
                  <th style="padding: 0.5rem 0.75rem;">Grade Points</th>
                </tr>
              </thead>
              <tbody>
                ${sem.courses.map(c => `
                  <tr style="border-bottom: 1px solid var(--border-subtle);">
                    <td style="padding: 0.6rem 0.75rem; font-weight: 500;">${c.name}</td>
                    <td style="padding: 0.6rem 0.75rem; color: var(--text-muted);">${c.credits}</td>
                    <td style="padding: 0.6rem 0.75rem;">
                      ${c.grade ? `<span class="badge badge-success">${c.grade}</span>` : `<span class="badge badge-subtle">In Progress</span>`}
                    </td>
                    <td style="padding: 0.6rem 0.75rem; font-variant-numeric: tabular-nums;">
                      ${c.points !== null ? c.points : '—'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `).join('');
    }

    // Syllabus Checklist Widget
    this.renderSyllabusChecklists(data.subjects);
  }

  handleSimSlider(newVal) {
    const label = document.getElementById('sim-target-label');
    if (label) label.textContent = newVal;

    const data = this.store.get();
    const cgpaStats = this.calc.calculateCumulativeCGPA(data.academics.semesters);
    const simResult = this.calc.simulateTargetCGPA(cgpaStats.cgpa, cgpaStats.completedCredits, Number(newVal));

    const resultBox = document.getElementById('sim-result-box');
    if (resultBox) {
      resultBox.innerHTML = this.renderSimResultMarkup(simResult, newVal);
    }
  }

  renderSimResultMarkup(simResult, targetVal) {
    if (!simResult) {
      return `<span>No remaining degree credits found to simulate.</span>`;
    }

    if (!simResult.isFeasible) {
      return `
        <div>
          <strong style="color: var(--danger);">Mathematically unattainable:</strong>
          <span style="font-size: 0.85rem; color: var(--text-secondary);">
            To reach ${targetVal} CGPA, you would need an SGPA of <strong>${simResult.requiredSGPA}</strong>, which exceeds the 10.0 ceiling.
          </span>
        </div>
      `;
    }

    return `
      <div>
        <div style="font-size: 0.85rem; color: var(--text-secondary);">
          Required Average SGPA across remaining <strong>${simResult.remainingCredits} credits</strong>:
        </div>
        <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary); margin-top: 0.2rem;">
          ${simResult.requiredSGPA.toFixed(2)} SGPA
        </div>
      </div>
      <span class="badge ${simResult.requiredSGPA <= 8.5 ? 'badge-success' : 'badge-warning'}">
        ${simResult.requiredSGPA <= 8.5 ? 'Very Achievable 👍' : 'High Focus Required 🔥'}
      </span>
    `;
  }

  renderSyllabusChecklists(subjects) {
    const container = document.getElementById('academics-syllabus-list');
    if (!container) return;

    container.innerHTML = subjects.map(sub => {
      const totalUnits = sub.syllabus?.length || 0;
      const completedUnits = sub.syllabus?.filter(u => u.done).length || 0;
      const pct = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

      return `
        <div class="card" style="margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
            <div>
              <strong style="font-size: 0.95rem;">${sub.name}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${completedUnits} of ${totalUnits} Units Completed</div>
            </div>
            <span class="badge ${pct === 100 ? 'badge-success' : 'badge-primary'}">${pct}% Covered</span>
          </div>
          <div class="progress-track" style="margin-bottom: 1rem;">
            <div class="progress-fill" style="width: ${pct}%; background: ${sub.color};"></div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${(sub.syllabus || []).map((unit, idx) => `
              <label style="display: flex; align-items: center; gap: 0.65rem; font-size: 0.85rem; cursor: pointer;">
                <input type="checkbox" ${unit.done ? 'checked' : ''} onchange="collegeApp.toggleSyllabusUnit('${sub.id}', ${idx}, this.checked)">
                <span style="${unit.done ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">
                  Unit ${unit.unit}: ${unit.title}
                </span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  toggleSyllabusUnit(subjectId, unitIndex, isDone) {
    this.store.update(data => {
      const sub = data.subjects.find(s => s.id === subjectId);
      if (sub && sub.syllabus && sub.syllabus[unitIndex]) {
        sub.syllabus[unitIndex].done = isDone;
      }
    });
    if (this.store.get().settings.soundEnabled) {
      this.audio.playChime('pop');
    }
  }

  // --- View: Assignments & Tasks Hub ---
  renderAssignments() {
    const data = this.store.get();
    const container = document.getElementById('assignments-container');
    if (!container) return;

    if (this.assignmentViewMode === 'kanban') {
      this.renderAssignmentsKanban(data.assignments, data.subjects);
    } else {
      this.renderAssignmentsList(data.assignments, data.subjects);
    }
  }

  renderAssignmentsKanban(assignments, subjects) {
    const container = document.getElementById('assignments-container');
    const columns = [
      { id: 'todo', title: 'To Do', badgeClass: 'badge-subtle' },
      { id: 'in_progress', title: 'In Progress', badgeClass: 'badge-warning' },
      { id: 'submitted', title: 'Submitted', badgeClass: 'badge-info' },
      { id: 'graded', title: 'Graded & Done', badgeClass: 'badge-success' }
    ];

    container.innerHTML = `
      <div class="kanban-board">
        ${columns.map(col => {
          const colItems = assignments.filter(a => a.status === col.id);
          return `
            <div class="kanban-column" data-status="${col.id}" ondragover="collegeApp.handleDragOver(event)" ondrop="collegeApp.handleDrop(event, '${col.id}')">
              <div class="kanban-col-header">
                <span>${col.title}</span>
                <span class="kanban-col-count">${colItems.length}</span>
              </div>
              <div class="kanban-cards-area">
                ${colItems.map(item => {
                  const sub = subjects.find(s => s.id === item.subjectId) || { name: 'Subject', color: '#6366f1' };
                  const relTime = this.calc.getRelativeTime(item.dueDate);
                  return `
                    <div class="kanban-card" draggable="true" ondragstart="collegeApp.handleDragStart(event, '${item.id}')">
                      <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span class="badge" style="background: ${sub.color}22; color: ${sub.color}; font-size: 0.68rem;">${sub.name}</span>
                        <span class="badge ${item.priority === 'urgent' ? 'badge-danger' : item.priority === 'high' ? 'badge-warning' : 'badge-subtle'}">${item.priority}</span>
                      </div>
                      <div class="kanban-card-title">${item.title}</div>
                      ${item.description ? `<p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.3;">${item.description.slice(0, 80)}...</p>` : ''}
                      <div class="kanban-card-footer">
                        <span>🕒 ${relTime}</span>
                        <span>${item.grade ? `Grade: <strong>${item.grade}</strong>` : `${item.marks} marks`}</span>
                      </div>
                      <div style="display: flex; justify-content: flex-end; gap: 0.25rem; margin-top: 0.25rem;">
                        ${col.id !== 'graded' ? `
                          <button class="btn btn-sm btn-secondary" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;" onclick="collegeApp.advanceAssignmentStatus('${item.id}', '${col.id}')">
                            Move Next →
                          </button>
                        ` : ''}
                        <button class="icon-btn" style="width: 24px; height: 24px;" onclick="collegeApp.deleteAssignment('${item.id}')">
                          ${this.icons.get('trash', '', 12)}
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderAssignmentsList(assignments, subjects) {
    const container = document.getElementById('assignments-container');
    container.innerHTML = `
      <div class="card">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); text-align: left;">
              <th style="padding: 0.75rem;">Title</th>
              <th style="padding: 0.75rem;">Course</th>
              <th style="padding: 0.75rem;">Priority</th>
              <th style="padding: 0.75rem;">Due Date</th>
              <th style="padding: 0.75rem;">Status</th>
              <th style="padding: 0.75rem; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${assignments.map(item => {
              const sub = subjects.find(s => s.id === item.subjectId) || { name: 'General', color: '#6366f1' };
              return `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 0.75rem; font-weight: 600;">${item.title}</td>
                  <td style="padding: 0.75rem;"><span class="badge" style="background: ${sub.color}22; color: ${sub.color};">${sub.name}</span></td>
                  <td style="padding: 0.75rem;"><span class="badge ${item.priority === 'urgent' ? 'badge-danger' : 'badge-subtle'}">${item.priority}</span></td>
                  <td style="padding: 0.75rem;">${this.calc.getRelativeTime(item.dueDate)}</td>
                  <td style="padding: 0.75rem;"><span class="badge badge-primary">${item.status}</span></td>
                  <td style="padding: 0.75rem; text-align: right;">
                    <button class="icon-btn" onclick="collegeApp.deleteAssignment('${item.id}')">${this.icons.get('trash', '', 14)}</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  setAssignmentViewMode(mode) {
    this.assignmentViewMode = mode;
    this.renderAssignments();
  }

  advanceAssignmentStatus(id, currentStatus) {
    const nextMap = { todo: 'in_progress', in_progress: 'submitted', submitted: 'graded' };
    const next = nextMap[currentStatus];
    if (next) {
      this.store.updateAssignmentStatus(id, next);
      if (this.store.get().settings.soundEnabled) {
        this.audio.playChime(next === 'graded' || next === 'submitted' ? 'success' : 'pop');
      }
      this.showToast(`Updated status to ${next}`);
    }
  }

  deleteAssignment(id) {
    if (confirm('Delete this assignment?')) {
      this.store.deleteAssignment(id);
      this.showToast('Assignment deleted');
    }
  }

  // Drag and drop support for Kanban
  handleDragStart(e, id) {
    e.dataTransfer.setData('text/plain', id);
    e.currentTarget.classList.add('dragging');
  }

  handleDragOver(e) {
    e.preventDefault();
  }

  handleDrop(e, newStatus) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      this.store.updateAssignmentStatus(id, newStatus);
      if (this.store.get().settings.soundEnabled) {
        this.audio.playChime('pop');
      }
      this.showToast(`Moved to ${newStatus}`);
    }
  }

  // --- View: Exams & Schedule ---
  renderExams() {
    const data = this.store.get();
    const container = document.getElementById('exams-grid');
    if (!container) return;

    if (!data.exams.length) {
      container.innerHTML = `
        <div class="card" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
          <p style="color: var(--text-muted); margin-bottom: 1rem;">No exams scheduled on your calendar.</p>
          <button class="btn btn-primary" onclick="collegeApp.openAddExamModal()">
            ${this.icons.get('plus')} Add Exam Schedule
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = data.exams.map(exam => {
      const sub = data.subjects.find(s => s.id === exam.subjectId) || { name: 'Subject', color: '#6366f1' };
      const relTime = this.calc.getRelativeTime(exam.date);
      const isUrgent = relTime.includes('hours') || relTime.includes('Tomorrow') || relTime.includes('in 1 day') || relTime.includes('in 2 days');

      return `
        <div class="card" style="border-top: 3px solid ${sub.color};">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.75rem;">
            <div>
              <span class="badge" style="background: ${sub.color}22; color: ${sub.color}; margin-bottom: 0.35rem;">${sub.name}</span>
              <h3 style="font-size: 1.1rem; margin-top: 0.2rem;">${exam.title}</h3>
            </div>
            <span class="badge ${isUrgent ? 'badge-danger' : 'badge-subtle'}">${relTime}</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem; color: var(--text-secondary); margin: 0.75rem 0;">
            <div>📅 <strong>${this.calc.formatDate(exam.date, true)}</strong></div>
            <div>📍 Room / Venue: <strong>${exam.room}</strong></div>
            <div>⚖️ Weightage: <strong>${exam.weightage}%</strong> • Duration: <strong>${exam.durationMinutes} mins</strong></div>
            ${exam.targetScore ? `<div>🎯 Target Score: <strong>${exam.targetScore} / ${exam.weightage}</strong></div>` : ''}
          </div>

          ${exam.topics?.length ? `
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; margin-top: 0.5rem;">
              <strong style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Key Topics to Revise:</strong>
              <ul style="font-size: 0.82rem; color: var(--text-secondary); padding-left: 1.25rem; margin-top: 0.35rem; display: flex; flex-direction: column; gap: 0.25rem;">
                ${exam.topics.map(t => `<li>${t}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div style="display: flex; justify-content: flex-end; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
            <button class="btn btn-sm btn-secondary" onclick="collegeApp.deleteExam('${exam.id}')">
              ${this.icons.get('trash', '', 14)} Remove
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  deleteExam(id) {
    if (confirm('Remove this exam from calendar?')) {
      this.store.deleteExam(id);
      this.showToast('Exam removed');
    }
  }

  // --- View: Placements & Career Accelerator ---
  renderPlacements() {
    const data = this.store.get();

    // DSA Progress Counters
    const dsaStats = data.placements.dsaStats;
    const easyEl = document.getElementById('dsa-easy-count');
    const medEl = document.getElementById('dsa-med-count');
    const hardEl = document.getElementById('dsa-hard-count');
    const totalEl = document.getElementById('dsa-total-count');

    if (easyEl) easyEl.textContent = dsaStats.easy;
    if (medEl) medEl.textContent = dsaStats.medium;
    if (hardEl) hardEl.textContent = dsaStats.hard;
    if (totalEl) totalEl.textContent = dsaStats.total;

    // DSA Topic Breakdown Bars
    const topicContainer = document.getElementById('dsa-topic-list');
    if (topicContainer && dsaStats.topics) {
      topicContainer.innerHTML = dsaStats.topics.map(t => {
        const pct = Math.round((t.solved / t.total) * 100);
        return `
          <div class="dsa-topic-card">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600;">
              <span>${t.name}</span>
              <span style="color: var(--text-muted);">${t.solved} / ${t.total} (${pct}%)</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${pct}%; background: var(--primary);"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Applications Pipeline Kanban
    const appContainer = document.getElementById('placements-kanban');
    if (appContainer) {
      const stages = [
        { id: 'wishlist', title: 'Wishlist' },
        { id: 'applied', title: 'Applied' },
        { id: 'assessment', title: 'Online Assessment' },
        { id: 'interview', title: 'Interviews' },
        { id: 'offer', title: 'Offers' },
        { id: 'rejected', title: 'Archived' }
      ];

      appContainer.innerHTML = `
        <div class="kanban-board" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
          ${stages.map(st => {
            const items = data.placements.applications.filter(a => a.status === st.id);
            return `
              <div class="kanban-column">
                <div class="kanban-col-header">
                  <span>${st.title}</span>
                  <span class="kanban-col-count">${items.length}</span>
                </div>
                <div class="kanban-cards-area">
                  ${items.map(app => `
                    <div class="kanban-card">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <strong style="font-size: 1rem; color: var(--text-primary);">${app.company}</strong>
                        <span class="badge ${st.id === 'offer' ? 'badge-success' : st.id === 'interview' ? 'badge-warning' : 'badge-subtle'}">${app.compensation}</span>
                      </div>
                      <div style="font-size: 0.82rem; color: var(--text-secondary);">${app.role}</div>
                      ${app.currentRound ? `
                        <div style="background: var(--bg-input); padding: 0.45rem; border-radius: var(--radius-sm); font-size: 0.75rem; color: var(--primary);">
                          📍 ${app.currentRound}
                        </div>
                      ` : ''}
                      ${app.nextDate ? `<div style="font-size: 0.75rem; color: var(--warning);">🕒 Next: ${this.calc.formatDate(app.nextDate, true)}</div>` : ''}
                      <div class="kanban-card-footer">
                        <span>${app.location}</span>
                        <div style="display: flex; gap: 0.35rem;">
                          <button class="icon-btn" style="width: 22px; height: 22px;" title="Advance Stage" onclick="collegeApp.advancePlacementStage('${app.id}', '${st.id}')">
                            →
                          </button>
                          <button class="icon-btn" style="width: 22px; height: 22px;" title="Delete" onclick="collegeApp.deletePlacementApplication('${app.id}')">
                            ${this.icons.get('trash', '', 12)}
                          </button>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // Links Vault
    const links = data.placements.links || {};
    const resumeBtn = document.getElementById('vault-resume-link');
    const ghBtn = document.getElementById('vault-github-link');
    const lcBtn = document.getElementById('vault-leetcode-link');
    const liBtn = document.getElementById('vault-linkedin-link');

    if (resumeBtn) resumeBtn.href = links.resumeUrl || '#';
    if (ghBtn) ghBtn.href = links.githubUrl || '#';
    if (lcBtn) lcBtn.href = links.leetcodeUrl || '#';
    if (liBtn) liBtn.href = links.linkedinUrl || '#';
  }

  advancePlacementStage(id, current) {
    const pipeline = ['wishlist', 'applied', 'assessment', 'interview', 'offer'];
    const idx = pipeline.indexOf(current);
    if (idx !== -1 && idx < pipeline.length - 1) {
      const next = pipeline[idx + 1];
      this.store.updatePlacementStatus(id, next);
      if (this.store.get().settings.soundEnabled) {
        this.audio.playChime(next === 'offer' ? 'success' : 'pop');
      }
      this.showToast(`Advanced to ${next.toUpperCase()}`);
    }
  }

  deletePlacementApplication(id) {
    if (confirm('Delete this application record?')) {
      this.store.deletePlacementApplication(id);
      this.showToast('Application record removed');
    }
  }

  // --- View: Focus & Pomodoro ---
  setupPomodoro() {
    this.updatePomodoroDisplay();
  }

  renderFocus() {
    this.updatePomodoroDisplay();
    const data = this.store.get();

    const todayMinsEl = document.getElementById('focus-today-minutes');
    const streakEl = document.getElementById('focus-streak-days');
    const completedEl = document.getElementById('focus-completed-count');

    if (todayMinsEl) todayMinsEl.textContent = `${data.focusSessions.todayMinutes}m`;
    if (streakEl) streakEl.textContent = `${data.focusSessions.streakDays} days`;
    if (completedEl) completedEl.textContent = data.focusSessions.completedPomodoros;

    const logContainer = document.getElementById('focus-sessions-log');
    if (logContainer) {
      logContainer.innerHTML = data.focusSessions.sessions.map(s => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0; border-bottom: 1px solid var(--border-subtle); font-size: 0.85rem;">
          <div>
            <strong>${s.tag}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${s.note || 'Focus sprint'}</div>
          </div>
          <div style="text-align: right;">
            <span class="badge badge-primary">${s.minutes} mins</span>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">${s.date}</div>
          </div>
        </div>
      `).join('');
    }
  }

  setPomodoroMode(mode) {
    this.pomodoro.mode = mode;
    this.pomodoro.timeLeft = this.pomodoro.durationMap[mode];
    this.pausePomodoro();
    this.updatePomodoroDisplay();

    document.querySelectorAll('.pomo-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-pomo-mode') === mode);
    });
  }

  togglePomodoro() {
    if (this.pomodoro.isRunning) {
      this.pausePomodoro();
    } else {
      this.startPomodoro();
    }
  }

  startPomodoro() {
    if (this.pomodoro.isRunning) return;
    this.pomodoro.isRunning = true;
    this.audio.init();

    const btn = document.getElementById('pomo-play-btn');
    if (btn) btn.innerHTML = `${this.icons.get('pause')} Pause`;

    this.pomodoro.intervalId = setInterval(() => {
      if (this.pomodoro.timeLeft > 0) {
        this.pomodoro.timeLeft--;
        this.updatePomodoroDisplay();
      } else {
        this.handlePomodoroComplete();
      }
    }, 1000);

    this.updateHeaderPill();
  }

  pausePomodoro() {
    this.pomodoro.isRunning = false;
    if (this.pomodoro.intervalId) {
      clearInterval(this.pomodoro.intervalId);
      this.pomodoro.intervalId = null;
    }
    const btn = document.getElementById('pomo-play-btn');
    if (btn) btn.innerHTML = `${this.icons.get('play')} Start`;
    this.updateHeaderPill();
  }

  resetPomodoro() {
    this.pausePomodoro();
    this.pomodoro.timeLeft = this.pomodoro.durationMap[this.pomodoro.mode];
    this.updatePomodoroDisplay();
  }

  handlePomodoroComplete() {
    this.pausePomodoro();
    this.audio.playChime('bell');

    if (this.pomodoro.mode === 'work') {
      this.store.logFocusSession(25, 'Pomodoro Session', 'Deep work sprint completed');
      this.showToast('🎉 Focus Sprint Finished! Great work. Time for a break.');
      this.setPomodoroMode('shortBreak');
    } else {
      this.showToast('Break ended! Ready to dive back in?');
      this.setPomodoroMode('work');
    }
  }

  updatePomodoroDisplay() {
    const mins = Math.floor(this.pomodoro.timeLeft / 60);
    const secs = this.pomodoro.timeLeft % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const mainDisplay = document.getElementById('pomodoro-main-display');
    if (mainDisplay) mainDisplay.textContent = timeStr;

    this.updateHeaderPill();
  }

  updateHeaderPill() {
    const pillText = document.getElementById('header-pomo-text');
    const pulseDot = document.getElementById('header-pomo-pulse');
    const mins = Math.floor(this.pomodoro.timeLeft / 60);
    const secs = this.pomodoro.timeLeft % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (pillText) {
      pillText.textContent = `${this.pomodoro.isRunning ? 'Focusing' : 'Focus'}: ${timeStr}`;
    }
    if (pulseDot) {
      if (this.pomodoro.isRunning) {
        pulseDot.classList.remove('paused');
      } else {
        pulseDot.classList.add('paused');
      }
    }
  }

  // Ambient Audio Controls
  toggleAmbient(type) {
    if (this.audio.currentAmbient === type) {
      this.audio.stopAmbient();
      document.querySelectorAll('.ambient-btn').forEach(b => b.classList.remove('active'));
      this.showToast('Ambient audio stopped');
    } else {
      this.audio.startAmbient(type, 0.35);
      document.querySelectorAll('.ambient-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-ambient') === type);
      });
      this.showToast(`Playing ${type} ambient background`);
    }
  }

  // --- View: Scratchpad ---
  setupScratchpad() {
    const pad = document.getElementById('scratchpad-textarea');
    if (pad) {
      pad.value = this.store.get().scratchpad.content;
      pad.addEventListener('input', () => {
        this.store.saveScratchpad(pad.value);
      });
    }
  }

  // --- View: Settings & Data Management ---
  renderSettings() {
    const data = this.store.get();

    const nameInput = document.getElementById('settings-profile-name');
    const collegeInput = document.getElementById('settings-profile-college');
    const degreeInput = document.getElementById('settings-profile-degree');
    const semInput = document.getElementById('settings-profile-sem');
    const rollInput = document.getElementById('settings-profile-roll');
    const targetAttInput = document.getElementById('settings-target-attendance');
    const targetCgpaInput = document.getElementById('settings-target-cgpa');

    if (nameInput) nameInput.value = data.profile.name || '';
    if (collegeInput) collegeInput.value = data.profile.college || '';
    if (degreeInput) degreeInput.value = data.profile.degree || '';
    if (semInput) semInput.value = data.profile.semester || 1;
    if (rollInput) rollInput.value = data.profile.rollNo || '';
    if (targetAttInput) targetAttInput.value = data.profile.targetAttendance || 75;
    if (targetCgpaInput) targetCgpaInput.value = data.profile.targetCgpa || 8.5;
  }

  saveProfileSettings() {
    const name = document.getElementById('settings-profile-name')?.value;
    const college = document.getElementById('settings-profile-college')?.value;
    const degree = document.getElementById('settings-profile-degree')?.value;
    const sem = parseInt(document.getElementById('settings-profile-sem')?.value, 10) || 1;
    const rollNo = document.getElementById('settings-profile-roll')?.value;
    const targetAttendance = parseInt(document.getElementById('settings-target-attendance')?.value, 10) || 75;
    const targetCgpa = parseFloat(document.getElementById('settings-target-cgpa')?.value) || 8.5;

    this.store.updateProfile({
      name, college, degree, semester: sem, rollNo, targetAttendance, targetCgpa
    });

    this.showToast('Profile updated successfully!');
  }

  exportDataBackup() {
    const jsonStr = this.store.exportJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `college_os_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Backup JSON exported');
  }

  importDataBackup(fileInput) {
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = this.store.importJson(e.target.result);
      if (result.success) {
        this.showToast('Backup restored successfully!');
        this.renderCurrentView();
      } else {
        alert('Failed to import backup: ' + result.error);
      }
    };
    reader.readAsText(file);
  }

  restoreDefaultDemoData() {
    if (confirm('Reset to standard student demo data (CSE 5th Sem)? Any custom unsaved changes will be overwritten.')) {
      this.store.resetToDefault();
      this.showToast('Restored default demo student profile');
      this.renderCurrentView();
    }
  }

  clearAllStudentData() {
    if (confirm('CAUTION: Are you sure you want to clear ALL courses, timetable, attendance, and tasks?')) {
      this.store.clearAllData();
      this.showToast('All local data cleared');
      this.renderCurrentView();
    }
  }

  // --- Command Palette (Cmd+K) ---
  setupCommandPalette() {
    const modal = document.getElementById('command-palette-modal');
    const input = document.getElementById('command-palette-input');
    const list = document.getElementById('command-palette-results');
    const triggerBtn = document.getElementById('command-palette-trigger');

    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => this.openCommandPalette());
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeCommandPalette();
      });
    }

    if (input) {
      input.addEventListener('input', () => {
        this.filterCommandPalette(input.value);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeCommandPalette();
        } else if (e.key === 'Enter') {
          const selected = list?.querySelector('.command-item.selected') || list?.querySelector('.command-item');
          if (selected) {
            selected.click();
          }
        }
      });
    }
  }

  openCommandPalette() {
    const modal = document.getElementById('command-palette-modal');
    const input = document.getElementById('command-palette-input');
    if (modal && input) {
      modal.classList.add('active');
      input.value = '';
      this.filterCommandPalette('');
      setTimeout(() => input.focus(), 50);
    }
  }

  closeCommandPalette() {
    const modal = document.getElementById('command-palette-modal');
    if (modal) modal.classList.remove('active');
  }

  filterCommandPalette(query = '') {
    const list = document.getElementById('command-palette-results');
    if (!list) return;

    const data = this.store.get();
    const q = query.toLowerCase().trim();

    const actions = [
      { title: 'Go to Dashboard', icon: 'dashboard', category: 'Navigation', action: () => this.navigateTo('dashboard') },
      { title: 'View Timetable', icon: 'timetable', category: 'Navigation', action: () => this.navigateTo('timetable') },
      { title: 'Check Attendance & Bunk Predictor', icon: 'attendance', category: 'Navigation', action: () => this.navigateTo('attendance') },
      { title: 'Academics & CGPA Planner', icon: 'academics', category: 'Navigation', action: () => this.navigateTo('academics') },
      { title: 'Assignments & Task Kanban', icon: 'assignments', category: 'Navigation', action: () => this.navigateTo('assignments') },
      { title: 'Exams & Test Schedule', icon: 'exams', category: 'Navigation', action: () => this.navigateTo('exams') },
      { title: 'Placement & Career Pipeline', icon: 'placements', category: 'Navigation', action: () => this.navigateTo('placements') },
      { title: 'Start Focus Pomodoro', icon: 'focus', category: 'Focus', action: () => { this.navigateTo('focus'); this.startPomodoro(); } },
      { title: 'Add New Subject', icon: 'plus', category: 'Action', action: () => this.openAddSubjectModal() },
      { title: 'Add New Assignment', icon: 'plus', category: 'Action', action: () => this.openAddAssignmentModal() },
      { title: 'Add Timetable Class', icon: 'plus', category: 'Action', action: () => this.openAddTimetableSlotModal(this.selectedTimetableDay) },
      { title: 'Add Placement Application', icon: 'plus', category: 'Action', action: () => this.openAddPlacementModal() },
      { title: 'Toggle Theme (Dark / Light)', icon: 'sun', category: 'Settings', action: () => this.toggleTheme() },
      { title: 'Export JSON Backup', icon: 'download', category: 'Settings', action: () => this.exportDataBackup() }
    ];

    // Add courses to search list
    data.subjects.forEach(s => {
      actions.push({
        title: `Course: ${s.name} (${s.code})`,
        icon: 'attendance',
        category: 'Courses',
        action: () => { this.navigateTo('attendance'); }
      });
    });

    const filtered = actions.filter(a => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));

    if (!filtered.length) {
      list.innerHTML = `<div style="padding:1.5rem; text-align:center; color:var(--text-muted);">No matching commands or pages found.</div>`;
      return;
    }

    list.innerHTML = filtered.map((item, idx) => `
      <div class="command-item ${idx === 0 ? 'selected' : ''}" data-idx="${idx}">
        <div class="command-item-left">
          ${this.icons.get(item.icon, '', 16)}
          <span>${item.title}</span>
        </div>
        <span class="badge badge-subtle" style="font-size:0.65rem;">${item.category}</span>
      </div>
    `).join('');

    // Attach click handlers
    list.querySelectorAll('.command-item').forEach((el, idx) => {
      el.addEventListener('click', () => {
        this.closeCommandPalette();
        filtered[idx].action();
      });
    });
  }

  // --- Global Keyboard Shortcuts ---
  setupGlobalKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K => Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openCommandPalette();
        return;
      }

      // Ignore single key shortcuts if typing in input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      // Number keys 1-8 for quick navigation
      if (e.key === '1') this.navigateTo('dashboard');
      if (e.key === '2') this.navigateTo('timetable');
      if (e.key === '3') this.navigateTo('attendance');
      if (e.key === '4') this.navigateTo('academics');
      if (e.key === '5') this.navigateTo('assignments');
      if (e.key === '6') this.navigateTo('exams');
      if (e.key === '7') this.navigateTo('placements');
      if (e.key === '8') this.navigateTo('focus');
      if (e.key === '?') this.openShortcutsModal();
    });
  }

  // --- Modals Setup & Handlers ---
  setupModals() {
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    });
  }

  openShortcutsModal() {
    const m = document.getElementById('modal-shortcuts');
    if (m) m.classList.add('active');
  }

  openAddSubjectModal() {
    const m = document.getElementById('modal-add-subject');
    if (m) m.classList.add('active');
  }

  submitAddSubject(e) {
    e.preventDefault();
    const code = document.getElementById('sub-code-input').value;
    const name = document.getElementById('sub-name-input').value;
    const instructor = document.getElementById('sub-instructor-input').value;
    const credits = document.getElementById('sub-credits-input').value;
    const target = document.getElementById('sub-target-input').value;
    const color = document.getElementById('sub-color-input').value;
    const present = document.getElementById('sub-present-input').value;
    const total = document.getElementById('sub-total-input').value;

    this.store.addSubject({
      code, name, instructor, credits, targetAttendance: target, color, present, total
    });

    document.getElementById('modal-add-subject').classList.remove('active');
    document.getElementById('form-add-subject').reset();
    this.showToast(`Subject "${name}" added`);
  }

  openBulkThresholdModal() {
    const current = this.store.get().profile.targetAttendance || 75;
    const newTarget = prompt('Set target attendance percentage for ALL courses (e.g., 75, 80, 85):', current);
    if (newTarget !== null) {
      const val = parseInt(newTarget, 10);
      if (!isNaN(val) && val >= 50 && val <= 100) {
        this.store.update(data => {
          data.profile.targetAttendance = val;
          data.subjects.forEach(s => { s.targetAttendance = val; });
        });
        this.showToast(`Updated target attendance to ${val}% for all courses`);
      } else {
        alert('Please enter a valid number between 50 and 100.');
      }
    }
  }

  openEditAttendanceModal(subjectId) {
    const sub = this.store.get().subjects.find(s => s.id === subjectId);
    if (!sub) return;

    const modal = document.getElementById('modal-edit-attendance');
    if (!modal) return;

    document.getElementById('edit-att-sub-id').value = sub.id;
    document.getElementById('edit-att-title').textContent = `Adjust: ${sub.name}`;
    document.getElementById('edit-att-present').value = sub.attendance.present;
    document.getElementById('edit-att-total').value = sub.attendance.total;
    document.getElementById('edit-att-target').value = sub.targetAttendance;

    modal.classList.add('active');
  }

  submitEditAttendance(e) {
    e.preventDefault();
    const id = document.getElementById('edit-att-sub-id').value;
    const present = document.getElementById('edit-att-present').value;
    const total = document.getElementById('edit-att-total').value;
    const target = document.getElementById('edit-att-target').value;

    this.store.setSubjectAttendance(id, present, total, target);
    document.getElementById('modal-edit-attendance').classList.remove('active');
    this.showToast('Attendance records updated');
  }

  openAddTimetableSlotModal(defaultDay = 1) {
    const data = this.store.get();
    const subSelect = document.getElementById('tt-subject-select');
    if (subSelect) {
      subSelect.innerHTML = data.subjects.map(s => `<option value="${s.id}">${s.name} (${s.code})</option>`).join('');
    }
    const daySelect = document.getElementById('tt-day-select');
    if (daySelect) daySelect.value = defaultDay;

    const m = document.getElementById('modal-add-timetable');
    if (m) m.classList.add('active');
  }

  submitAddTimetableSlot(e) {
    e.preventDefault();
    const day = document.getElementById('tt-day-select').value;
    const subjectId = document.getElementById('tt-subject-select').value;
    const startTime = document.getElementById('tt-start-time').value;
    const endTime = document.getElementById('tt-end-time').value;
    const room = document.getElementById('tt-room-input').value;
    const type = document.getElementById('tt-type-select').value;

    this.store.addTimetableSlot({ day, subjectId, startTime, endTime, room, type });
    document.getElementById('modal-add-timetable').classList.remove('active');
    document.getElementById('form-add-timetable').reset();
    this.showToast('Class slot scheduled');
  }

  openAddAssignmentModal() {
    const data = this.store.get();
    const subSelect = document.getElementById('asg-subject-select');
    if (subSelect) {
      subSelect.innerHTML = data.subjects.map(s => `<option value="${s.id}">${s.name} (${s.code})</option>`).join('');
    }
    const m = document.getElementById('modal-add-assignment');
    if (m) m.classList.add('active');
  }

  submitAddAssignment(e) {
    e.preventDefault();
    const title = document.getElementById('asg-title-input').value;
    const subjectId = document.getElementById('asg-subject-select').value;
    const dueDate = document.getElementById('asg-due-input').value;
    const priority = document.getElementById('asg-priority-select').value;
    const marks = document.getElementById('asg-marks-input').value;
    const description = document.getElementById('asg-desc-input').value;

    this.store.addAssignment({ title, subjectId, dueDate, priority, marks, description });
    document.getElementById('modal-add-assignment').classList.remove('active');
    document.getElementById('form-add-assignment').reset();
    this.showToast('Assignment added to board');
  }

  openAddExamModal() {
    const data = this.store.get();
    const subSelect = document.getElementById('exam-subject-select');
    if (subSelect) {
      subSelect.innerHTML = data.subjects.map(s => `<option value="${s.id}">${s.name} (${s.code})</option>`).join('');
    }
    const m = document.getElementById('modal-add-exam');
    if (m) m.classList.add('active');
  }

  submitAddExam(e) {
    e.preventDefault();
    const subjectId = document.getElementById('exam-subject-select').value;
    const title = document.getElementById('exam-title-input').value;
    const date = document.getElementById('exam-date-input').value;
    const durationMinutes = document.getElementById('exam-duration-input').value;
    const weightage = document.getElementById('exam-weightage-input').value;
    const room = document.getElementById('exam-room-input').value;
    const targetScore = document.getElementById('exam-target-input').value;
    const topicsStr = document.getElementById('exam-topics-input').value;
    const topics = topicsStr ? topicsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    this.store.addExam({ subjectId, title, date, durationMinutes, weightage, room, targetScore, topics });
    document.getElementById('modal-add-exam').classList.remove('active');
    document.getElementById('form-add-exam').reset();
    this.showToast('Exam added to schedule');
  }

  openAddPlacementModal() {
    const m = document.getElementById('modal-add-placement');
    if (m) m.classList.add('active');
  }

  submitAddPlacement(e) {
    e.preventDefault();
    const company = document.getElementById('place-company-input').value;
    const role = document.getElementById('place-role-input').value;
    const compensation = document.getElementById('place-comp-input').value;
    const location = document.getElementById('place-loc-input').value;
    const status = document.getElementById('place-status-select').value;
    const currentRound = document.getElementById('place-round-input').value;
    const notes = document.getElementById('place-notes-input').value;

    this.store.addPlacementApplication({ company, role, compensation, location, status, currentRound, notes });
    document.getElementById('modal-add-placement').classList.remove('active');
    document.getElementById('form-add-placement').reset();
    this.showToast(`Application for ${company} recorded`);
  }

  // --- Toast Notifications ---
  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${this.icons.get('check', '', 14)}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2800);
  }
}
