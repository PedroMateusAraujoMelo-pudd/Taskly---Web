// public/app.js
(() => {
  let state = {
    projects: [], 
    tasks: []     
  };

  const formArea = document.getElementById('form-area');
  const list = document.getElementById('list');
  const btnNewTask = document.getElementById('btn-new-task');
  const btnNewProject = document.getElementById('btn-new-project');

  // --- FUNÇÕES DE API ---

  async function loadData() {
    try {
      const res = await fetch('/api/data');
      if (res.status === 401) window.location.href = '/login.html';
      const data = await res.json();
      state = data;
      render();
    } catch (e) {
      console.error("Erro ao carregar dados", e);
    }
  }

  async function createProject(title) {
    await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
    });
    loadData();
  }

  async function createTask(title, projectId = null) {
    await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, projectId })
    });
    loadData();
  }

  async function toggleTask(id, done) {
    await fetch(`/api/tasks/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done })
    });
    loadData();
  }

  async function deleteTask(id) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    loadData();
  }

  async function deleteProject(id) {
    if(!confirm("Tem certeza? Todas as tarefas deste projeto serão apagadas.")) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    loadData();
  }

  // --- RENDERIZAÇÃO ---

  function render() {
    list.innerHTML = '';

    // Renderiza Tarefas Soltas (Inbox) com título genérico
    if (state.tasks && state.tasks.length) {
      const title = document.createElement('h4');
      title.textContent = 'Minhas Tarefas'; // MUDANÇA AQUI (Era Tarefas Individuais)
      list.appendChild(title);
      state.tasks.forEach(t => list.appendChild(renderTaskItem(t, null)));
    }

    // Renderiza Projetos
    if (state.projects) {
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
  }

  function renderTaskItem(t, projectId) {
    const el = document.createElement('div');
    el.className = 'item task';

    const left = document.createElement('div');
    left.innerHTML = `<input type="checkbox" data-action="toggle" data-id="${t.id}" ${t.done? 'checked' : ''}/> <span class="title ${t.done? 'completed' : ''}">${escapeHtml(t.title)}</span>`;

    const right = document.createElement('div');
    right.innerHTML = `<button class="btn btn-danger" data-action="delete-task" data-id="${t.id}">Excluir</button>`;

    el.appendChild(left);
    el.appendChild(right);
    return el;
  }

  // --- FORMULÁRIOS ---

  function showNewTaskForm(targetProjectId = null) {
    formArea.innerHTML = '';
    const form = document.createElement('form');
    form.className = 'form';

    const input = document.createElement('input');
    input.className = 'input';
    // MUDANÇA AQUI: Texto genérico para qualquer situação
    input.placeholder = 'Digite sua nova tarefa...'; 
    input.required = true;

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
      createTask(title, targetProjectId);
      formArea.innerHTML = '';
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
    input.placeholder = 'Nome do Projeto';
    input.required = true;

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
      createProject(title);
      formArea.innerHTML = '';
    });

    formArea.appendChild(form);
    input.focus();
  }

  // --- EVENTOS GLOBAIS ---

  document.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    if (action === 'add-task') {
      const projId = parseInt(e.target.dataset.proj, 10);
      showNewTaskForm(projId);
    }
    if (action === 'delete-project') {
      const projId = parseInt(e.target.dataset.proj, 10);
      deleteProject(projId);
    }
    if (action === 'delete-task') {
      const id = parseInt(e.target.dataset.id, 10);
      deleteTask(id);
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.dataset.action === 'toggle') {
      const id = parseInt(e.target.dataset.id, 10);
      toggleTask(id, e.target.checked);
    }
  });

  btnNewTask.addEventListener('click', () => showNewTaskForm(null));
  btnNewProject.addEventListener('click', () => showNewProjectForm());

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function(m) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[m];
    });
  }

  loadData();

})();