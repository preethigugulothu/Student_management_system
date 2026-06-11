/**
 * api.js — Abstraction layer for all backend calls.
 *
 * When running without a Java backend (demo mode), all operations
 * are performed on an in-memory store so the UI works standalone.
 */

const API_BASE = '/api/students';

/* ----------------------------------------------------------------
   Detect whether a real backend is available.
   Falls back to DEMO_STORE if not.
---------------------------------------------------------------- */
let USE_DEMO = true; // set to false when deploying with Tomcat

/* ---------- DEMO STORE — backed by localStorage ---------- */
const DEMO_STORE = (() => {
  const STORAGE_KEY    = 'studentapp_data';
  const STORAGE_ID_KEY = 'studentapp_nextid';

  const DEFAULT_STUDENTS = [
    { id: 1, name: 'Alice Johnson',  email: 'alice@email.com',  course: 'Computer Science', age: 20, gpa: 3.8 },
    { id: 2, name: 'Bob Martinez',   email: 'bob@email.com',    course: 'Mathematics',       age: 22, gpa: 3.5 },
    { id: 3, name: 'Clara Nguyen',   email: 'clara@email.com',  course: 'Physics',           age: 21, gpa: 3.9 },
    { id: 4, name: 'David Kim',      email: 'david@email.com',  course: 'Engineering',       age: 23, gpa: 3.2 },
    { id: 5, name: 'Eva Brown',      email: 'eva@email.com',    course: 'Biology',           age: 20, gpa: 3.7 },
  ];

  /** Load data from localStorage, seed defaults on first run */
  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      save(DEFAULT_STUDENTS);
      return [...DEFAULT_STUDENTS];
    }
    return JSON.parse(raw);
  }

  /** Persist current data array to localStorage */
  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /** Get / increment the auto-increment id counter */
  function nextId() {
    const current = parseInt(localStorage.getItem(STORAGE_ID_KEY) || '6', 10);
    localStorage.setItem(STORAGE_ID_KEY, current + 1);
    return current;
  }

  return {
    getAll() {
      return Promise.resolve(load());
    },

    getById(id) {
      const s = load().find(x => x.id === id);
      return s ? Promise.resolve({...s}) : Promise.reject(new Error('Not found'));
    },

    search(q) {
      const lower = q.toLowerCase();
      return Promise.resolve(
        load().filter(s =>
          s.name.toLowerCase().includes(lower) ||
          s.course.toLowerCase().includes(lower)
        )
      );
    },

    create(body) {
      const data = load();
      const s = { ...body, id: nextId() };
      data.push(s);
      save(data);
      return Promise.resolve({...s});
    },

    update(body) {
      const data = load();
      const i = data.findIndex(x => x.id === body.id);
      if (i === -1) return Promise.reject(new Error('Not found'));
      data[i] = { ...body };
      save(data);
      return Promise.resolve({...body});
    },

    delete(id) {
      const data = load();
      const i = data.findIndex(x => x.id === id);
      if (i === -1) return Promise.reject(new Error('Not found'));
      data.splice(i, 1);
      save(data);
      return Promise.resolve({ message: 'Deleted' });
    },
  };
})();

/* ----------------------------------------------------------------
   PUBLIC API — returns Promises regardless of mode
---------------------------------------------------------------- */
const StudentAPI = {

  /** Fetch all students */
  getAll() {
    if (USE_DEMO) return DEMO_STORE.getAll();
    return fetch(API_BASE)
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
  },

  /** Fetch a single student by id */
  getById(id) {
    if (USE_DEMO) return DEMO_STORE.getById(id);
    return fetch(`${API_BASE}?id=${id}`)
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
  },

  /** Search students */
  search(query) {
    if (USE_DEMO) return DEMO_STORE.search(query);
    return fetch(`${API_BASE}?q=${encodeURIComponent(query)}`)
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
  },

  /** Create a new student */
  create(student) {
    if (USE_DEMO) return DEMO_STORE.create(student);
    return fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
  },

  /** Update an existing student */
  update(student) {
    if (USE_DEMO) return DEMO_STORE.update(student);
    return fetch(API_BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
  },

  /** Delete a student by id */
  delete(id) {
    if (USE_DEMO) return DEMO_STORE.delete(id);
    return fetch(`${API_BASE}?id=${id}`, { method: 'DELETE' })
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
  },
};
