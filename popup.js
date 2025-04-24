document.addEventListener('DOMContentLoaded', async () => {
  // Prepare the DOM elements ----------
  const elements = {
    copyUrl: document.getElementById('copyUrl'),
    copyTitle: document.getElementById('copyTitle'),
    copyMarkdown: document.getElementById('copyMarkdown'),
    copyHtml: document.getElementById('copyHtml'),
    status: document.getElementById('status')
  };

  const showStatus = (message) => {
    elements.status.textContent = message;
    setTimeout(() => elements.status.textContent = '', 2000);
  };

  // Clipboard functions ----------
  const copyTextToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showStatus('Copié !');
    } catch (err) {
      showStatus(`Erreur: ${err}`);
    }
  };

  const copyHtmlToClipboard = async (title, url) => {
    try {
      const html = `<a href="${url}">${title}</a>`;
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([title], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' })
        })
      ]);
      showStatus('Copié !');
    } catch (err) {
      showStatus(`Erreur: ${err}`);
    }
  };

  // Get current tab info (url, title) ----------
  const getCurrentTabInfo = async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    const url = tab.url;
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.title
    });
    return { url, title: results[0].result };
  };

  // Save last action for next time
  const saveLastAction = (actionName) => {
    chrome.storage.local.set({ lastAction: actionName });
  };

  // Actions dictionary
  const actions = {
    copyUrl: async () => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      await copyTextToClipboard(tabs[0].url);
      saveLastAction('copyUrl');
    },
    copyTitle: async () => {
      const { title } = await getCurrentTabInfo();
      await copyTextToClipboard(title);
      saveLastAction('copyTitle');
    },
    copyMarkdown: async () => {
      const { url, title } = await getCurrentTabInfo();
      await copyTextToClipboard(`[${title}](${url})`);
      saveLastAction('copyMarkdown');
    },
    copyHtml: async () => {
      const { url, title } = await getCurrentTabInfo();
      await copyHtmlToClipboard(title, url);
      saveLastAction('copyHtml');
    }
  };

  // Set up button event listeners ----------
  Object.keys(actions).forEach(action => {
    elements[action].addEventListener('click', actions[action]);
  });

  // Execute default action based on last choice or default to copyHtml
  try {
    const result = await chrome.storage.local.get('lastAction');
    const lastAction = result.lastAction || 'copyHtml'; // Default to copyHtml if no previous action
    await actions[lastAction]();
  } catch (err) {
    showStatus(`Erreur: ${err}`);
  }
});