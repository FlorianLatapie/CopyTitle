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

  // Actions for each button ----------

  // Option 1: Copy URL
  elements.copyUrl.addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    await copyTextToClipboard(tabs[0].url);
  });

  // Option 2: Copy Title
  elements.copyTitle.addEventListener('click', async () => {
    const { title } = await getCurrentTabInfo();
    await copyTextToClipboard(title);
  });

  // Option 3: Copy Markdown
  // Format: [title](url)
  elements.copyMarkdown.addEventListener('click', async () => {
    const { url, title } = await getCurrentTabInfo();
    await copyTextToClipboard(`[${title}](${url})`);
  });

  // Option 4: Copy HTML
  // Format: <a href="url">title</a>
  elements.copyHtml.addEventListener('click', async () => {
    const { url, title } = await getCurrentTabInfo();
    await copyHtmlToClipboard(title, url);
  });

  // Default action (copy HTML)
  try {
    const { url, title } = await getCurrentTabInfo();
    await copyHtmlToClipboard(title, url);
  } catch (err) {
    showStatus(`Erreur: ${err}`);
  }
});