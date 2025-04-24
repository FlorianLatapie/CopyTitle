document.addEventListener('DOMContentLoaded', function () {
  const copyUrlBtn = document.getElementById('copyUrl');
  const copyTitleBtn = document.getElementById('copyTitle');
  const copyMarkdownBtn = document.getElementById('copyMarkdown');
  const copyHtmlBtn = document.getElementById('copyHtml');
  const statusDiv = document.getElementById('status');

  function showStatus(message) {
    statusDiv.textContent = message;
    setTimeout(function () {
      statusDiv.textContent = '';
    }, 2000);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function () {
      showStatus('Copié ! ici');
    }, function (err) {
      showStatus('Erreur: ' + err);
    });
  }

  // Option 1: Copy only the URL
  copyUrlBtn.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      copyToClipboard(tabs[0].url);
    });
  });

  // Option 2: Copy only the title
  copyTitleBtn.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => document.title
      }).then(results => {
        if (results && results[0]) {
          copyToClipboard(results[0].result);
        }
      });
    });
  });

  // Option 3: Copy the title and URL in Markdown format
  copyMarkdownBtn.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const url = tabs[0].url;
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => document.title
      }).then(results => {
        if (results && results[0]) {
          const title = results[0].result;
          const markdown = `[${title}](${url})`;
          copyToClipboard(markdown);
        }
      });
    });
  });

  // Option 4: Copy the title and URL in HTML format
  // two types of content to put : text/plain for title and text/html for url
  // use blob notation
  copyHtmlBtn.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const url = tabs[0].url;
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => document.title
      }).then(results => {
        if (results && results[0]) {
          const title = results[0].result;
          const html = `<a href="${url}">${title}</a>`;
          navigator.clipboard.write([
            new ClipboardItem({
              'text/plain': new Blob([title], { type: 'text/plain' }),
              'text/html': new Blob([html], { type: 'text/html' })
            })
          ]).then(function () {
            showStatus('Copié !');
          }, function (err) {
            showStatus('Erreur: ' + err);
          });
        }
      });
    });
  });

  const url = tabs[0].url;
  chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => document.title
  }).then(results => {
    if (results && results[0]) {
      const title = results[0].result;
      const html = `<a href="${url}">${title}</a>`;
      navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([title], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' })
        })
      ])
    }
  });

});