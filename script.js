(() => {
  'use strict';

  const STORAGE_KEY = 'gpawise-state-v1';
  const THEME_KEY = 'gpawise-theme';

  const scales = {
    standard: {
      max: 4,
      points: {
        'A+': 4.0,
        'A': 4.0,
        'A-': 3.7,
        'B+': 3.3,
        'B': 3.0,
        'B-': 2.7,
        'C+': 2.3,
        'C': 2.0,
        'C-': 1.7,
        'D+': 1.3,
        'D': 1.0,
        'D-': 0.7,
        'F': 0.0
      }
    },
    weighted: {
      max: 5,
      points: {
        'A+': 5.0,
        'A': 5.0,
        'A-': 4.7,
        'B+': 4.3,
        'B': 4.0,
        'B-': 3.7,
        'C+': 3.3,
        'C': 3.0,
        'C-': 2.7,
        'D+': 2.3,
        'D': 2.0,
        'D-': 1.7,
        'F': 0.0
      }
    }
  };

  const gradeMeaning = {
    'A+': 'Exceptional',
    'A': 'Excellent',
    'A-': 'Very good',
    'B+': 'Good',
    'B': 'Above average',
    'B-': 'Average',
    'C+': 'Fair',
    'C': 'Satisfactory',
    'C-': 'Needs work',
    'D+': 'Below average',
    'D': 'Poor',
    'D-': 'Very poor',
    'F': 'Not passing'
  };

  const sampleCourses = [
    { name: 'Calculus II', grade: 'A-', credits: '4' },
    { name: 'Physics I', grade: 'B+', credits: '3' },
    { name: 'Intro to Programming', grade: 'A', credits: '3' }
  ];

  const elements = {
    html: document.documentElement,
    courseList: document.getElementById('course-list'),
    emptyState: document.getElementById('empty-state'),
    addCourse: document.getElementById('add-course'),
    emptyAddCourse: document.getElementById('empty-add-course'),
    clearAll: document.getElementById('clear-all'),
    calculate: document.getElementById('calculate-gpa'),
    download: document.getElementById('download-report'),
    gradingScale: document.getElementById('grading-scale'),
    gradingTable: document.getElementById('grading-scale-table'),
    term: document.getElementById('term-select'),
    gpaResult: document.getElementById('gpa-result'),
    gpaMax: document.getElementById('gpa-max'),
    ringValue: document.getElementById('ring-value'),
    gpaRing: document.getElementById('gpa-ring'),
    progressValue: document.getElementById('progress-value'),
    progressBar: document.getElementById('progress-bar'),
    totalCredits: document.getElementById('total-credits'),
    qualityPoints: document.getElementById('quality-points'),
    calculatedCourses: document.getElementById('calculated-courses'),
    countLabel: document.getElementById('course-count-label'),
    resultStatus: document.getElementById('result-status'),
    resultCaption: document.getElementById('result-caption'),
    resultCard: document.querySelector('.result-card'),
    saveStatus: document.getElementById('save-status'),
    saveStatusText: document.getElementById('save-status-text'),
    toast: document.getElementById('toast'),
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.querySelector('#theme-toggle use'),
    themeLabel: document.querySelector('.theme-label'),
    menuToggle: document.getElementById('menu-toggle'),
    primaryNav: document.getElementById('primary-nav')
  };

  let state = {
    scale: 'standard',
    term: 'Fall 2026',
    courses: sampleCourses.map((course) => ({ ...course }))
  };
  let saveTimer;
  let toastTimer;

  function safeParse(value) {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return null;
    }
  }

  function normalizeCourse(course) {
    const grade = course && typeof course.grade === 'string' && scales.standard.points[course.grade]
      !== undefined ? course.grade : 'A';
    const credits = course && course.credits !== undefined ? String(course.credits) : '3';
    return {
      name: course && typeof course.name === 'string' ? course.name : '',
      grade,
      credits: /^\d*\.?\d*$/.test(credits) ? credits : '3'
    };
  }

  function loadState() {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.courses)) {
      state = {
        scale: scales[saved.scale] ? saved.scale : 'standard',
        term: typeof saved.term === 'string' ? saved.term : 'Fall 2026',
        courses: saved.courses.map(normalizeCourse)
      };
    }

    if (elements.gradingScale) elements.gradingScale.value = state.scale;
    if (elements.term) elements.term.value = state.term;
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      elements.saveStatus.classList.remove('saving');
      elements.saveStatusText.textContent = 'Saved locally';
    } catch (_error) {
      elements.saveStatusText.textContent = 'Saved for this session';
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    elements.saveStatus.classList.add('saving');
    elements.saveStatusText.textContent = 'Saving…';
    saveTimer = setTimeout(persistState, 280);
  }

  function escapeAttribute(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatNumber(value, decimals = 1) {
    return Number(value.toFixed(decimals)).toString();
  }

  function getCurrentScale() {
    return scales[state.scale] || scales.standard;
  }

  function gradeOptions(selectedGrade) {
    return Object.keys(getCurrentScale().points).map((grade) => (
      `<option value="${grade}" ${grade === selectedGrade ? 'selected' : ''}>${grade}</option>`
    )).join('');
  }

  function renderCourses(focusIndex = -1) {
    elements.courseList.innerHTML = state.courses.map((course, index) => {
      const points = getCurrentScale().points[course.grade];
      return `
        <div class="course-grid course-row" data-index="${index}">
          <div class="course-name-cell">
            <label class="sr-only" for="course-name-${index}">Course ${index + 1} name</label>
            <input class="field-control course-name" id="course-name-${index}" type="text" maxlength="80" placeholder="e.g. Biology 101" value="${escapeAttribute(course.name)}" autocomplete="off">
          </div>
          <div class="grade-cell">
            <label class="sr-only" for="course-grade-${index}">Course ${index + 1} grade</label>
            <select class="field-control course-grade" id="course-grade-${index}">${gradeOptions(course.grade)}</select>
          </div>
          <div class="credits-cell">
            <label class="sr-only" for="course-credits-${index}">Course ${index + 1} credits</label>
            <input class="field-control course-credits" id="course-credits-${index}" type="number" min="0" max="30" step="0.5" inputmode="decimal" placeholder="3" value="${escapeAttribute(course.credits)}">
          </div>
          <div class="points-cell"><span class="points-pill">${points.toFixed(1)}</span></div>
          <button class="remove-course" type="button" data-action="remove" aria-label="Remove ${escapeAttribute(course.name || `course ${index + 1}`)}" title="Remove course"><svg class="icon" aria-hidden="true"><use href="#icon-trash"></use></svg></button>
        </div>`;
    }).join('');

    elements.emptyState.hidden = state.courses.length !== 0;
    elements.countLabel.textContent = `${state.courses.length} ${state.courses.length === 1 ? 'course' : 'courses'}`;

    if (focusIndex >= 0) {
      const input = document.getElementById(`course-name-${focusIndex}`);
      if (input) input.focus();
    }
  }

  function calculateResults() {
    const scale = getCurrentScale();
    let totalCredits = 0;
    let qualityPoints = 0;
    const countedCourses = [];

    state.courses.forEach((course, index) => {
      const credits = Number.parseFloat(course.credits);
      const points = scale.points[course.grade];
      if (Number.isFinite(credits) && credits > 0 && points !== undefined) {
        const quality = credits * points;
        totalCredits += credits;
        qualityPoints += quality;
        countedCourses.push({
          index,
          name: course.name || `Course ${index + 1}`,
          grade: course.grade,
          credits,
          points,
          quality
        });
      }
    });

    return {
      totalCredits,
      qualityPoints,
      countedCourses,
      gpa: totalCredits > 0 ? qualityPoints / totalCredits : 0,
      max: scale.max
    };
  }

  function getStanding(gpa, totalCredits) {
    if (!totalCredits) return { label: 'Add your grades', caption: 'Add credits to see your semester result.' };
    if (gpa >= 3.7) return { label: 'Excellent standing', caption: 'You are setting a strong academic pace.' };
    if (gpa >= 3) return { label: 'Strong track', caption: 'You are building a solid semester.' };
    if (gpa >= 2) return { label: 'Keep building', caption: 'There is plenty of room to move up.' };
    return { label: 'Room to grow', caption: 'Every next grade is a chance to improve.' };
  }

  function updateResult(announce = false) {
    const result = calculateResults();
    const percent = result.max > 0 ? Math.min(100, Math.max(0, (result.gpa / result.max) * 100)) : 0;
    const standing = getStanding(result.gpa, result.totalCredits);

    elements.gpaResult.textContent = result.gpa.toFixed(2);
    elements.gpaMax.textContent = `/ ${result.max.toFixed(1)}`;
    elements.ringValue.textContent = result.gpa.toFixed(2);
    elements.gpaRing.style.setProperty('--ring-percent', percent.toFixed(2));
    elements.progressValue.textContent = `${percent.toFixed(1)}%`;
    elements.progressBar.style.width = `${percent}%`;
    elements.totalCredits.textContent = formatNumber(result.totalCredits, 1);
    elements.qualityPoints.textContent = formatNumber(result.qualityPoints, 1);
    elements.calculatedCourses.textContent = result.countedCourses.length;
    elements.resultStatus.textContent = standing.label;
    elements.resultCaption.textContent = standing.caption;

    if (state.courses.length !== result.countedCourses.length) {
      elements.countLabel.textContent = `${state.courses.length} ${state.courses.length === 1 ? 'course' : 'courses'} · ${result.countedCourses.length} counted`;
    } else {
      elements.countLabel.textContent = `${state.courses.length} ${state.courses.length === 1 ? 'course' : 'courses'}`;
    }

    if (announce) {
      elements.resultCard.classList.remove('result-pulse');
      // Force a reflow so the pulse can be replayed for consecutive clicks.
      void elements.resultCard.offsetWidth;
      elements.resultCard.classList.add('result-pulse');
      showToast(result.totalCredits ? `Your GPA is ${result.gpa.toFixed(2)}.` : 'Add credits to calculate your GPA.');
    }
  }

  function renderScaleTable() {
    const scale = getCurrentScale();
    elements.gradingTable.innerHTML = Object.entries(scale.points).map(([grade, points]) => `
      <tr><td>${grade}</td><td>${points.toFixed(1)}</td><td>${gradeMeaning[grade]}</td></tr>
    `).join('');
  }

  function updatePointCell(row, course) {
    const points = getCurrentScale().points[course.grade];
    const pill = row.querySelector('.points-pill');
    if (pill) pill.textContent = points === undefined ? '—' : points.toFixed(1);
    const removeButton = row.querySelector('[data-action="remove"]');
    if (removeButton) removeButton.setAttribute('aria-label', `Remove ${course.name || 'course'}`);
  }

  function addCourse() {
    state.courses.push({ name: '', grade: 'A', credits: '3' });
    renderCourses(state.courses.length - 1);
    updateResult();
    scheduleSave();
  }

  function removeCourse(index) {
    if (!Number.isInteger(index) || !state.courses[index]) return;
    const [removed] = state.courses.splice(index, 1);
    renderCourses();
    updateResult();
    scheduleSave();
    showToast(`${removed.name || 'Course'} removed.`);
  }

  function clearAllCourses() {
    if (state.courses.length === 0) return;
    state.courses = [];
    renderCourses();
    updateResult();
    scheduleSave();
    showToast('Course list cleared.');
  }

  function handleCourseField(event) {
    const row = event.target.closest('.course-row');
    if (!row) return;
    const index = Number(row.dataset.index);
    const course = state.courses[index];
    if (!course) return;

    if (event.target.classList.contains('course-name')) course.name = event.target.value;
    if (event.target.classList.contains('course-grade')) course.grade = event.target.value;
    if (event.target.classList.contains('course-credits')) course.credits = event.target.value;

    updatePointCell(row, course);
    updateResult();
    scheduleSave();
  }

  function csvCell(value) {
    return `"${String(value).replace(/"/g, '""')}"`;
  }

  function exportReport() {
    const result = calculateResults();
    const rows = [
      ['GPAwise report', state.term],
      ['Grading scale', state.scale === 'weighted' ? 'Weighted 5.0' : 'Standard 4.0'],
      [],
      ['Course', 'Grade', 'Credits', 'Grade points', 'Quality points'],
      ...result.countedCourses.map((course) => [course.name, course.grade, course.credits, course.points.toFixed(1), course.quality.toFixed(1)]),
      [],
      ['Semester GPA', result.gpa.toFixed(2)],
      ['Total credits', formatNumber(result.totalCredits, 1)],
      ['Quality points', formatNumber(result.qualityPoints, 1)]
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gpawise-${state.term.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-report.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Your GPA report is ready to download.');
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add('visible');
    toastTimer = setTimeout(() => elements.toast.classList.remove('visible'), 2800);
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    elements.html.dataset.theme = isDark ? 'dark' : 'light';
    elements.themeIcon.setAttribute('href', isDark ? '#icon-sun' : '#icon-moon');
    elements.themeLabel.textContent = isDark ? 'Light' : 'Dark';
    elements.themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    elements.themeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  function initTheme() {
    let theme = localStorage.getItem(THEME_KEY);
    if (!theme) theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(theme);
  }

  function toggleMenu(forceClose = false) {
    const shouldOpen = forceClose ? false : !elements.primaryNav.classList.contains('open');
    elements.primaryNav.classList.toggle('open', shouldOpen);
    elements.menuToggle.classList.toggle('is-open', shouldOpen);
    elements.menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    elements.menuToggle.setAttribute('aria-label', shouldOpen ? 'Close navigation' : 'Open navigation');
  }

  function bindEvents() {
    elements.addCourse.addEventListener('click', addCourse);
    elements.emptyAddCourse.addEventListener('click', addCourse);
    elements.clearAll.addEventListener('click', clearAllCourses);
    elements.calculate.addEventListener('click', () => updateResult(true));
    elements.download.addEventListener('click', exportReport);
    elements.courseList.addEventListener('input', handleCourseField);
    elements.courseList.addEventListener('change', handleCourseField);
    elements.courseList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action="remove"]');
      if (button) removeCourse(Number(button.closest('.course-row').dataset.index));
    });

    elements.gradingScale.addEventListener('change', (event) => {
      state.scale = scales[event.target.value] ? event.target.value : 'standard';
      renderCourses();
      renderScaleTable();
      updateResult();
      scheduleSave();
      showToast(`${state.scale === 'weighted' ? 'Weighted 5.0' : 'Standard 4.0'} scale selected.`);
    });

    elements.term.addEventListener('change', (event) => {
      state.term = event.target.value;
      scheduleSave();
    });

    elements.themeToggle.addEventListener('click', () => {
      const nextTheme = elements.html.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      try {
        localStorage.setItem(THEME_KEY, nextTheme);
      } catch (_error) {
        // The theme still applies for the current visit if storage is unavailable.
      }
    });

    elements.menuToggle.addEventListener('click', () => toggleMenu());
    document.querySelectorAll('.primary-nav a').forEach((link) => link.addEventListener('click', () => toggleMenu(true)));
    document.addEventListener('click', (event) => {
      if (elements.primaryNav.classList.contains('open') && !elements.primaryNav.contains(event.target) && !elements.menuToggle.contains(event.target)) toggleMenu(true);
    });
  }

  function init() {
    loadState();
    initTheme();
    renderCourses();
    renderScaleTable();
    updateResult();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
