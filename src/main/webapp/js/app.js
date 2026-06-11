/**
 * app.js — Main application logic.
 * Handles routing, rendering, form validation, and UI interactions.
 */

/* ----------------------------------------------------------------
   STATE
---------------------------------------------------------------- */
const state = {
  students:    [],   // full list cached from API
  editId:      null, // id being edited (null = create mode)
  deleteId:    null, // id pending deletion
};

/* ----------------------------------------------------------------
   DOM REFS
---------------------------------------------------------------- */
const $ = id => document.getElementById(id);

const views   = document.querySelectorAll('.view');
const navBtns = document.querySelectorAll('.nav-btn');
const toast   = $('toast');
const overlay = $('modal-overlay');

/* ----------------------------------------------------------------
   NAVIGATION
   Each view refreshes its own data when navigated to.
---------------------------------------------------------------- */
function showView(name) {
  views.forEach(v => v.classList.remove('active'));
  navBtns.forEach(b => b.classList.remove('active'));

  const view = document.getElementById(`view-${name}`);
  if (view) view.classList.add('active');

  const btn = document.querySelector(`.nav-btn[data-view="${name}"]`);
  if (btn) btn.classList.add('active');

  // Always re-fetch fresh data when switching views
  if (name === 'dashboard') renderDashboard();
  if (name === 'students')  renderStudentList();
  // 'add' view is handled by openAddForm() / openEditForm()
}

// Nav button clicks
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    if (view === 'add') {
      openAddForm(); // resets form then shows view
    } else {
      showView(view);
    }
  });
});

/* ----------------------------------------------------------------
   DASHBOARD REFRESH — called after every create / update / delete
---------------------------------------------------------------- */
async function refreshDashboard() {
  // Silently re-render dashboard stats in the background
  // so it's always up-to-date when the user navigates to it
  const students = await StudentAPI.getAll();
  state.students = students;

  const total  = students.length;
  const avgGpa = total
    ? (students.reduce((sum, s) => sum + s.gpa, 0) / total).toFixed(2)
    : '0.00';
  const topGpa = total
    ? Math.max(...students.map(s => s.gpa)).toFixed(2)
    : '0.00';
  const courses = new Set(students.map(s => s.course)).size;

  $('stat-total').textContent   = total;
  $('stat-gpa').textContent     = avgGpa;
  $('stat-courses').textContent = courses;
  $('stat-top').textContent     = topGpa;

  renderBarChart(students);

  // Recent = last 5 added (highest ids first)
  const recent = [...students]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);
  renderRecentTable(recent);
}

/* ----------------------------------------------------------------
   DASHBOARD
---------------------------------------------------------------- */
async function renderDashboard() {
  await refreshDashboard();
}

function renderBarChart(students) {
  const container = $('bar-chart');
  container.innerHTML = '';

  if (!students.length) {
    container.innerHTML = '<p style="color:var(--text-light);font-size:.9rem;padding:20px 0">No data yet.</p>';
    return;
  }

  // Count students per course
  const counts = {};
  students.forEach(s => {
    counts[s.course] = (counts[s.course] || 0) + 1;
  });

  const maxCount = Math.max(...Object.values(counts), 1);
  const maxBarH  = 140; // px

  // Sort by count descending for a nicer chart
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([course, count]) => {
      const barH = Math.max(Math.round((count / maxCount) * maxBarH), 6);
      const item = document.createElement('div');
      item.className = 'bar-item';
      item.innerHTML = `
        <span class="bar-count">${count}</span>
        <div class="bar" style="height:${barH}px" title="${escHtml(course)}: ${count} student(s)"></div>
        <span class="bar-label">${escHtml(course)}</span>
      `;
      container.appendChild(item);
    });
}

function renderRecentTable(students) {
  const tbody = $('recent-tbody');
  if (!students.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-light)">No students yet.</td></tr>';
    return;
  }
  tbody.innerHTML = students.map(s => `
    <tr>
      <td>${escHtml(s.name)}</td>
      <td>${escHtml(s.course)}</td>
      <td>${gpaTag(s.gpa)}</td>
      <td>${s.age}</td>
    </tr>
  `).join('');
}

/* ----------------------------------------------------------------
   STUDENT LIST
---------------------------------------------------------------- */
async function renderStudentList(query = '') {
  const students = query
    ? await StudentAPI.search(query)
    : await StudentAPI.getAll();

  // Keep full cache updated
  if (!query) state.students = students;

  const grid     = $('student-cards');
  const noResult = $('no-results');
  grid.innerHTML = '';

  if (!students.length) {
    noResult.classList.remove('hidden');
    return;
  }
  noResult.classList.add('hidden');

  students.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.style.animationDelay = `${i * 0.06}s`;
    card.innerHTML = buildCard(s);
    grid.appendChild(card);
  });

  // Attach card button listeners
  grid.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditForm(parseInt(btn.dataset.id)));
  });
  grid.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete(parseInt(btn.dataset.id), btn.dataset.name));
  });
}

function buildCard(s) {
  const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const gpaClass = s.gpa >= 3.5 ? '' : s.gpa >= 2.5 ? 'medium' : 'low';
  const barWidth = Math.round((s.gpa / 4) * 100);

  return `
    <div class="card-header">
      <div class="card-avatar">${initials}</div>
      <div class="card-info">
        <p class="card-name">${escHtml(s.name)}</p>
        <p class="card-course">${escHtml(s.course)}</p>
      </div>
    </div>
    <p class="card-email">
      <i class="fas fa-envelope" style="margin-right:5px;opacity:.6"></i>${escHtml(s.email)}
    </p>
    <div class="card-details">
      <span class="card-badge"><i class="fas fa-birthday-cake"></i> Age ${s.age}</span>
      <span class="card-badge gpa-badge ${gpaClass}">
        <i class="fas fa-star"></i> GPA ${s.gpa.toFixed(2)}
      </span>
    </div>
    <div class="gpa-bar-wrap">
      <div class="gpa-bar-fill" style="width:${barWidth}%"></div>
    </div>
    <div class="card-actions">
      <button class="btn-icon btn-edit"
              data-id="${s.id}"
              data-name="${escHtml(s.name)}"
              aria-label="Edit ${escHtml(s.name)}">
        <i class="fas fa-pencil-alt"></i> Edit
      </button>
      <button class="btn-icon btn-del"
              data-id="${s.id}"
              data-name="${escHtml(s.name)}"
              aria-label="Delete ${escHtml(s.name)}">
        <i class="fas fa-trash-alt"></i> Delete
      </button>
    </div>
  `;
}

/* ----------------------------------------------------------------
   SEARCH
---------------------------------------------------------------- */
let searchDebounce;
$('search-input').addEventListener('input', e => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => renderStudentList(e.target.value.trim()), 280);
});

/* ----------------------------------------------------------------
   FORM — ADD / EDIT
---------------------------------------------------------------- */
function openAddForm() {
  state.editId = null;
  $('form-title').textContent = 'Add New Student';
  $('submit-btn').innerHTML   = '<i class="fas fa-save"></i> Save Student';
  $('student-form').reset();
  clearFieldErrors();

  // Manually switch to add view without triggering student list fetch
  views.forEach(v => v.classList.remove('active'));
  navBtns.forEach(b => b.classList.remove('active'));
  $('view-add').classList.add('active');
  document.querySelector('.nav-btn[data-view="add"]').classList.add('active');
}

async function openEditForm(id) {
  try {
    const s = await StudentAPI.getById(id);
    state.editId = id;

    $('form-title').textContent = 'Edit Student';
    $('submit-btn').innerHTML   = '<i class="fas fa-save"></i> Update Student';

    $('student-id').value = s.id;
    $('f-name').value     = s.name;
    $('f-email').value    = s.email;
    $('f-course').value   = s.course;
    $('f-age').value      = s.age;
    $('f-gpa').value      = s.gpa;

    clearFieldErrors();

    // Manually switch to add view
    views.forEach(v => v.classList.remove('active'));
    navBtns.forEach(b => b.classList.remove('active'));
    $('view-add').classList.add('active');
    document.querySelector('.nav-btn[data-view="add"]').classList.add('active');
  } catch (err) {
    showToast('Could not load student data.', 'error');
  }
}

$('cancel-btn').addEventListener('click', () => showView('students'));

/* ----------------------------------------------------------------
   FORM VALIDATION
---------------------------------------------------------------- */
function validateForm() {
  let valid = true;
  clearFieldErrors();

  const name   = $('f-name').value.trim();
  const email  = $('f-email').value.trim();
  const course = $('f-course').value;
  const age    = parseInt($('f-age').value);
  const gpa    = parseFloat($('f-gpa').value);

  if (!name) {
    setError('f-name', 'err-name', 'Name is required.');
    valid = false;
  } else if (name.length < 2) {
    setError('f-name', 'err-name', 'Name must be at least 2 characters.');
    valid = false;
  }

  if (!email) {
    setError('f-email', 'err-email', 'Email is required.');
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('f-email', 'err-email', 'Enter a valid email address.');
    valid = false;
  }

  if (!course) {
    setError('f-course', 'err-course', 'Please select a course.');
    valid = false;
  }

  if (isNaN(age) || age < 16 || age > 80) {
    setError('f-age', 'err-age', 'Age must be between 16 and 80.');
    valid = false;
  }

  if (isNaN(gpa) || gpa < 0 || gpa > 4) {
    setError('f-gpa', 'err-gpa', 'GPA must be between 0.00 and 4.00.');
    valid = false;
  }

  return valid;
}

function setError(fieldId, errId, msg) {
  $(fieldId).classList.add('invalid');
  $(errId).textContent = msg;
}

function clearFieldErrors() {
  ['f-name','f-email','f-course','f-age','f-gpa'].forEach(id => {
    $(id).classList.remove('invalid');
  });
  ['err-name','err-email','err-course','err-age','err-gpa'].forEach(id => {
    $(id).textContent = '';
  });
}

/* ----------------------------------------------------------------
   FORM SUBMIT — after save, refresh dashboard + go to students
---------------------------------------------------------------- */
$('student-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!validateForm()) return;

  const student = {
    id:     state.editId || 0,
    name:   $('f-name').value.trim(),
    email:  $('f-email').value.trim(),
    course: $('f-course').value,
    age:    parseInt($('f-age').value),
    gpa:    parseFloat(parseFloat($('f-gpa').value).toFixed(2)),
  };

  try {
    if (state.editId) {
      await StudentAPI.update(student);
      showToast(`${student.name} updated successfully.`);
    } else {
      await StudentAPI.create(student);
      showToast(`${student.name} added successfully.`);
    }

    // Refresh dashboard stats immediately (background)
    await refreshDashboard();

    // Navigate to students list (also fetches fresh data)
    showView('students');
  } catch (err) {
    showToast(err.error || 'Something went wrong.', 'error');
  }
});

/* ----------------------------------------------------------------
   DELETE MODAL
---------------------------------------------------------------- */
function confirmDelete(id, name) {
  state.deleteId = id;
  $('modal-msg').textContent = `Delete "${name}"? This action cannot be undone.`;
  overlay.classList.remove('hidden');
}

$('modal-cancel').addEventListener('click', () => {
  overlay.classList.add('hidden');
  state.deleteId = null;
});

$('modal-confirm').addEventListener('click', async () => {
  if (!state.deleteId) return;
  try {
    await StudentAPI.delete(state.deleteId);
    showToast('Student deleted.');
    overlay.classList.add('hidden');
    state.deleteId = null;

    // Refresh both the student list AND dashboard stats
    await refreshDashboard();
    renderStudentList();
  } catch (err) {
    showToast('Delete failed.', 'error');
    overlay.classList.add('hidden');
  }
});

// Close modal on backdrop click
overlay.addEventListener('click', e => {
  if (e.target === overlay) {
    overlay.classList.add('hidden');
    state.deleteId = null;
  }
});

/* ----------------------------------------------------------------
   TOAST NOTIFICATIONS
---------------------------------------------------------------- */
let toastTimer;
function showToast(message, type = 'success') {
  const icon = type === 'success' ? '✓' : '✕';
  toast.textContent = `${icon}  ${message}`;
  toast.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

/* ----------------------------------------------------------------
   HELPERS
---------------------------------------------------------------- */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function gpaTag(gpa) {
  const cls = gpa >= 3.5 ? 'color:#16a34a' : gpa >= 2.5 ? 'color:#d97706' : 'color:#dc2626';
  return `<strong style="${cls}">${gpa.toFixed(2)}</strong>`;
}

/* ----------------------------------------------------------------
   BOOT
---------------------------------------------------------------- */
(async function init() {
  await renderDashboard();
  showView('dashboard');
})();
