/* ═══════════════════════════════════════════════════════════
  Study Logger — Django Frontend Logic
  Uses fetch() API instead of localStorage
   ═══════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  // ─── Constants ───
  const CATEGORIES = {
    reading:   { emoji: '📚', label: 'Reading',   color: 'hsl(230, 55%, 62%)' },
    coding:    { emoji: '💻', label: 'Coding',    color: 'hsl(170, 45%, 52%)' },
    exercises: { emoji: '🏋️', label: 'Exercises', color: 'hsl(340, 55%, 62%)' },
    lectures:  { emoji: '🎓', label: 'Lectures',  color: 'hsl(38, 70%, 58%)' },
    writing:   { emoji: '✍️', label: 'Writing',   color: 'hsl(280, 50%, 62%)' },
    research:  { emoji: '🔬', label: 'Research',  color: 'hsl(200, 55%, 55%)' },
    other:     { emoji: '📌', label: 'Other',     color: 'hsl(15, 55%, 58%)' },
  };

  // ─── State ───
  let currentFilter = 'all';

  // ─── DOM References ───
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ─── CSRF Token ───
  function getCSRFToken() {
    const cookie = document.cookie.split('; ').find(c => c.startsWith('csrftoken='));
    return cookie ? cookie.split('=')[1] : '';
  }

  function fetchJSON(url, options = {}) {
    const defaults = {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken(),
      },
    };
    return fetch(url, { ...defaults, ...options }).then(r => r.json());
  }

  // ─── Initialization ───
  function init() {
    setupHamburger();
    setupScrollShadow();
    setupFadeInObserver();
    updateGreeting();
    updateHeaderDate();

    // Detect which page we're on and init accordingly
    if ($('#page-dashboard')) {
      loadDashboard();
    }
    if ($('#page-tasks')) {
      setupTaskForm();
      setupFilters();
      loadTasks();
    }
    if ($('#page-profile')) {
      setupProfileForm();
      setupTheme();
      loadProfile();
    }
  }

  // ─── Hamburger ───
  function setupHamburger() {
    const hamburger = $('#hamburger');
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        $('#nav-links').classList.toggle('open');
      });
    }
  }

  // ─── Scroll Shadow on Nav ───
  function setupScrollShadow() {
    const navbar = $('#navbar');
    if (navbar) {
      window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 10);
      }, { passive: true });
    }
  }

  // ─── Fade-In Observer ───
  function setupFadeInObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    $$('.fade-in').forEach(el => observer.observe(el));
  }

  // ─── Greeting ───
  function updateGreeting() {
    const el = $('#greeting');
    if (!el) return;
    const hour = new Date().getHours();
    let greeting;
    if (hour < 12) greeting = 'Good morning! ☀️';
    else if (hour < 17) greeting = 'Good afternoon! 👋';
    else greeting = 'Good evening! 🌙';
    el.textContent = greeting;
  }

  function updateHeaderDate() {
    const el = $('#header-date');
    if (!el) return;
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    el.textContent = now.toLocaleDateString('en-US', options);
  }

  // ─── Theme ───
  function setupTheme() {
    const cb = $('#theme-checkbox');
    if (!cb) return;

    // Set initial state from data-theme attribute
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      cb.checked = true;
    }

    cb.addEventListener('change', (e) => {
      const theme = e.target.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : '');

      // Persist to server
      fetchJSON('/api/theme/', {
        method: 'POST',
        body: JSON.stringify({ theme }),
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // Dashboard
  // ═══════════════════════════════════════════════════════════

  async function loadDashboard() {
    try {
      const data = await fetchJSON('/api/dashboard/');
      renderDashboard(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }

  function renderDashboard(data) {
    updateStats(data);
    drawLineChart(data.weekly);
    drawPieChart(data.categoryCounts);
    updateGoalRing(data);
    updateCategoryBars(data.categoryProgress);
  }

  function updateStats(data) {
    animateCounter('stat-val-tasks', data.tasksToday);
    animateCounter('stat-val-streak', data.streak);
    const hoursEl = $('#stat-val-hours');
    if (hoursEl) hoursEl.textContent = `${data.hoursToday}h`;
    const compEl = $('#stat-val-completion');
    if (compEl) compEl.textContent = `${data.completionPct}%`;
  }

  function animateCounter(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    if (start === target) return;
    const duration = 600;
    const startTime = performance.now();
    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ─── Line Chart ───
  function drawLineChart(weekly) {
    const canvas = document.getElementById('chart-line');
    if (!canvas || !weekly) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 300 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '300px';
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = 300;
    const pad = { top: 30, right: 30, bottom: 50, left: 50 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    const days = weekly;
    const maxHours = Math.max(...days.map(d => d.hours), 1);
    const gridLines = 5;

    ctx.clearRect(0, 0, w, h);

    const style = getComputedStyle(document.documentElement);
    const textColor = style.getPropertyValue('--clr-text-muted').trim() || '#8890a4';
    const borderColor = style.getPropertyValue('--clr-border').trim() || '#e1e4eb';

    // Grid lines
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i <= gridLines; i++) {
      const y = pad.top + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      const val = ((maxHours / gridLines) * (gridLines - i)).toFixed(1);
      ctx.fillStyle = textColor;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${val}h`, pad.left - 10, y + 4);
    }
    ctx.setLineDash([]);

    // X-axis labels
    const stepX = chartW / (days.length - 1 || 1);
    days.forEach((d, i) => {
      const x = pad.left + stepX * i;
      ctx.fillStyle = textColor;
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x, h - pad.bottom + 25);
    });

    // Build points
    const points = days.map((d, i) => ({
      x: pad.left + stepX * i,
      y: pad.top + chartH - (d.hours / maxHours) * chartH,
    }));

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
    grad.addColorStop(0, 'hsla(230, 55%, 62%, 0.25)');
    grad.addColorStop(1, 'hsla(230, 55%, 62%, 0.01)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, h - pad.bottom);
    points.forEach((p, i) => {
      if (i === 0) ctx.lineTo(p.x, p.y);
      else {
        const prev = points[i - 1];
        const cpx1 = prev.x + stepX * 0.4;
        const cpy1 = prev.y;
        const cpx2 = p.x - stepX * 0.4;
        const cpy2 = p.y;
        ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, p.x, p.y);
      }
    });
    ctx.lineTo(points[points.length - 1].x, h - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    const lineGrad = ctx.createLinearGradient(pad.left, 0, w - pad.right, 0);
    lineGrad.addColorStop(0, 'hsl(230, 55%, 62%)');
    lineGrad.addColorStop(1, 'hsl(230, 60%, 72%)');

    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else {
        const prev = points[i - 1];
        const cpx1 = prev.x + stepX * 0.4;
        const cpy1 = prev.y;
        const cpx2 = p.x - stepX * 0.4;
        const cpy2 = p.y;
        ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, p.x, p.y);
      }
    });
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Dots
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'hsl(230, 55%, 62%)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    });
  }

  // ─── Pie Chart ───
  function drawPieChart(categoryCounts) {
    const canvas = document.getElementById('chart-pie');
    if (!canvas || !categoryCounts) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const size = 240;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 10;

    const total = Object.values(categoryCounts).reduce((s, v) => s + v, 0);
    if (total === 0) {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--clr-text-muted').trim() || '#8890a4';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', cx, cy);
      return;
    }

    ctx.clearRect(0, 0, size, size);

    let startAngle = -Math.PI / 2;
    const entries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

    entries.forEach(([cat, count]) => {
      const slice = (count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = CATEGORIES[cat]?.color || '#ccc';
      ctx.fill();

      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--clr-surface').trim() || '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle += slice;
    });

    // Inner circle for donut effect
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--clr-surface').trim() || '#fff';
    ctx.fill();

    // Center text
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--clr-text').trim() || '#262e47';
    ctx.font = 'bold 1.5rem Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy - 8);
    ctx.font = '0.7rem Inter, sans-serif';
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--clr-text-muted').trim() || '#8890a4';
    ctx.fillText('tasks', cx, cy + 14);

    // Legend
    const legendEl = document.getElementById('pie-legend');
    if (legendEl) {
      legendEl.innerHTML = entries.map(([cat, count]) => {
        const c = CATEGORIES[cat];
        return `<div class="pie-legend-item">
          <span class="pie-legend-dot" style="background:${c?.color || '#ccc'}"></span>
          ${c?.emoji || ''} ${c?.label || cat} (${count})
        </div>`;
      }).join('');
    }
  }

  // ─── Goal Ring ───
  function updateGoalRing(data) {
    const pct = data.goalPct;
    const circumference = 2 * Math.PI * 60;
    const offset = circumference - (pct / 100) * circumference;

    const fill = document.getElementById('goal-ring-fill');
    if (fill) {
      fill.style.strokeDasharray = circumference;
      fill.style.strokeDashoffset = offset;
      fill.style.stroke = pct >= 100 ? 'hsl(170, 45%, 52%)' : 'hsl(230, 55%, 62%)';
    }

    const text = document.getElementById('goal-ring-text');
    if (text) text.textContent = `${pct}%`;

    const badge = document.getElementById('goal-badge');
    if (badge) badge.textContent = `${data.completedToday} / ${data.dailyGoal} tasks`;
  }

  // ─── Category Bars ───
  function updateCategoryBars(categoryProgress) {
    const container = document.getElementById('category-bars');
    if (!container) return;

    const entries = Object.entries(categoryProgress || {});
    if (entries.length === 0) {
      container.innerHTML = '<p style="color:var(--clr-text-muted);font-size:var(--fs-sm);text-align:center;padding:var(--sp-8) 0;">Log tasks to see category progress</p>';
      return;
    }

    container.innerHTML = entries.map(([cat, data]) => {
      const c = CATEGORIES[cat];
      const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
      return `
        <div class="category-bar-item">
          <div class="category-bar-header">
            <span class="category-bar-label">${c?.emoji || ''} ${c?.label || cat}</span>
            <span class="category-bar-value">${data.completed}/${data.total}</span>
          </div>
          <div class="category-bar-track">
            <div class="category-bar-fill" style="width:${pct}%;background:${c?.color || 'var(--clr-primary)'}"></div>
          </div>
        </div>`;
    }).join('');

    // Animate bars
    requestAnimationFrame(() => {
      container.querySelectorAll('.category-bar-fill').forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0';
        requestAnimationFrame(() => { bar.style.width = width; });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // Tasks
  // ═══════════════════════════════════════════════════════════

  function setupTaskForm() {
    const form = $('#task-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#task-name').value.trim();
      const category = $('#task-category').value;
      const duration = parseInt($('#task-duration').value) || 30;
      const notes = $('#task-notes').value.trim();

      if (!name || !category) return;

      try {
        const result = await fetchJSON('/api/tasks/', {
          method: 'POST',
          body: JSON.stringify({ name, category, duration, notes }),
        });

        if (result.status === 'ok') {
          form.reset();
          showToast('✅', 'Task added successfully!');
          loadTasks();
        } else {
          showToast('❌', 'Failed to add task.');
        }
      } catch (err) {
        showToast('❌', 'Error adding task.');
        console.error(err);
      }
    });
  }

  function setupFilters() {
    $$('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        currentFilter = chip.dataset.filter;
        $$('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        loadTasks();
      });
    });
  }

  async function loadTasks() {
    try {
      const url = currentFilter !== 'all'
        ? `/api/tasks/?filter=${currentFilter}`
        : '/api/tasks/';
      const data = await fetchJSON(url);
      renderTaskList(data.tasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }

  function renderTaskList(tasks) {
    const list = document.getElementById('task-list');
    if (!list) return;

    if (!tasks || tasks.length === 0) {
      list.innerHTML = `
        <div class="empty-state" id="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No tasks yet</h3>
          <p>${currentFilter === 'all' ? 'Start logging your learning activities above!' : `No ${CATEGORIES[currentFilter]?.label || currentFilter} tasks found.`}</p>
        </div>`;
      return;
    }

    list.innerHTML = tasks.map((task, idx) => {
      const cat = CATEGORIES[task.category];
      const dateStr = new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}" style="animation-delay: ${idx * 0.05}s">
          <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="task-item-body">
            <div class="task-item-name">${escapeHtml(task.name)}</div>
            <div class="task-item-meta">
              <span class="task-meta-tag">${cat?.emoji || ''} ${cat?.label || task.category}</span>
              <span class="task-meta-duration">⏱ ${task.duration} min</span>
              <span class="task-meta-duration">${dateStr}</span>
            </div>
            ${task.notes ? `<div class="task-meta-notes">${escapeHtml(task.notes)}</div>` : ''}
          </div>
          <div class="task-item-actions">
            <button class="task-delete-btn" data-id="${task.id}" title="Delete task">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        </div>`;
    }).join('');

    // Bind events
    list.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.addEventListener('click', () => toggleTask(cb.dataset.id));
    });

    list.querySelectorAll('.task-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteTask(btn.dataset.id));
    });
  }

  async function toggleTask(id) {
    try {
      const result = await fetchJSON(`/api/tasks/${id}/toggle/`, { method: 'POST' });
      showToast(result.completed ? '✅' : '🔄', result.completed ? 'Task completed!' : 'Task reopened');
      loadTasks();
    } catch (err) {
      showToast('❌', 'Error toggling task.');
      console.error(err);
    }
  }

  async function deleteTask(id) {
    const item = document.querySelector(`.task-item[data-id="${id}"]`);
    if (item) {
      item.classList.add('removing');
    }
    showToast('🗑️', 'Task deleted');

    setTimeout(async () => {
      try {
        await fetchJSON(`/api/tasks/${id}/`, { method: 'DELETE' });
        loadTasks();
      } catch (err) {
        console.error(err);
      }
    }, 250);
  }

  // ═══════════════════════════════════════════════════════════
  // Profile
  // ═══════════════════════════════════════════════════════════

  function setupProfileForm() {
    const form = $('#profile-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#profile-name-input').value.trim();
      const email = $('#profile-email-input').value.trim();
      const daily_goal = parseInt($('#profile-goal-input').value) || 5;

      try {
        const result = await fetchJSON('/api/profile/', {
          method: 'POST',
          body: JSON.stringify({ name, email, daily_goal }),
        });

        if (result.status === 'ok') {
          // Update display
          const displayName = $('#profile-display-name');
          if (displayName) displayName.textContent = result.name;
          const displayEmail = $('#profile-display-email');
          if (displayEmail) displayEmail.textContent = result.email;

          // Update initials
          const initials = result.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
          const profileInitials = $('#profile-initials');
          if (profileInitials) profileInitials.textContent = initials;
          const avatarInitials = $('#avatar-initials');
          if (avatarInitials) avatarInitials.textContent = initials;

          // Show feedback
          const feedback = $('#save-feedback');
          if (feedback) {
            feedback.classList.add('visible');
            setTimeout(() => feedback.classList.remove('visible'), 2500);
          }

          showToast('💾', 'Profile saved!');
        }
      } catch (err) {
        showToast('❌', 'Error saving profile.');
        console.error(err);
      }
    });
  }

  async function loadProfile() {
    try {
      const data = await fetchJSON('/api/profile/info/');

      // Fill form
      const nameInput = $('#profile-name-input');
      if (nameInput) nameInput.value = data.name;
      const emailInput = $('#profile-email-input');
      if (emailInput) emailInput.value = data.email;
      const goalInput = $('#profile-goal-input');
      if (goalInput) goalInput.value = data.dailyGoal;

      // Display
      const displayName = $('#profile-display-name');
      if (displayName) displayName.textContent = data.name;
      const displayEmail = $('#profile-display-email');
      if (displayEmail) displayEmail.textContent = data.email;

      // Initials
      const initials = data.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const profileInitials = $('#profile-initials');
      if (profileInitials) profileInitials.textContent = initials;
      const avatarInitials = $('#avatar-initials');
      if (avatarInitials) avatarInitials.textContent = initials;

      // Stats
      const totalTasks = $('#profile-total-tasks');
      if (totalTasks) totalTasks.textContent = data.totalTasks;
      const totalHours = $('#profile-total-hours');
      if (totalHours) totalHours.textContent = `${data.totalHours}h`;
      const totalStreak = $('#profile-total-streak');
      if (totalStreak) totalStreak.textContent = data.bestStreak;

      // Theme checkbox
      const cb = $('#theme-checkbox');
      if (cb && data.theme === 'dark') {
        cb.checked = true;
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Utility
  // ═══════════════════════════════════════════════════════════

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(icon, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // ─── Window resize → redraw charts ───
  let resizeTimer;
  let lastDashboardData = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(async () => {
      if ($('#page-dashboard')) {
        loadDashboard();
      }
    }, 200);
  });

  // ─── Boot ───
  document.addEventListener('DOMContentLoaded', init);
})();
