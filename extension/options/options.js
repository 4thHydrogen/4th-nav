document.addEventListener('DOMContentLoaded', async () => {
  const serverUrlInput = document.getElementById('serverUrl');
  const apiTokenInput = document.getElementById('apiToken');
  const testBtn = document.getElementById('testBtn');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');

  const saved = await chrome.storage.sync.get(['serverUrl', 'apiToken']);
  if (saved.serverUrl) serverUrlInput.value = saved.serverUrl;
  if (saved.apiToken) apiTokenInput.value = saved.apiToken;

  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';
  }

  saveBtn.addEventListener('click', async () => {
    const serverUrl = serverUrlInput.value.trim();
    const apiToken = apiTokenInput.value.trim();

    if (!serverUrl) {
      showStatus('请输入服务器地址', 'error');
      return;
    }

    await chrome.storage.sync.set({ serverUrl, apiToken });
    showStatus('设置已保存', 'success');
  });

  testBtn.addEventListener('click', async () => {
    const serverUrl = serverUrlInput.value.trim();
    const apiToken = apiTokenInput.value.trim();

    if (!serverUrl) {
      showStatus('请先输入服务器地址', 'error');
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = '测试中...';

    try {
      const result = await testConnection();
      if (result.authenticated) {
        showStatus(`连接成功！站点: ${result.title || '未命名'}，认证有效`, 'success');
      } else {
        showStatus(`服务器可达（站点: ${result.title || '未命名'}），但 API Token 无效或未配置`, 'info');
      }
    } catch (e) {
      showStatus(`连接失败: ${e.message}`, 'error');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = '测试连接';
    }
  });
});
