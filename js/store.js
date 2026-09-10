/**
 * CollegeOS - LocalStorage Store & State Management
 * Handles persistent student state, reactive subscribers, demo datasets, and backups.
 */

const STORAGE_KEY = 'college_os_v1_data';
const THEME_KEY = 'college_os_theme';

// Default Comprehensive Demo Dataset
const DEFAULT_STUDENT_DATA = {
  profile: {
    name: 'Shashvat Bartaria',
    college: 'Apex Institute of Technology',
    degree: 'B.Tech - Computer Science & Engineering',
    semester: 5,
    rollNo: 'CS22B1048',
    targetAttendance: 75,
    targetCgpa: 8.8,
    avatarUrl: ''
  },
  settings: {
    theme: 'dark',
    soundEnabled: true,
    compactView: false,
    defaultThreshold: 75,
    currencySymbol: '₹'
  },
  subjects: [
    {
      id: 'sub_1',
      code: 'CS501',
      name: 'Design & Analysis of Algorithms',
      instructor: 'Dr. Aris Vance',
      credits: 4,
      color: '#6366f1', // Indigo
      targetAttendance: 75,
      attendance: {
        present: 24,
        total: 28,
        history: [
          { date: '2026-09-08', status: 'present', note: 'DP & Memoization lecture' },
          { date: '2026-09-06', status: 'present', note: 'Greedy algorithms recap' },
          { date: '2026-09-04', status: 'absent', note: 'Sick leave' },
          { date: '2026-09-02', status: 'present', note: 'Graph traversals' }
        ]
      },
      syllabus: [
        { unit: 1, title: 'Divide and Conquer & Recurrences', done: true },
        { unit: 2, title: 'Greedy Algorithms & Matroids', done: true },
        { unit: 3, title: 'Dynamic Programming (Knapsack, LCS)', done: true },
        { unit: 4, title: 'Graph Algorithms & Max Flow', done: false },
        { unit: 5, title: 'NP-Completeness & Approximation', done: false }
      ]
    },
    {
      id: 'sub_2',
      code: 'CS502',
      name: 'Operating Systems & Kernels',
      instructor: 'Prof. Elena Rostova',
      credits: 4,
      color: '#06b6d4', // Cyan
      targetAttendance: 75,
      attendance: {
        present: 19,
        total: 27, // 70.37% (Shortage alert!)
        history: [
          { date: '2026-09-09', status: 'present', note: 'Paging & Virtual Memory' },
          { date: '2026-09-07', status: 'absent', note: 'Hackathon travel' },
          { date: '2026-09-05', status: 'absent', note: 'Overlooked morning slot' },
          { date: '2026-09-03', status: 'present', note: 'Deadlocks and Banker algo' }
        ]
      },
      syllabus: [
        { unit: 1, title: 'Process Management & Threads', done: true },
        { unit: 2, title: 'CPU Scheduling & Synchronization', done: true },
        { unit: 3, title: 'Deadlock Handling & Prevention', done: true },
        { unit: 4, title: 'Memory Management & Virtual Memory', done: false },
        { unit: 5, title: 'File Systems & I/O Subsystems', done: false }
      ]
    },
    {
      id: 'sub_3',
      code: 'CS503',
      name: 'Database Management Systems',
      instructor: 'Dr. Michael Chen',
      credits: 3,
      color: '#10b981', // Emerald
      targetAttendance: 75,
      attendance: {
        present: 22,
        total: 24, // 91.6% (Safe!)
        history: [
          { date: '2026-09-08', status: 'present', note: 'B+ Trees and Indexing' },
          { date: '2026-09-05', status: 'present', note: 'ACID properties and Concurrency' },
          { date: '2026-09-01', status: 'present', note: 'Normal Forms 3NF/BCNF' }
        ]
      },
      syllabus: [
        { unit: 1, title: 'Relational Model & Relational Algebra', done: true },
        { unit: 2, title: 'SQL & Advanced Query Optimization', done: true },
        { unit: 3, title: 'Normalization & Dependencies', done: true },
        { unit: 4, title: 'Transaction Processing & Isolation', done: false },
        { unit: 5, title: 'NoSQL Databases & Sharding', done: false }
      ]
    },
    {
      id: 'sub_4',
      code: 'CS504',
      name: 'Computer Networks',
      instructor: 'Prof. Sarah Jenkins',
      credits: 3,
      color: '#f59e0b', // Amber
      targetAttendance: 75,
      attendance: {
        present: 18,
        total: 22, // 81.8%
        history: [
          { date: '2026-09-09', status: 'present', note: 'TCP Congestion Control' },
          { date: '2026-09-07', status: 'present', note: 'Routing Protocols OSPF/BGP' },
          { date: '2026-09-03', status: 'absent', note: 'Placement workshop' }
        ]
      },
      syllabus: [
        { unit: 1, title: 'OSI/TCP-IP Reference Models', done: true },
        { unit: 2, title: 'Data Link Layer & Error Correction', done: true },
        { unit: 3, title: 'Network Layer & IP Addressing', done: true },
        { unit: 4, title: 'Transport Layer (TCP, UDP, Flow Control)', done: false },
        { unit: 5, title: 'Application Layer (DNS, HTTP/3, TLS)', done: false }
      ]
    },
    {
      id: 'sub_5',
      code: 'CS505',
      name: 'Artificial Intelligence & ML',
      instructor: 'Dr. Devika Rao',
      credits: 4,
      color: '#ec4899', // Pink
      targetAttendance: 75,
      attendance: {
        present: 26,
        total: 30, // 86.6%
        history: [
          { date: '2026-09-10', status: 'present', note: 'Neural Networks & Backprop' },
          { date: '2026-09-08', status: 'present', note: 'SVM & Decision Trees' },
          { date: '2026-09-04', status: 'present', note: 'Search Algorithms A* and Minimax' }
        ]
      },
      syllabus: [
        { unit: 1, title: 'Intelligent Agents & Problem Solving', done: true },
        { unit: 2, title: 'Informed & Adversarial Search', done: true },
        { unit: 3, title: 'Supervised Learning Algorithms', done: true },
        { unit: 4, title: 'Deep Learning & Neural Architectures', done: false },
        { unit: 5, title: 'Reinforcement Learning Basics', done: false }
      ]
    },
    {
      id: 'sub_6',
      code: 'CS506',
      name: 'Full-Stack Web Engineering Lab',
      instructor: 'Er. Rohan Mehta',
      credits: 2,
      color: '#8b5cf6', // Purple
      targetAttendance: 80,
      attendance: {
        present: 11,
        total: 12, // 91.6%
        history: [
          { date: '2026-09-09', status: 'present', note: 'RESTful API & JWT Auth Lab' },
          { date: '2026-09-02', status: 'present', note: 'Frontend State Architecture' }
        ]
      },
      syllabus: [
        { unit: 1, title: 'Modern JavaScript & Async Patterns', done: true },
        { unit: 2, title: 'Backend REST API Architecture', done: true },
        { unit: 3, title: 'Database Integration & ORM', done: true },
        { unit: 4, title: 'WebSockets & Realtime Systems', done: false }
      ]
    }
  ],
  timetable: [
    // Monday
    { id: 'tt_1', day: 1, subjectId: 'sub_1', startTime: '09:00', endTime: '10:00', room: 'LH-302', type: 'Lecture' },
    { id: 'tt_2', day: 1, subjectId: 'sub_2', startTime: '10:00', endTime: '11:00', room: 'LH-302', type: 'Lecture' },
    { id: 'tt_3', day: 1, subjectId: 'sub_4', startTime: '11:15', endTime: '12:15', room: 'LH-104', type: 'Lecture' },
    { id: 'tt_4', day: 1, subjectId: 'sub_6', startTime: '13:30', endTime: '15:30', room: 'Comp Lab 3', type: 'Lab' },

    // Tuesday
    { id: 'tt_5', day: 2, subjectId: 'sub_3', startTime: '09:00', endTime: '10:00', room: 'LH-201', type: 'Lecture' },
    { id: 'tt_6', day: 2, subjectId: 'sub_5', startTime: '10:00', endTime: '11:00', room: 'LH-201', type: 'Lecture' },
    { id: 'tt_7', day: 2, subjectId: 'sub_1', startTime: '11:15', endTime: '12:15', room: 'LH-302', type: 'Lecture' },
    { id: 'tt_8', day: 2, subjectId: 'sub_2', startTime: '14:00', endTime: '15:00', room: 'LH-302', type: 'Tutorial' },

    // Wednesday
    { id: 'tt_9', day: 3, subjectId: 'sub_4', startTime: '09:00', endTime: '10:00', room: 'LH-104', type: 'Lecture' },
    { id: 'tt_10', day: 3, subjectId: 'sub_2', startTime: '10:00', endTime: '11:00', room: 'LH-302', type: 'Lecture' },
    { id: 'tt_11', day: 3, subjectId: 'sub_3', startTime: '11:15', endTime: '12:15', room: 'LH-201', type: 'Lecture' },
    { id: 'tt_12', day: 3, subjectId: 'sub_5', startTime: '13:30', endTime: '15:30', room: 'AI Research Lab', type: 'Lab' },

    // Thursday
    { id: 'tt_13', day: 4, subjectId: 'sub_5', startTime: '09:00', endTime: '10:00', room: 'LH-201', type: 'Lecture' },
    { id: 'tt_14', day: 4, subjectId: 'sub_1', startTime: '10:00', endTime: '11:00', room: 'LH-302', type: 'Lecture' },
    { id: 'tt_15', day: 4, subjectId: 'sub_3', startTime: '11:15', endTime: '12:15', room: 'LH-201', type: 'Lecture' },
    { id: 'tt_16', day: 4, subjectId: 'sub_4', startTime: '14:00', endTime: '15:00', room: 'Networks Lab', type: 'Tutorial' },

    // Friday
    { id: 'tt_17', day: 5, subjectId: 'sub_2', startTime: '09:00', endTime: '10:00', room: 'LH-302', type: 'Lecture' },
    { id: 'tt_18', day: 5, subjectId: 'sub_5', startTime: '10:00', endTime: '11:00', room: 'LH-201', type: 'Lecture' },
    { id: 'tt_19', day: 5, subjectId: 'sub_1', startTime: '11:15', endTime: '12:15', room: 'LH-302', type: 'Lecture' },
    { id: 'tt_20', day: 5, subjectId: 'sub_6', startTime: '13:30', endTime: '15:30', room: 'Comp Lab 3', type: 'Lab' }
  ],
  assignments: [
    {
      id: 'asg_1',
      title: 'Dijkstra & A* Pathfinding Benchmark Suite',
      subjectId: 'sub_1',
      dueDate: '2026-09-14T23:59',
      priority: 'high',
      status: 'in_progress', // 'todo', 'in_progress', 'submitted', 'graded'
      marks: '20',
      description: 'Implement optimized Dijkstra with Fibonacci heap and compare execution time against A* search on road network datasets.',
      submittedDate: null,
      grade: null
    },
    {
      id: 'asg_2',
      title: 'Custom Shell with Pipes & Redirection in C',
      subjectId: 'sub_2',
      dueDate: '2026-09-12T18:00',
      priority: 'urgent',
      status: 'todo',
      marks: '25',
      description: 'Implement fork(), execvp(), dup2() for command chaining (`cmd1 | cmd2 > out.txt`) and background job management.',
      submittedDate: null,
      grade: null
    },
    {
      id: 'asg_3',
      title: 'Database Schema Normalization Case Study',
      subjectId: 'sub_3',
      dueDate: '2026-09-18T17:00',
      priority: 'medium',
      status: 'todo',
      marks: '15',
      description: 'Convert unnormalized hospital management relational schema up to Boyce-Codd Normal Form with dependency preservation proofs.',
      submittedDate: null,
      grade: null
    },
    {
      id: 'asg_4',
      title: 'Packet Sniffer & TCP Handshake Analysis',
      subjectId: 'sub_4',
      dueDate: '2026-09-08T23:59',
      priority: 'medium',
      status: 'submitted',
      marks: '20',
      description: 'Capture live Wireshark pcap, annotate 3-way handshake, SYN flood simulation, and congestion window graphs.',
      submittedDate: '2026-09-08T21:40',
      grade: '19/20'
    },
    {
      id: 'asg_5',
      title: 'Convolutional Neural Net on CIFAR-10',
      subjectId: 'sub_5',
      dueDate: '2026-09-22T23:59',
      priority: 'high',
      status: 'in_progress',
      marks: '30',
      description: 'Train ResNet-18 baseline vs custom CNN with data augmentation, dropout, and confusion matrix visualizations.',
      submittedDate: null,
      grade: null
    },
    {
      id: 'asg_6',
      title: 'RESTful Auth Microservice with Rate Limiting',
      subjectId: 'sub_6',
      dueDate: '2026-09-05T23:59',
      priority: 'low',
      status: 'graded',
      marks: '20',
      description: 'JWT rotation, bcrypt password hashing, and Redis token bucket rate limiter.',
      submittedDate: '2026-09-05T19:15',
      grade: '20/20'
    }
  ],
  exams: [
    {
      id: 'ex_1',
      subjectId: 'sub_2',
      title: 'Operating Systems Mid-Semester Exam',
      date: '2026-09-25T10:00',
      durationMinutes: 120,
      weightage: 30,
      room: 'Auditorium Hall B',
      topics: ['Processes & Threads', 'Scheduling Algos', 'Semaphores & Mutex', 'Deadlocks'],
      targetScore: 26,
      scored: null
    },
    {
      id: 'ex_2',
      subjectId: 'sub_1',
      title: 'Algorithms Mid-Semester Written Test',
      date: '2026-09-28T14:00',
      durationMinutes: 120,
      weightage: 30,
      room: 'LH-302',
      topics: ['Asymptotic Analysis', 'Divide & Conquer', 'Greedy proofs', 'Dynamic Programming Matrix Chain'],
      targetScore: 28,
      scored: null
    },
    {
      id: 'ex_3',
      subjectId: 'sub_5',
      title: 'AI/ML Practical Evaluation',
      date: '2026-10-03T09:30',
      durationMinutes: 180,
      weightage: 20,
      room: 'AI Research Lab',
      topics: ['Model Evaluation Metrics', 'Backpropagation derivation', 'Decision trees implementation'],
      targetScore: 18,
      scored: null
    },
    {
      id: 'ex_4',
      subjectId: 'sub_3',
      title: 'DBMS Mid-Semester Assessment',
      date: '2026-10-06T10:00',
      durationMinutes: 90,
      weightage: 25,
      room: 'LH-201',
      topics: ['Complex SQL subqueries', 'Relational Algebra', 'Normalization (1NF to BCNF)'],
      targetScore: 23,
      scored: null
    }
  ],
  academics: {
    semesters: [
      {
        sem: 1,
        sgpa: 8.65,
        totalCredits: 22,
        courses: [
          { name: 'Mathematics I', credits: 4, grade: 'A+', points: 9 },
          { name: 'Physics & Electromagnetism', credits: 4, grade: 'A', points: 8 },
          { name: 'Problem Solving via C', credits: 4, grade: 'O', points: 10 },
          { name: 'Basic Electrical Engg', credits: 3, grade: 'A', points: 8 },
          { name: 'Engineering Graphics', credits: 3, grade: 'A+', points: 9 },
          { name: 'Computing Lab', credits: 2, grade: 'O', points: 10 },
          { name: 'Physics Lab', credits: 2, grade: 'A', points: 8 }
        ]
      },
      {
        sem: 2,
        sgpa: 8.82,
        totalCredits: 22,
        courses: [
          { name: 'Mathematics II (Linear Algebra)', credits: 4, grade: 'O', points: 10 },
          { name: 'Chemistry & Nanotech', credits: 3, grade: 'A', points: 8 },
          { name: 'Data Structures in C++', credits: 4, grade: 'O', points: 10 },
          { name: 'Digital Electronics', credits: 4, grade: 'A+', points: 9 },
          { name: 'Environmental Science', credits: 3, grade: 'A', points: 8 },
          { name: 'Data Structures Lab', credits: 2, grade: 'O', points: 10 },
          { name: 'Digital Circuit Lab', credits: 2, grade: 'A+', points: 9 }
        ]
      },
      {
        sem: 3,
        sgpa: 8.50,
        totalCredits: 24,
        courses: [
          { name: 'Discrete Mathematical Structures', credits: 4, grade: 'A+', points: 9 },
          { name: 'Object Oriented Programming (Java)', credits: 4, grade: 'O', points: 10 },
          { name: 'Computer Organization & Arch', credits: 4, grade: 'B+', points: 7 },
          { name: 'Probability & Statistics', credits: 4, grade: 'A', points: 8 },
          { name: 'Digital Logic Lab', credits: 2, grade: 'A+', points: 9 },
          { name: 'OOP Java Lab', credits: 2, grade: 'O', points: 10 },
          { name: 'Economics for Engineers', credits: 4, grade: 'A', points: 8 }
        ]
      },
      {
        sem: 4,
        sgpa: 8.75,
        totalCredits: 24,
        courses: [
          { name: 'Design & Analysis of Algorithms', credits: 4, grade: 'A+', points: 9 },
          { name: 'Software Engineering & Agile', credits: 3, grade: 'O', points: 10 },
          { name: 'Formal Languages & Automata', credits: 4, grade: 'A', points: 8 },
          { name: 'Microprocessors & Interfacing', credits: 3, grade: 'B+', points: 7 },
          { name: 'Web Technologies Lab', credits: 2, grade: 'O', points: 10 },
          { name: 'Algorithms Lab', credits: 2, grade: 'O', points: 10 },
          { name: 'Open Elective (Intro to FinTech)', credits: 4, grade: 'A+', points: 9 },
          { name: 'Constitution of India', credits: 2, grade: 'A', points: 8 }
        ]
      },
      {
        sem: 5, // Current Semester
        sgpa: null,
        totalCredits: 20,
        courses: [
          { name: 'Design & Analysis of Algorithms (Adv)', credits: 4, grade: null, points: null },
          { name: 'Operating Systems & Kernels', credits: 4, grade: null, points: null },
          { name: 'Database Management Systems', credits: 3, grade: null, points: null },
          { name: 'Computer Networks', credits: 3, grade: null, points: null },
          { name: 'Artificial Intelligence & ML', credits: 4, grade: null, points: null },
          { name: 'Full-Stack Web Engineering Lab', credits: 2, grade: null, points: null }
        ]
      }
    ]
  },
  placements: {
    targetRole: 'Software Development Engineer (SDE-1)',
    dsaStats: {
      easy: 84,
      medium: 116,
      hard: 24,
      total: 224,
      streakDays: 19,
      topics: [
        { name: 'Arrays & Hashing', solved: 32, total: 35 },
        { name: 'Two Pointers & Sliding Window', solved: 22, total: 25 },
        { name: 'Stack & Monotonic Stack', solved: 18, total: 20 },
        { name: 'Binary Search', solved: 19, total: 22 },
        { name: 'Linked List', solved: 15, total: 15 },
        { name: 'Trees & BST', solved: 34, total: 40 },
        { name: 'Graphs & Disjoint Sets', solved: 26, total: 35 },
        { name: 'Dynamic Programming', solved: 38, total: 55 },
        { name: 'System Design Basics', solved: 12, total: 20 }
      ]
    },
    links: {
      resumeUrl: 'https://drive.google.com/file/d/demo-resume/view',
      githubUrl: 'https://github.com/shashvatbartaria',
      leetcodeUrl: 'https://leetcode.com/u/shashvatbartaria',
      linkedinUrl: 'https://linkedin.com/in/shashvatbartaria',
      portfolioUrl: 'https://shashvatbartaria.dev'
    },
    applications: [
      {
        id: 'app_1',
        company: 'Google',
        role: 'Software Engineer - Early Career',
        type: 'Full-Time',
        compensation: '₹34 LPA',
        location: 'Bengaluru / Hyderabad',
        appliedDate: '2026-08-28',
        status: 'interview', // wishlist, applied, assessment, interview, offer, rejected
        currentRound: 'Technical Interview Round 2 (Algorithms & System Architecture)',
        nextDate: '2026-09-15T16:30',
        notes: 'Round 1 went well on Tree dynamic programming. Round 2 interviewer is Staff SWE from Cloud team.'
      },
      {
        id: 'app_2',
        company: 'Microsoft',
        role: 'SWE Intern to Full-Time',
        type: 'Full-Time',
        compensation: '₹28 LPA',
        location: 'Hyderabad',
        appliedDate: '2026-08-20',
        status: 'assessment',
        currentRound: 'Codility OA (3 questions - Graph, DP, Bit Manipulation)',
        nextDate: '2026-09-13T20:00',
        notes: 'OA window closes Sunday midnight. Practice DP with bitmask.'
      },
      {
        id: 'app_3',
        company: 'Razorpay',
        role: 'Backend SDE-1',
        type: 'Full-Time',
        compensation: '₹24 LPA',
        location: 'Bengaluru',
        appliedDate: '2026-09-02',
        status: 'applied',
        currentRound: 'Resume Screening',
        nextDate: null,
        notes: 'Applied via employee referral through senior alumnus.'
      },
      {
        id: 'app_4',
        company: 'Atlassian',
        role: 'Associate Software Engineer',
        type: 'Full-Time',
        compensation: '₹42 LPA (CTC)',
        location: 'Bengaluru (Remote)',
        appliedDate: '2026-08-15',
        status: 'offer',
        currentRound: 'Offer Letter Received! 🎉',
        nextDate: '2026-09-30',
        notes: 'Acceptance deadline end of month. Base 18.5L + Stocks + Joining bonus.'
      },
      {
        id: 'app_5',
        company: 'Stripe',
        role: 'Software Engineer - Infrastructure',
        type: 'Full-Time',
        compensation: '₹48 LPA',
        location: 'Remote',
        appliedDate: '2026-08-10',
        status: 'interview',
        currentRound: 'Debug / Code Review Pair Programming',
        nextDate: '2026-09-19T18:00',
        notes: 'Focus on clean code, unit test coverage, and API error idempotency.'
      },
      {
        id: 'app_6',
        company: 'Uber',
        role: 'SDE-1',
        type: 'Full-Time',
        compensation: '₹38 LPA',
        location: 'Hyderabad',
        appliedDate: '2026-07-25',
        status: 'rejected',
        currentRound: 'Final Technical Round',
        nextDate: null,
        notes: 'Stumbled on distributed lock TTL edge cases. Good learning experience.'
      }
    ]
  },
  focusSessions: {
    todayMinutes: 85,
    streakDays: 7,
    completedPomodoros: 3,
    sessions: [
      { date: '2026-09-10', minutes: 50, tag: 'DSA Practice', note: 'Solved 2 Medium LeetCode DP problems' },
      { date: '2026-09-10', minutes: 35, tag: 'OS Assignment', note: 'Wrote fork/pipe skeleton in C' },
      { date: '2026-09-09', minutes: 75, tag: 'DBMS Study', note: 'Indexing & B+ trees revision' }
    ]
  },
  scratchpad: {
    content: `# Quick Scratchpad & Sprint Notes\n\n- [x] Review Dijkstra vs A* paper for Algorithm assignment\n- [ ] Fix fork() bug where child process zombie lingers\n- [ ] Revise Atlassian offer components before placement cell meeting\n- [ ] Practice 3 sliding window hard questions tonight\n- [x] Email Dr. Vance regarding OS lab makeup timing\n\n> "Consistency is what transforms average into excellence."`
  }
};

class CollegeOSStore {
  constructor() {
    this.subscribers = new Set();
    this.data = this.load();
  }

  // Load from localStorage or initialize default
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure critical fields exist
        return {
          ...DEFAULT_STUDENT_DATA,
          ...parsed,
          profile: { ...DEFAULT_STUDENT_DATA.profile, ...(parsed.profile || {}) },
          settings: { ...DEFAULT_STUDENT_DATA.settings, ...(parsed.settings || {}) },
          placements: {
            ...DEFAULT_STUDENT_DATA.placements,
            ...(parsed.placements || {}),
            dsaStats: { ...DEFAULT_STUDENT_DATA.placements.dsaStats, ...(parsed.placements?.dsaStats || {}) }
          }
        };
      }
    } catch (err) {
      console.warn('Failed to load CollegeOS data from storage:', err);
    }
    this.save(DEFAULT_STUDENT_DATA);
    return JSON.parse(JSON.stringify(DEFAULT_STUDENT_DATA));
  }

  save(newData = null) {
    if (newData) {
      this.data = newData;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.notify();
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    for (const callback of this.subscribers) {
      try {
        callback(this.data);
      } catch (err) {
        console.error('Subscriber error:', err);
      }
    }
  }

  get() {
    return this.data;
  }

  update(mutationFn) {
    mutationFn(this.data);
    this.save();
  }

  // Attendance Operations
  logAttendance(subjectId, status, note = '') {
    const sub = this.data.subjects.find(s => s.id === subjectId);
    if (!sub) return;

    const today = new Date().toISOString().split('T')[0];

    if (status === 'present') {
      sub.attendance.present += 1;
      sub.attendance.total += 1;
    } else if (status === 'absent') {
      sub.attendance.total += 1;
    } else if (status === 'cancelled') {
      // Cancelled class does not alter counts
    }

    sub.attendance.history.unshift({
      id: 'att_' + Date.now(),
      date: today,
      status,
      note: note || (status === 'present' ? 'Attended lecture' : status === 'absent' ? 'Missed lecture' : 'Class cancelled by department')
    });

    if (sub.attendance.history.length > 50) {
      sub.attendance.history = sub.attendance.history.slice(0, 50);
    }

    this.save();
  }

  undoLastAttendance(subjectId) {
    const sub = this.data.subjects.find(s => s.id === subjectId);
    if (!sub || !sub.attendance.history.length) return;

    const last = sub.attendance.history.shift();
    if (last.status === 'present') {
      if (sub.attendance.present > 0) sub.attendance.present -= 1;
      if (sub.attendance.total > 0) sub.attendance.total -= 1;
    } else if (last.status === 'absent') {
      if (sub.attendance.total > 0) sub.attendance.total -= 1;
    }

    this.save();
  }

  setSubjectAttendance(subjectId, present, total, target) {
    const sub = this.data.subjects.find(s => s.id === subjectId);
    if (!sub) return;
    sub.attendance.present = Math.max(0, parseInt(present, 10) || 0);
    sub.attendance.total = Math.max(sub.attendance.present, parseInt(total, 10) || 0);
    if (target !== undefined) {
      sub.targetAttendance = Math.min(100, Math.max(1, parseInt(target, 10) || 75));
    }
    this.save();
  }

  // Subjects CRUD
  addSubject(subject) {
    const newSubject = {
      id: 'sub_' + Date.now(),
      code: subject.code || 'CS000',
      name: subject.name || 'New Subject',
      instructor: subject.instructor || 'Staff',
      credits: parseInt(subject.credits, 10) || 3,
      color: subject.color || '#6366f1',
      targetAttendance: parseInt(subject.targetAttendance, 10) || 75,
      attendance: {
        present: parseInt(subject.present, 10) || 0,
        total: parseInt(subject.total, 10) || 0,
        history: []
      },
      syllabus: subject.syllabus || [
        { unit: 1, title: 'Introduction & Foundations', done: false },
        { unit: 2, title: 'Core Concepts & Paradigms', done: false },
        { unit: 3, title: 'Advanced Topics', done: false }
      ]
    };
    this.data.subjects.push(newSubject);
    this.save();
    return newSubject;
  }

  updateSubject(id, updates) {
    const idx = this.data.subjects.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.subjects[idx] = { ...this.data.subjects[idx], ...updates };
      this.save();
    }
  }

  deleteSubject(id) {
    this.data.subjects = this.data.subjects.filter(s => s.id !== id);
    this.data.timetable = this.data.timetable.filter(t => t.subjectId !== id);
    this.data.assignments = this.data.assignments.filter(a => a.subjectId !== id);
    this.data.exams = this.data.exams.filter(e => e.subjectId !== id);
    this.save();
  }

  // Timetable CRUD
  addTimetableSlot(slot) {
    const newSlot = {
      id: 'tt_' + Date.now(),
      day: parseInt(slot.day, 10),
      subjectId: slot.subjectId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room || 'LH-101',
      type: slot.type || 'Lecture'
    };
    this.data.timetable.push(newSlot);
    this.data.timetable.sort((a, b) => (a.day - b.day) || a.startTime.localeCompare(b.startTime));
    this.save();
    return newSlot;
  }

  deleteTimetableSlot(id) {
    this.data.timetable = this.data.timetable.filter(t => t.id !== id);
    this.save();
  }

  // Assignments CRUD & Status
  addAssignment(assignment) {
    const newAsg = {
      id: 'asg_' + Date.now(),
      title: assignment.title,
      subjectId: assignment.subjectId,
      dueDate: assignment.dueDate,
      priority: assignment.priority || 'medium',
      status: assignment.status || 'todo',
      marks: assignment.marks || '100',
      description: assignment.description || '',
      submittedDate: null,
      grade: null
    };
    this.data.assignments.unshift(newAsg);
    this.save();
    return newAsg;
  }

  updateAssignmentStatus(id, newStatus) {
    const asg = this.data.assignments.find(a => a.id === id);
    if (asg) {
      asg.status = newStatus;
      if (newStatus === 'submitted' && !asg.submittedDate) {
        asg.submittedDate = new Date().toISOString();
      }
      this.save();
    }
  }

  deleteAssignment(id) {
    this.data.assignments = this.data.assignments.filter(a => a.id !== id);
    this.save();
  }

  // Exams CRUD
  addExam(exam) {
    const newExam = {
      id: 'ex_' + Date.now(),
      subjectId: exam.subjectId,
      title: exam.title,
      date: exam.date,
      durationMinutes: parseInt(exam.durationMinutes, 10) || 120,
      weightage: parseInt(exam.weightage, 10) || 25,
      room: exam.room || 'Main Hall',
      topics: exam.topics || [],
      targetScore: exam.targetScore || null,
      scored: null
    };
    this.data.exams.push(newExam);
    this.data.exams.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.save();
    return newExam;
  }

  deleteExam(id) {
    this.data.exams = this.data.exams.filter(e => e.id !== id);
    this.save();
  }

  // Placements CRUD
  addPlacementApplication(app) {
    const newApp = {
      id: 'app_' + Date.now(),
      company: app.company,
      role: app.role,
      type: app.type || 'Full-Time',
      compensation: app.compensation || 'Competitive',
      location: app.location || 'Pan India / Remote',
      appliedDate: app.appliedDate || new Date().toISOString().split('T')[0],
      status: app.status || 'applied',
      currentRound: app.currentRound || 'Application Sent',
      nextDate: app.nextDate || null,
      notes: app.notes || ''
    };
    this.data.placements.applications.unshift(newApp);
    this.save();
    return newApp;
  }

  updatePlacementStatus(id, status, currentRound = null) {
    const app = this.data.placements.applications.find(a => a.id === id);
    if (app) {
      app.status = status;
      if (currentRound) app.currentRound = currentRound;
      this.save();
    }
  }

  deletePlacementApplication(id) {
    this.data.placements.applications = this.data.placements.applications.filter(a => a.id !== id);
    this.save();
  }

  updateDsaCounts(easy, medium, hard) {
    const stats = this.data.placements.dsaStats;
    stats.easy = parseInt(easy, 10) || 0;
    stats.medium = parseInt(medium, 10) || 0;
    stats.hard = parseInt(hard, 10) || 0;
    stats.total = stats.easy + stats.medium + stats.hard;
    this.save();
  }

  // Focus & Scratchpad
  logFocusSession(minutes, tag, note) {
    const today = new Date().toISOString().split('T')[0];
    this.data.focusSessions.todayMinutes += minutes;
    this.data.focusSessions.completedPomodoros += 1;
    this.data.focusSessions.sessions.unshift({
      date: today,
      minutes,
      tag: tag || 'Focus Sprint',
      note: note || ''
    });
    this.save();
  }

  saveScratchpad(content) {
    this.data.scratchpad.content = content;
    this.save();
  }

  // Profile & Settings
  updateProfile(profile) {
    this.data.profile = { ...this.data.profile, ...profile };
    this.save();
  }

  updateSettings(settings) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
  }

  // Backup, Restore & Reset
  exportJson() {
    return JSON.stringify(this.data, null, 2);
  }

  importJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.profile || !parsed.subjects) {
        throw new Error('Invalid CollegeOS backup file: Missing critical data tables.');
      }
      this.data = parsed;
      this.save();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_STUDENT_DATA));
    this.save();
  }

  clearAllData() {
    this.data = {
      profile: {
        name: 'Student Name',
        college: 'Your University',
        degree: 'Your Major',
        semester: 1,
        rollNo: '000000',
        targetAttendance: 75,
        targetCgpa: 8.5,
        avatarUrl: ''
      },
      settings: { theme: 'dark', soundEnabled: true, compactView: false, defaultThreshold: 75, currencySymbol: '₹' },
      subjects: [],
      timetable: [],
      assignments: [],
      exams: [],
      academics: { semesters: [] },
      placements: { targetRole: 'Software Engineer', dsaStats: { easy: 0, medium: 0, hard: 0, total: 0, streakDays: 0, topics: [] }, links: {}, applications: [] },
      focusSessions: { todayMinutes: 0, streakDays: 0, completedPomodoros: 0, sessions: [] },
      scratchpad: { content: '' }
    };
    this.save();
  }
}

// Global Store Singleton
window.collegeStore = new CollegeOSStore();
