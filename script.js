(function () {
  'use strict';

  var I18N = {
    en: {
      title: 'Tasks', placeholder: 'Add a task', add: 'Add task',
      all: 'All', active: 'Active', done: 'Done',
      empty: { all: 'No tasks yet. Add your first one above.', active: 'Nothing left to do.', done: 'No completed tasks yet.' },
      edit: 'Edit', del: 'Delete', clear: 'Clear completed',
      langBtn: 'عربي', dark: 'Dark', light: 'Light',
      left: function (n) { return n === 0 ? 'All done' : n + (n === 1 ? ' task left' : ' tasks left'); }
    },
    ar: {
      title: 'مهامي', placeholder: 'أضف مهمة', add: 'إضافة',
      all: 'الكل', active: 'النشطة', done: 'المكتملة',
      empty: { all: 'ما فيه مهام للحين. أضف أول مهمة من فوق.', active: 'ما باقي شي تسويه.', done: 'ما فيه مهام مكتملة للحين.' },
      edit: 'تعديل', del: 'حذف', clear: 'حذف المكتملة',
      langBtn: 'English', dark: 'داكن', light: 'فاتح',
      left: function (n) {
        if (n === 0) return 'خلصت كل المهام';
        if (n === 1) return 'مهمة واحدة متبقية';
        if (n === 2) return 'مهمتان متبقيتان';
        return n + (n <= 10 ? ' مهام متبقية' : ' مهمة متبقية');
      }
    }
  };

  var root = document.documentElement;
  var state = { todos: [], filter: 'all', lang: root.lang || 'en', theme: root.dataset.theme || 'light' };

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function persistTodos() { save('todo.items', state.todos); }
  function persistSettings() { save('todo.settings', { lang: state.lang, theme: state.theme }); }

  state.todos = load('todo.items', []);

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    title: $('title'), summary: $('summary'), form: $('addForm'), input: $('newTask'),
    addBtn: $('addBtn'), filters: $('filters'), list: $('list'), empty: $('empty'),
    clear: $('clearBtn'), lang: $('langBtn'), theme: $('themeBtn')
  };

  function t() { return I18N[state.lang]; }

  function applySettings() {
    root.lang = state.lang;
    root.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    root.dataset.theme = state.theme;
    var s = t();
    document.title = s.title;
    els.title.textContent = s.title;
    els.input.placeholder = s.placeholder;
    els.input.setAttribute('aria-label', s.placeholder);
    els.addBtn.textContent = s.add;
    els.clear.textContent = s.clear;
    els.lang.textContent = s.langBtn;
    els.theme.textContent = state.theme === 'dark' ? s.light : s.dark;
    els.filters.querySelectorAll('button').forEach(function (b) {
      b.textContent = s[b.dataset.filter];
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(b.dataset.filter === state.filter));
    });
  }

  function visibleTodos() {
    return state.todos.filter(function (x) {
      return state.filter === 'all' || (state.filter === 'done') === x.done;
    });
  }

  function button(cls, label, handler) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'icon ' + cls; b.textContent = label;
    b.addEventListener('click', handler);
    return b;
  }

  function startEdit(todo, li, textEl) {
    var input = document.createElement('input');
    input.className = 'edit'; input.value = todo.text; input.maxLength = 200;
    var finished = false;
    function finish(commit) {
      if (finished) return; finished = true;
      var v = input.value.trim();
      if (commit && v) { todo.text = v; persistTodos(); }
      render();
    }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', function () { finish(true); });
    li.replaceChild(input, textEl);
    input.focus(); input.select();
  }

  function render() {
    var s = t();
    var items = visibleTodos();
    els.list.textContent = '';
    items.forEach(function (todo) {
      var li = document.createElement('li');
      li.className = 'item' + (todo.done ? ' done' : '');
      var cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = todo.done;
      cb.addEventListener('change', function () { todo.done = cb.checked; persistTodos(); render(); });
      var text = document.createElement('span');
      text.className = 'text'; text.textContent = todo.text;
      text.addEventListener('dblclick', function () { startEdit(todo, li, text); });
      li.append(cb, text,
        button('', s.edit, function () { startEdit(todo, li, text); }),
        button('del', s.del, function () {
          state.todos = state.todos.filter(function (x) { return x.id !== todo.id; });
          persistTodos(); render();
        }));
      els.list.appendChild(li);
    });
    var left = state.todos.filter(function (x) { return !x.done; }).length;
    els.summary.textContent = s.left(left);
    els.empty.hidden = items.length > 0;
    els.empty.textContent = s.empty[state.filter];
    els.clear.disabled = !state.todos.some(function (x) { return x.done; });
  }

  els.form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = els.input.value.trim();
    if (!v) return;
    state.todos.unshift({ id: Date.now() + Math.random(), text: v, done: false });
    els.input.value = '';
    persistTodos(); render();
  });
  els.filters.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.filter = b.dataset.filter; applySettings(); render();
  });
  els.clear.addEventListener('click', function () {
    state.todos = state.todos.filter(function (x) { return !x.done; });
    persistTodos(); render();
  });
  els.lang.addEventListener('click', function () {
    state.lang = state.lang === 'ar' ? 'en' : 'ar';
    persistSettings(); applySettings(); render();
  });
  els.theme.addEventListener('click', function () {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    persistSettings(); applySettings();
  });

  applySettings();
  render();
})();
