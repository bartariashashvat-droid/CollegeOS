# 🎓 CollegeOS — Student Productivity & College Management Dashboard

> An all-in-one student productivity SaaS that helps students manage academics, attendance, assignments, exams, timetable, and placement preparation from a single interface.

Built using **pure HTML5, CSS3, JavaScript (ES6+), and LocalStorage**. Zero runtime build dependencies, zero node_modules, 100% cloud-free and private by default.

---

## 🚀 Instant Launch

You can open and run CollegeOS immediately:

### Option 1: Direct Browser Launch
Simply double-click or open `index.html` in any modern web browser:
```bash
open /Users/shashvatbartaria/DEVELOP/CollegeOS/index.html
```

### Option 2: Local HTTP Server (Recommended)
```bash
cd /Users/shashvatbartaria/DEVELOP/CollegeOS
python3 -m http.server 8080
# Visit http://localhost:8080 in your browser
```

---

## ⚡ Core SaaS Modules & Features

### 1. 📊 Executive Dashboard
- **Live Next-Class Radar**: Automatically matches current day and time against your timetable to show your next upcoming or live lecture, room number, instructor, and one-click attendance check-in.
- **Attendance Health Widget**: Real-time aggregated attendance percentage across all subjects with critical shortage warning alerts (< 75%).
- **Cumulative CGPA vs Target**: Live progress toward your graduation CGPA goal.
- **Deadlines & Exams Countdown**: Urgent upcoming assignments and test dates with relative countdown badges (`in 4 hours`, `Tomorrow`).

### 2. 📅 Interactive Timetable & Schedule Hub
- Full Monday to Saturday schedule breakdown.
- Session type tagging: **Lecture**, **Lab**, **Tutorial**, **Seminar**.
- Direct **Present / Absent** logging straight from the timetable card.
- Conflict detection and custom time-slot addition.

### 3. 🎯 Smart Attendance & Bunk Predictor
- Course-by-course attendance counters (attended vs conducted).
- **Exact Bunk Math Engine**:
  - *If above target (e.g. > 75%)*: Calculates exact number of classes you can safely bunk without dropping below threshold.
  - *If in shortage (< 75%)*: Calculates exact number of consecutive classes you MUST attend without missing to recover back to target.
- One-click quick log: `+ Present`, `+ Absent`, `Class Cancelled`, and `Undo Last`.
- Projections: Live preview of what your percentage will be if you attend or miss the next class.

### 4. 📈 Academics & CGPA Planner
- **Target CGPA Simulator**: Real-time interactive slider that calculates the exact average SGPA you need to achieve across remaining degree credits to hit your goal.
- **Semester History**: Full breakdown of Semesters 1 to 5 with course credits, grades (O, A+, A, etc.), and SGPA tracking.
- **Syllabus Coverage Tracker**: Module-by-module syllabus checklist with completion percentage bar per course.

### 5. 📋 Assignments & Tasks Hub
- **Kanban Board**: Drag-and-drop workflow across 4 columns:
  - *To Do*
  - *In Progress*
  - *Submitted*
  - *Graded & Done*
- Dual View toggle: **Kanban Board** or **Compact Table/List View**.
- Priority tags: *Urgent 🔥*, *High*, *Medium*, *Low*.
- Due date countdowns and max marks / weightage tracker.

### 6. 📝 Exams & Tests Calendar
- Mid-terms, finals, quizzes, and practicals.
- Revision topics checklist per exam.
- Weightage percentage and target score tracker.

### 7. 💼 Placement & Career Accelerator
- **Application Pipeline Kanban**: Track recruitment status across *Wishlist*, *Applied*, *Online Assessment (OA)*, *Technical Interviews*, and *Offers Received*.
- Company compensation / CTC tags (e.g. `₹42 LPA`), locations, and interview round notes.
- **DSA & Problem Solving Tracker**:
  - LeetCode / Coding stats counters: *Easy*, *Medium*, *Hard*, and *Total Solved*.
  - Topic-wise progress bars: Arrays & Hashing, Two Pointers, Stack, Binary Search, Trees, Graphs, DP, System Design.
- **Quick Links Vault**: One-click access to your Resume Drive link, LeetCode profile, GitHub, and Portfolio.

### 8. ⏱️ Focus & Deep Work Mode
- Built-in **Pomodoro Timer** (Deep Work: 25m, Short Break: 5m, Long Break: 15m).
- **Zero-Dependency Procedural Audio Synthesizer**: Pure Web Audio API ambient sound generator:
  - 🌧️ *Gentle Rain*
  - 🌊 *Brown Noise Focus*
  - ☕ *Cafe Hum*
- Notification chimes on session completion.
- Quick Scratchpad for rapid markdown sprint notes and algorithm edge-cases with auto-save.

### 9. 💾 Data Management & LocalStorage
- **100% Private**: All data is stored locally on your device (`localStorage`).
- **1-Click Demo Data**: Preloaded with a realistic 3rd Year CSE student profile with 6 courses, timetable, assignments, exams, and placement applications.
- **JSON Backup & Restore**: Export full JSON backup or import to sync across browsers.

---

## ⌨️ Power-User Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘ K` or `Ctrl K` | Open Global Command Palette |
| `1` | Jump to **Dashboard** |
| `2` | Jump to **Timetable** |
| `3` | Jump to **Attendance & Bunks** |
| `4` | Jump to **Academics & CGPA** |
| `5` | Jump to **Assignments Kanban** |
| `6` | Jump to **Exams Schedule** |
| `7` | Jump to **Placements & Career** |
| `8` | Jump to **Focus & Pomodoro** |
| `?` | Show Keyboard Shortcuts Modal |
| `ESC` | Close any active modal / command palette |

---

## 📂 Project Architecture

```
/Users/shashvatbartaria/DEVELOP/CollegeOS/
├── index.html            # Main application shell & modular view containers
├── css/
│   ├── main.css          # Design system tokens, dark/light themes, typography, layout
│   ├── components.css    # Metric cards, Kanban, attendance cards, bunk banner, modals
│   └── responsive.css    # Fluid layout for Mobile bottom nav, Tablets, Desktop & Print
├── js/
│   ├── store.js          # LocalStorage reactive store, CRUD APIs, demo dataset, JSON backup
│   ├── calculator.js     # Mathematical bunk algorithms, SGPA/CGPA simulator, time math
│   ├── audio.js          # Procedural Web Audio API ambient noise generator & chimes
│   ├── icons.js          # Retina-sharp inline SVG icons registry
│   └── app.js            # Main application bootstrap, view routing, drag & drop, event bus
└── README.md             # Documentation and usage guide
```
