async function getConfig() {
  const result = await chrome.storage.sync.get(['serverUrl', 'apiToken']);
  return {
    serverUrl: (result.serverUrl || '').replace(/\/+$/, ''),
    apiToken: result.apiToken || ''
  };
}

async function apiRequest(method, path, body = null) {
  const config = await getConfig();
  if (!config.serverUrl) throw new Error('请先配置服务器地址');
  if (!config.apiToken) throw new Error('请先配置 API Token');

  const options = {
    method,
    headers: {
      'Authorization': config.apiToken,
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${config.serverUrl}/api${path}`, options);
  const data = await res.json();

  if (!res.ok || data.success === false) {
    throw new Error(data.message || `请求失败: ${res.status}`);
  }
  return data;
}

async function publicRequest(path) {
  const config = await getConfig();
  if (!config.serverUrl) throw new Error('请先配置服务器地址');

  const res = await fetch(`${config.serverUrl}/api${path}`);
  if (!res.ok) throw new Error(`请求失败: ${res.status}`);
  return res.json();
}

async function fetchCategories() {
  const data = await publicRequest('/');
  return (data?.catelogs || []).filter(c => c !== '全部工具');
}

async function fetchTools() {
  const data = await publicRequest('/');
  return data?.tools || [];
}

async function addTool(tool) {
  return apiRequest('POST', '/admin/tool', {
    name: tool.name || '',
    url: tool.url || '',
    logo: tool.logo || '',
    catelog: tool.catelog || '',
    desc: tool.desc || '',
    sort: tool.sort || 0,
    hide: tool.hide || false
  });
}

async function updateTool(id, tool) {
  return apiRequest('PUT', `/admin/tool/${id}`, {
    name: tool.name,
    url: tool.url,
    logo: tool.logo || '',
    catelog: tool.catelog,
    desc: tool.desc || '',
    sort: tool.sort || 0,
    hide: tool.hide || false
  });
}

async function deleteTool(id) {
  return apiRequest('DELETE', `/admin/tool/${id}`);
}

async function testConnection() {
  const config = await getConfig();
  if (!config.serverUrl) throw new Error('请先配置服务器地址');

  const res = await fetch(`${config.serverUrl}/api/`);
  if (!res.ok) throw new Error(`服务器连接失败: ${res.status}`);
  const data = await res.json();

  if (config.apiToken) {
    try {
      await apiRequest('GET', '/admin/all');
      return { connected: true, authenticated: true, title: data?.setting?.title || '' };
    } catch {
      return { connected: true, authenticated: false, title: data?.setting?.title || '' };
    }
  }

  return { connected: true, authenticated: false, title: data?.setting?.title || '' };
}
