(() => {
  // Estado simples em memória (substitua por chamadas ao servidor quando quiser persistir)
  const state = {
    projects: [], // { id, title, tasks: [ {id, title, done} ] }
    tasks: []     // tarefas soltas: { id, title, done }
  };

  const $ = (sel) => document.querySelector(sel);
  let idCounter = 1;
  const nextId = () => idCounter++;

  const btnNewTask = document.getElementById('btn-new-task');
  const btnNewProject = document.getElementById('btn-new-project');
  const formArea = document.getElementById('form-area');
  const list = document.getElementById('list');

  function render() {
    list.innerHTML = '';

    if (state.tasks.length) {
      const title = document.createElement('h4');
      title.textContent = 'Tarefas Individuais';
      list.appendChild(title);
      state.tasks.forEach(t => list.appendChild(renderTaskItem(t, null)));
    }

    state.projects.forEach(p => {
      const wrapper = document.createElement('div');
      wrapper.className = 'item project';

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';

      const left = document.createElement('div');
      left.innerHTML = `<strong>${escapeHtml(p.title)}</strong> <div class="meta">${p.tasks.length} tarefas</div>`;

      const right = document.createElement('div');
      right.innerHTML = `
        <button class="btn btn-primary" data-action="add-task" data-proj="${p.id}">+ Tarefa</button>
        <button class="btn btn-danger" data-action="delete-project" data-proj="${p.id}">Excluir</button>
      `;

      header.appendChild(left);
      header.appendChild(right);
      wrapper.appendChild(header);

      p.tasks.forEach(t => wrapper.appendChild(renderTaskItem(t, p.id)));

      list.appendChild(wrapper);
    });
  }

  function renderTaskItem(t, projectId) {
    const el = document.createElement('div');
    el.className = 'item task';

    const left = document.createElement('div');
    left.innerHTML = `<input type="checkbox" data-action="toggle" data-id="${t.id}" ${t.done? 'checked' : ''}/> <span class="title ${t.done? 'completed' : ''}">${escapeHtml(t.title)}</span>`;

    const right = document.createElement('div');
    right.innerHTML = projectId ?
      `<button class="btn btn-danger" data-action="delete-task" data-proj="${projectId}" data-id="${t.id}">Excluir</button>` :
      `<button class="btn btn-danger" data-action="delete-task" data-id="${t.id}">Excluir</button>`;

    el.appendChild(left);
    el.appendChild(right);

    return el;
  }

  function showNewTaskForm(targetProjectId = null) {
    formArea.innerHTML = '';
    const form = document.createElement('form');
    form.className = 'form';

    const input = document.createElement('input');
    input.className = 'input';
    input.placeholder = targetProjectId ? 'Título da tarefa (no projeto)' : 'Título da tarefa individual';

    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.type = 'submit';
    btn.textContent = 'Adicionar';

    form.appendChild(input);
    form.appendChild(btn);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = input.value.trim();
      if (!title) return;

      const task = { id: nextId(), title, done: false };
      if (targetProjectId) {
        const proj = state.projects.find(p => p.id === targetProjectId);
        proj.tasks.push(task);
      } else {
        state.tasks.push(task);
      }

      input.value = '';
      formArea.innerHTML = '';
      render();
    });

    formArea.appendChild(form);
    input.focus();
  }

  function showNewProjectForm() {
    formArea.innerHTML = '';
    const form = document.createElement('form');
    form.className = 'form';

    const input = document.createElement('input');
    input.className = 'input';
    input.placeholder = 'Título do projeto';

    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.type = 'submit';
    btn.textContent = 'Criar Projeto';

    form.appendChild(input);
    form.appendChild(btn);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = input.value.trim();
      if (!title) return;

      const project = { id: nextId(), title, tasks: [] };
      state.projects.push(project);

      input.value = '';
      formArea.innerHTML = '';
      render();
    });

    formArea.appendChild(form);
    input.focus();
  }

  document.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    if (action === 'add-task') {
      const projId = parseInt(e.target.dataset.proj, 10);
      showNewTaskForm(projId);
    }

    if (action === 'delete-project') {
      const projId = parseInt(e.target.dataset.proj, 10);
      state.projects = state.projects.filter(p => p.id !== projId);
      render();
    }

    if (action === 'delete-task') {
      const id = parseInt(e.target.dataset.id, 10);
      const projId = e.target.dataset.proj ? parseInt(e.target.dataset.proj, 10) : null;
      if (projId) {
        const proj = state.projects.find(p => p.id === projId);
        proj.tasks = proj.tasks.filter(t => t.id !== id);
      } else {
        state.tasks = state.tasks.filter(t => t.id !== id);
      }
      render();
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.dataset.action === 'toggle') {
      const id = parseInt(e.target.dataset.id, 10);
      let found = state.tasks.find(t => t.id === id);
      if (found) { found.done = e.target.checked; render(); return; }
      for (const p of state.projects) {
        const t = p.tasks.find(x => x.id === id);
        if (t) { t.done = e.target.checked; render(); return; }
      }
    }
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  btnNewTask.addEventListener('click', () => showNewTaskForm());
  btnNewProject.addEventListener('click', () => showNewProjectForm());

  render();
})();
