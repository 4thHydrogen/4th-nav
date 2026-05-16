document.addEventListener('DOMContentLoaded', async () => {
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}Tab`).classList.add('active');
      if (tab.dataset.tab === 'manage') loadManageTab();
    });
  });

  // Open options
  document.getElementById('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Check config and load save tab
  await initSaveTab();

  // Save button
  document.getElementById('saveBtn').addEventListener('click', handleSave);

  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', loadManageTab);

  // Edit modal
  document.getElementById('editCancel').addEventListener('click', closeEditModal);
  document.getElementById('editSave').addEventListener('click', handleEditSave);
});

let currentTab = null;
let categories = [];
let editingToolId = null;

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

async function initSaveTab() {
  const config = await getConfig();
  if (!config.serverUrl || !config.apiToken) {
    document.getElementById('noConfig').style.display = 'block';
    document.getElementById('saveForm').style.display = 'none';
    return;
  }

  document.getElementById('noConfig').style.display = 'none';
  document.getElementById('saveForm').style.display = 'block';

  // Check if opened from context menu (right-click save)
  let contextSave = null;
  try {
    const session = await chrome.storage.session.get('contextSave');
    contextSave = session.contextSave;
    if (contextSave) await chrome.storage.session.remove('contextSave');
  } catch { /* session storage not available */ }

  if (contextSave) {
    currentTab = contextSave;
    document.getElementById('pageTitle').textContent = contextSave.title || '';
    document.getElementById('pageUrl').textContent = contextSave.url || '';
    document.getElementById('toolName').value = contextSave.title || '';
    document.getElementById('favicon').src = contextSave.favIconUrl || '';
  } else {
    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      currentTab = tab;
      document.getElementById('pageTitle').textContent = tab.title || '';
      document.getElementById('pageUrl').textContent = tab.url || '';
      document.getElementById('toolName').value = tab.title || '';
      document.getElementById('favicon').src = tab.favIconUrl || '';
    }
  }

  // Load categories
  try {
    categories = await fetchCategories();
    const datalist = document.getElementById('catelogList');
    datalist.innerHTML = categories.map(c => `<option value="${c}">`).join('');
  } catch {
    // Categories will be empty, user can type custom category
  }
}

async function handleSave() {
  const name = document.getElementById('toolName').value.trim();
  const catelog = document.getElementById('toolCatelog').value.trim();
  const desc = document.getElementById('toolDesc').value.trim();
  const url = currentTab?.url || '';

  if (!name) { showToast('请输入名称', 'error'); return; }
  if (!url) { showToast('无法获取页面 URL', 'error'); return; }

  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = '保存中...';

  try {
    await addTool({ name, url, catelog, desc, logo: currentTab?.favIconUrl || '' });
    showToast('保存成功！');
    // Clear desc and catelog for next save
    document.getElementById('toolDesc').value = '';
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '保存到导航站';
  }
}

async function loadManageTab() {
  const listEl = document.getElementById('toolList');
  const countEl = document.getElementById('toolCount');
  listEl.innerHTML = '<div class="loading">加载中...</div>';
  countEl.textContent = '加载中...';

  try {
    const tools = await fetchTools();
    const visibleTools = tools.filter(t => t.url !== 'admin' && t.url !== 'toggleJumpTarget');
    countEl.textContent = `共 ${visibleTools.length} 个书签`;

    if (visibleTools.length === 0) {
      listEl.innerHTML = '<div class="empty-state">暂无书签</div>';
      return;
    }

    // Group by category
    const groups = {};
    visibleTools.forEach(tool => {
      const cat = tool.catelog || '未分类';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(tool);
    });

    // Load categories for edit datalist
    try {
      categories = await fetchCategories();
      const editDatalist = document.getElementById('editCatelogList');
      editDatalist.innerHTML = categories.map(c => `<option value="${c}">`).join('');
    } catch { /* ignore */ }

    const config = await getConfig();
    let html = '';
    for (const [cat, items] of Object.entries(groups)) {
      html += `<div class="category-section">`;
      html += `<div class="category-title">${escapeHtml(cat)}</div>`;
      items.forEach(tool => {
        const logoSrc = tool.logo
          ? (tool.logo.startsWith('data:') || tool.logo.startsWith('http')
            ? tool.logo
            : `${config.serverUrl}/img/${tool.logo}`)
          : '';
        html += `
          <div class="tool-item" data-id="${tool.id}">
            ${logoSrc ? `<img src="${escapeHtml(logoSrc)}" alt="" onerror="this.style.display='none'">` : ''}
            <span class="tool-item-name">${escapeHtml(tool.name)}</span>
            <div class="tool-item-actions">
              <button class="edit-btn" data-id="${tool.id}" title="编辑">&#9998;</button>
              <button class="delete-btn" data-id="${tool.id}" title="删除">&#10005;</button>
            </div>
          </div>`;
      });
      html += `</div>`;
    }

    listEl.innerHTML = html;

    // Bind events
    listEl.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id), visibleTools));
    });
    listEl.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => handleDelete(parseInt(btn.dataset.id), btn));
    });
  } catch (e) {
    listEl.innerHTML = `<div class="empty-state">${escapeHtml(e.message)}</div>`;
    countEl.textContent = '加载失败';
  }
}

async function handleDelete(id, btn) {
  if (!confirm('确定要删除这个书签吗？')) return;

  try {
    await deleteTool(id);
    showToast('已删除');
    loadManageTab();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function openEditModal(id, tools) {
  const tool = tools.find(t => t.id === id);
  if (!tool) return;

  editingToolId = id;
  document.getElementById('editName').value = tool.name || '';
  document.getElementById('editUrl').value = tool.url || '';
  document.getElementById('editCatelog').value = tool.catelog || '';
  document.getElementById('editDesc').value = tool.desc || '';
  document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
  editingToolId = null;
}

async function handleEditSave() {
  if (!editingToolId) return;

  const name = document.getElementById('editName').value.trim();
  const url = document.getElementById('editUrl').value.trim();
  const catelog = document.getElementById('editCatelog').value.trim();
  const desc = document.getElementById('editDesc').value.trim();

  if (!name || !url) { showToast('名称和 URL 不能为空', 'error'); return; }

  try {
    await updateTool(editingToolId, { name, url, catelog, desc });
    showToast('已更新');
    closeEditModal();
    loadManageTab();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
