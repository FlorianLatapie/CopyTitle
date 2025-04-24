document.addEventListener('DOMContentLoaded', () => {
  const buttons = {
    copyUrl: () => copyToClipboard(tabs[0].url),
    copyTitle: () => executeScriptAndCopy(() => document.title),
    copyMarkdown: () => executeScriptAndCopy((title) => `[${title}](${tabs[0].url})`),
    copyHtml: () => executeScriptAndCopy((title) => ({
      'text/plain': title,
      'text/html': `<a href="${tabs[0].url}">${title}</a>`
    }), true)
  };

  const statusDiv = document.getElementById('status');

  const showStatus = (message) => {
    statusDiv.textContent = message;
    setTimeout(() => statusDiv.textContent = '', 2000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => showStatus('Copié !'), (err) => showStatus('Erreur: ' + err));
  };

  const executeScriptAndCopy = (func, isHtml = false) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, func }).then((results) => {
        if (results && results[0]) {
          const result = results[0].result;
          if (isHtml) {
            navigator.clipboard.write([new ClipboardItem({
              'text/plain': new Blob([result['text/plain']], { type: 'text/plain' }),
              'text/html': new Blob([result['text/html']], { type: 'text/html' })
            })]).then(() => showStatus('Copié !'), (err) => showStatus('Erreur: ' + err));
          } else {
            copyToClipboard(result);
          }
        }
      });
    });
  };

  Object.keys(buttons).forEach((id) => {
    document.getElementById(id).addEventListener('click', buttons[id]);
  });
});