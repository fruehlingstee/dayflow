(function () {
  const oldBind = bind;
  const todayKey = () => dayKey(new Date());
  const repeatLabel = { none: '', daily: '毎日', weekly: '毎週', monthly: '毎月' };

  data.tasks = data.tasks.map(task => ({
    ...task,
    repeat: task.repeat || 'none',
    subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    reminderAt: task.reminderAt || '',
    notified: Boolean(task.notified)
  }));
  save();

  function nextDate(task) {
    const base = task.due ? new Date(task.due + 'T12:00:00') : new Date();
    if (task.repeat === 'daily') base.setDate(base.getDate() + 1);
    if (task.repeat === 'weekly') base.setDate(base.getDate() + 7);
    if (task.repeat === 'monthly') base.setMonth(base.getMonth() + 1);
    return dayKey(base);
  }

  function spawnRepeat(task) {
    if (task.repeat === 'none' || data.tasks.some(item => item.repeatParent == task.id && !item.done)) return;
    data.tasks.unshift({
      id: Date.now(),
      title: task.title,
      priority: task.priority,
      due: nextDate(task),
      note: task.note || '',
      done: false,
      created: new Date().toISOString(),
      repeat: task.repeat,
      repeatParent: task.id,
      reminderAt: '',
      notified: false,
      subtasks: task.subtasks.map(sub => ({ id: Date.now() + Math.random(), title: sub.title, done: false }))
    });
  }

  tasks = function () {
    const total = data.tasks.length;
    const done = data.tasks.filter(task => task.done).length;
    const overdue = data.tasks.filter(task => !task.done && task.due && task.due < todayKey()).length;
    return `<main class="page">
      <div class="page-head">
        <h1 class="title">タスク</h1>
        <div class="toolbar compact">
          <button class="button dim" id="enableNotifications">通知</button>
          <button class="button dim" id="exportData">バックアップ</button>
          <label class="button dim file-button">復元<input id="importData" type="file" accept="application/json"></label>
        </div>
      </div>
      <section class="stats">
        <div class="stat"><b>${total}</b><span>合計</span></div>
        <div class="stat"><b>${total - done}</b><span>未完了</span></div>
        <div class="stat"><b>${done}</b><span>完了</span></div>
        <div class="stat"><b class="${overdue ? 'red' : ''}">${overdue}</b><span>期限超過</span></div>
      </section>
      <form class="toolbar" id="taskForm">
        <input class="input" id="taskInput" required maxlength="120" placeholder="新しいタスク">
        <select class="select" id="taskPriority"><option value="high">優先度 高</option><option value="medium" selected>優先度 中</option><option value="low">優先度 低</option></select>
        <input class="select" id="taskDue" type="date">
        <select class="select" id="taskRepeat"><option value="none">繰り返しなし</option><option value="daily">毎日</option><option value="weekly">毎週</option><option value="monthly">毎月</option></select>
        <button class="button">追加</button>
      </form>
      <div class="toolbar">
        <input class="input" id="search" value="${esc(query)}" placeholder="タスク・メモを検索">
        <select class="select" id="sort"><option value="created">追加順</option><option value="due">期限順</option><option value="priority">優先度順</option><option value="name">名前順</option></select>
      </div>
      <div class="filters">
        ${[['all','すべて'],['open','未完了'],['done','完了'],['overdue','期限超過'],['repeat','繰り返し']].map(item => `<button class="filter ${filter === item[0] ? 'active' : ''}" data-filter="${item[0]}">${item[1]}</button>`).join('')}
      </div>
      <section class="panel task-panel" id="taskList"></section>
    </main>`;
  };

  getTasks = function () {
    const rank = { high: 0, medium: 1, low: 2 };
    const sort = document.querySelector('#sort')?.value || 'created';
    return data.tasks.filter(task => {
      const matches = filter === 'all' ||
        filter === 'open' && !task.done ||
        filter === 'done' && task.done ||
        filter === 'overdue' && !task.done && task.due && task.due < todayKey() ||
        filter === 'repeat' && task.repeat !== 'none';
      return matches && (task.title + ' ' + (task.note || '')).toLowerCase().includes(query.toLowerCase());
    }).sort((a, b) => sort === 'name' ? a.title.localeCompare(b.title, 'ja') :
      sort === 'priority' ? rank[a.priority] - rank[b.priority] :
      sort === 'due' ? (a.due || '9999').localeCompare(b.due || '9999') :
      new Date(b.created) - new Date(a.created));
  };

  drawTasks = function () {
    const list = document.querySelector('#taskList');
    const tasks = getTasks();
    list.innerHTML = tasks.length ? tasks.map(task => {
      const subDone = task.subtasks.filter(sub => sub.done).length;
      const meta = [
        `<span class="tag">● ${task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}</span>`,
        task.due ? `<span>${task.due}</span>` : '',
        task.repeat !== 'none' ? `<span>↻ ${repeatLabel[task.repeat]}</span>` : '',
        task.subtasks.length ? `<span>☑ ${subDone}/${task.subtasks.length}</span>` : '',
        task.reminderAt ? '<span>通知あり</span>' : '',
        task.note ? '<span>メモあり</span>' : ''
      ].filter(Boolean).join('');
      return `<article class="task ${task.done ? 'done' : ''}">
        <input class="check" type="checkbox" data-toggle="${task.id}" ${task.done ? 'checked' : ''} aria-label="完了">
        <div><div class="task-title">${esc(task.title)}</div><div class="meta">${meta}</div></div>
        <div class="task-actions"><button data-edit="${task.id}">編集</button></div>
      </article>`;
    }).join('') : '<div class="empty">条件に一致するタスクはありません</div>';

    document.querySelectorAll('[data-toggle]').forEach(input => input.onchange = () => {
      const task = data.tasks.find(item => item.id == input.dataset.toggle);
      task.done = input.checked;
      if (task.done) spawnRepeat(task);
      save();
      render();
    });
    document.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => editTask(button.dataset.edit));
  };

  editTask = function (id) {
    const task = data.tasks.find(item => item.id == id);
    const subtasks = task.subtasks.map(sub => `<div class="subtask-row">
      <input type="checkbox" data-sub-toggle="${sub.id}" ${sub.done ? 'checked' : ''}>
      <span class="${sub.done ? 'struck' : ''}">${esc(sub.title)}</span>
      <button class="ghost" data-sub-remove="${sub.id}">×</button>
    </div>`).join('') || '<div class="subtask-empty">サブタスクはありません</div>';

    modal(`<h2>タスクを編集</h2>
      <label>タスク名</label><input class="input" id="editTitle" maxlength="120" value="${esc(task.title)}">
      <div class="modal-grid">
        <div><label>優先度</label><select class="select" id="editPriority"><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select></div>
        <div><label>期限</label><input class="input" id="editDue" type="date" value="${task.due || ''}"></div>
        <div><label>繰り返し</label><select class="select" id="editRepeat"><option value="none">なし</option><option value="daily">毎日</option><option value="weekly">毎週</option><option value="monthly">毎月</option></select></div>
        <div><label>通知日時</label><input class="input" id="editReminder" type="datetime-local" value="${task.reminderAt || ''}"></div>
      </div>
      <label>メモ</label><textarea id="editNote" rows="3">${esc(task.note || '')}</textarea>
      <label>サブタスク</label><div class="subtasks">${subtasks}</div>
      <div class="toolbar bottomless"><input class="input" id="newSubtask" placeholder="サブタスク"><button class="button dim" id="addSubtask">追加</button></div>
      <div class="modal-actions"><button class="button dim" id="cancelEdit">キャンセル</button><button class="button" id="saveEdit">保存</button></div>
      <div class="danger-zone"><p>次の確認画面で削除を確定します。</p><button class="button danger" id="askDelete">削除へ進む</button></div>`);

    document.querySelector('#editPriority').value = task.priority;
    document.querySelector('#editRepeat').value = task.repeat;
    document.querySelector('#cancelEdit').onclick = closeModal;
    document.querySelector('#saveEdit').onclick = () => {
      const previousReminder = task.reminderAt;
      task.title = document.querySelector('#editTitle').value.trim() || task.title;
      task.priority = document.querySelector('#editPriority').value;
      task.due = document.querySelector('#editDue').value;
      task.repeat = document.querySelector('#editRepeat').value;
      task.reminderAt = document.querySelector('#editReminder').value;
      task.note = document.querySelector('#editNote').value;
      if (previousReminder !== task.reminderAt) task.notified = false;
      save(); closeModal(); render();
    };
    document.querySelector('#addSubtask').onclick = () => {
      const title = document.querySelector('#newSubtask').value.trim();
      if (!title) return;
      task.subtasks.push({ id: Date.now(), title, done: false });
      save(); editTask(task.id);
    };
    document.querySelectorAll('[data-sub-toggle]').forEach(input => input.onchange = () => {
      task.subtasks.find(sub => sub.id == input.dataset.subToggle).done = input.checked;
      save(); editTask(task.id);
    });
    document.querySelectorAll('[data-sub-remove]').forEach(button => button.onclick = () => {
      task.subtasks = task.subtasks.filter(sub => sub.id != button.dataset.subRemove);
      save(); editTask(task.id);
    });
    document.querySelector('#askDelete').onclick = () => confirmDelete('このタスクを完全に削除しますか？', () => {
      data.tasks = data.tasks.filter(item => item.id != task.id);
      save(); closeModal(); render();
    });
  };

  calendar = function () {
    const year = month.getFullYear(), currentMonth = month.getMonth();
    const start = new Date(year, currentMonth, 1).getDay();
    const days = new Date(year, currentMonth + 1, 0).getDate();
    let cells = ['日','月','火','水','木','金','土'].map(day => `<div class="dayname">${day}</div>`);
    for (let index = 0; index < start; index++) cells.push('<div class="day"></div>');
    for (let day = 1; day <= days; day++) {
      const key = `${year}-${String(currentMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const events = data.events.filter(event => event.date === key).map(event => `<div class="event">${esc(event.time || '終日')} ${esc(event.title)}</div>`);
      const dueTasks = data.tasks.filter(task => !task.done && task.due === key).map(task => `<div class="event task-event">期限 ${esc(task.title)}</div>`);
      cells.push(`<div class="day ${key === todayKey() ? 'today' : ''}"><b>${day}</b>${events.concat(dueTasks).join('')}</div>`);
    }
    return `<main class="page">
      <div class="page-head"><h1 class="title">${year}年 ${currentMonth + 1}月</h1><div><button class="ghost" id="prevMonth">←</button><button class="ghost" id="todayMonth">今日</button><button class="ghost" id="nextMonth">→</button></div></div>
      <form class="toolbar" id="eventForm"><input class="select" id="eventDate" type="date" value="${todayKey()}" required><input class="select" id="eventTime" type="time"><input class="input" id="eventTitle" required placeholder="予定"><button class="button">追加</button></form>
      <section class="panel calendar-panel"><div class="calendar">${cells.join('')}</div></section>
    </main>`;
  };

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `dayflow-${todayKey()}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = JSON.parse(String(reader.result));
        if (!Array.isArray(incoming.tasks) || !Array.isArray(incoming.events) || !Array.isArray(incoming.notes)) throw new Error();
        modal(`<h2>バックアップを復元</h2><p>現在のデータを選択したバックアップで置き換えます。</p><div class="modal-actions"><button class="button dim" id="cancelImport">キャンセル</button><button class="button" id="confirmImport">復元する</button></div>`);
        document.querySelector('#cancelImport').onclick = closeModal;
        document.querySelector('#confirmImport').onclick = () => {
          data = { tasks: incoming.tasks.map(task => ({ ...task, repeat: task.repeat || 'none', subtasks: task.subtasks || [], reminderAt: task.reminderAt || '', notified: false })), events: incoming.events, notes: incoming.notes, sessions: incoming.sessions || [] };
          save(); closeModal(); render();
        };
      } catch {
        alert('Dayflowのバックアップファイルではありません。');
      }
    };
    reader.readAsText(file);
  }

  function enableNotifications() {
    if (!('Notification' in window)) return alert('このブラウザは通知に対応していません。');
    Notification.requestPermission().then(permission => alert(permission === 'granted' ? '通知を有効にしました。' : '通知は許可されませんでした。'));
  }

  function checkReminders() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    let changed = false;
    data.tasks.forEach(task => {
      if (!task.done && task.reminderAt && !task.notified && new Date(task.reminderAt).getTime() <= Date.now()) {
        new Notification('Dayflow', { body: task.title });
        task.notified = true;
        changed = true;
      }
    });
    if (changed) save();
  }

  bind = function () {
    if (page !== 'tasks' && page !== 'calendar') oldBind();
    if (page === 'tasks') {
      document.querySelector('#taskForm').onsubmit = event => {
        event.preventDefault();
        const title = document.querySelector('#taskInput').value.trim();
        if (!title) return;
        data.tasks.unshift({
          id: Date.now(), title, priority: document.querySelector('#taskPriority').value,
          due: document.querySelector('#taskDue').value, note: '', done: false,
          created: new Date().toISOString(), repeat: document.querySelector('#taskRepeat').value,
          subtasks: [], reminderAt: '', notified: false
        });
        save(); render();
      };
      document.querySelector('#enableNotifications').onclick = enableNotifications;
      document.querySelector('#exportData').onclick = exportData;
      document.querySelector('#importData').onchange = event => event.target.files[0] && importData(event.target.files[0]);
      document.querySelector('#search').oninput = event => { query = event.target.value; drawTasks(); };
      document.querySelector('#sort').onchange = drawTasks;
      document.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => { filter = button.dataset.filter; render(); });
      drawTasks();
    }
    if (page === 'calendar') {
      document.querySelector('#prevMonth').onclick = () => { month.setMonth(month.getMonth() - 1); render(); };
      document.querySelector('#nextMonth').onclick = () => { month.setMonth(month.getMonth() + 1); render(); };
      document.querySelector('#todayMonth').onclick = () => { month = new Date(); render(); };
      document.querySelector('#eventForm').onsubmit = event => {
        event.preventDefault();
        data.events.push({ id: Date.now(), date: document.querySelector('#eventDate').value, time: document.querySelector('#eventTime').value, title: document.querySelector('#eventTitle').value.trim() });
        save(); render();
      };
    }
  };

  render();
  checkReminders();
  setInterval(checkReminders, 30000);
})();
