chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-nav',
    title: '保存到导航站',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-nav') {
    // Store page info so popup can use it
    await chrome.storage.session.set({
      contextSave: {
        title: tab.title || info.selectionText || '',
        url: info.pageUrl || tab.url || '',
        favIconUrl: tab.favIconUrl || ''
      }
    });
    // Open the popup
    chrome.action.openPopup();
  }
});
